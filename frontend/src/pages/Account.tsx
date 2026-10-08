import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { ApiError, auth, avatarUrl } from "../api";
import { MAX_IMAGE_BYTES, PROFILE_IMAGE_MEDIA_TYPES } from "../api/limits";
import { Avatar, Badge, Button, Card, Icon, MonoLabel, Segmented } from "../components/ui";
import { DISPLAY_NAME_MAX_CHARS } from "../lib/displayName";
import { LOCALES, getLocale, setLocale, t, type AppLocale } from "../i18n";
import { useSession } from "../session/session";
import { setThemeMode, themeMode, type ThemeMode } from "../shell/theme";
import { useShell } from "../shell/state";
import { AudioVideoSettings } from "../voice/AudioVideoSettings";

const NAV = [
  { id: "profile", icon: "manage_accounts", label: "account.navProfile" },
  { id: "audio-video", icon: "graphic_eq", label: "call.settings.nav" },
  { id: "appearance", icon: "palette", label: "account.navAppearance" },
];

// "My account": the part of the profile page the backend supports. Name, photo, language and
// theme only; there is no recovery e-mail, passkey, device list or peer-to-peer visibility.
export function Account() {
  const session = useSession();
  const shell = useShell();
  const me = () => session.account()!;
  const [name, setName] = createSignal(me().display_name ?? "");
  const [editing, setEditing] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [note, setNote] = createSignal<{ tone: "error" | "info"; text: string }>();
  const [currentPassword, setCurrentPassword] = createSignal("");
  const [nextPassword, setNextPassword] = createSignal("");
  const [confirmPassword, setConfirmPassword] = createSignal("");
  const [recoveryPassword, setRecoveryPassword] = createSignal("");
  const [recoveryCode, setRecoveryCode] = createSignal("");
  const [recoverySaved, setRecoverySaved] = createSignal(false);
  let recoveryMaterial: Awaited<ReturnType<typeof session.prepareRecoveryKey>> | undefined;
  // The avatar URL never changes, so a counter forces the browser to fetch the new image.
  const [revision, setRevision] = createSignal(0);
  const photo = () => (me().has_avatar ? `${avatarUrl(me().id)}?v=${revision()}` : undefined);

  createEffect(() => {
    const leave = (event: KeyboardEvent) => event.key === "Escape" && !editing() && void shell.leaveAccount();
    window.addEventListener("keydown", leave);
    onCleanup(() => window.removeEventListener("keydown", leave));
  });

  async function run(action: () => Promise<void>, failure: string) {
    setBusy(true);
    setNote(undefined);
    try {
      await action();
    } catch {
      setNote({ tone: "error", text: t(failure) });
    } finally {
      setBusy(false);
    }
  }

  const saveName = () =>
    run(async () => {
      session.updateAccount(await auth.setDisplayName(name().trim() || null));
      setEditing(false);
    }, "shell.saveError");

  function pickPhoto(file: File | undefined) {
    if (!file) return;
    if (!PROFILE_IMAGE_MEDIA_TYPES.has(file.type)) return setNote({ tone: "error", text: t("account.photoType") });
    if (file.size > MAX_IMAGE_BYTES) return setNote({ tone: "error", text: t("account.photoSize") });
    void run(async () => {
      session.updateAccount(await auth.uploadAvatar(file, file.type));
      setRevision((n) => n + 1);
    }, "shell.avatarError");
  }

  async function savePassword(event: SubmitEvent) {
    event.preventDefault();
    if (nextPassword().length < 8) return setNote({ tone: "error", text: t("auth.passwordShort") });
    if (nextPassword() !== confirmPassword()) return setNote({ tone: "error", text: t("account.passwordMismatch") });
    await run(async () => {
      try {
        await session.changePassword(currentPassword(), nextPassword());
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setNote({ tone: "error", text: t("account.passwordWrong") });
          return;
        }
        throw error;
      }
      setCurrentPassword("");
      setNextPassword("");
      setConfirmPassword("");
      setNote({ tone: "info", text: t("account.passwordSaved") });
    }, "shell.saveError");
  }

  async function beginRecoveryKey() {
    await run(async () => {
      recoveryMaterial = await session.prepareRecoveryKey();
      setRecoveryCode(recoveryMaterial.code);
      setRecoverySaved(false);
    }, "shell.saveError");
  }

  async function saveRecoveryKey(event: SubmitEvent) {
    event.preventDefault();
    if (!recoveryMaterial) return;
    if (!recoverySaved()) return setNote({ tone: "error", text: t("recover.savedRequired") });
    await run(async () => {
      try {
        await session.saveRecoveryKey(recoveryPassword(), recoveryMaterial!);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setNote({ tone: "error", text: t("account.passwordWrong") });
          return;
        }
        throw error;
      }
      recoveryMaterial = undefined;
      setRecoveryCode("");
      setRecoveryPassword("");
      setRecoverySaved(false);
      setNote({ tone: "info", text: t("account.recoverySaved") });
    }, "shell.saveError");
  }

  const removePhoto = () =>
    run(async () => {
      await auth.removeAvatar();
      session.updateAccount({ ...me(), has_avatar: false });
    }, "shell.avatarError");

  return (
    <div class="mx-auto flex max-w-5xl flex-col gap-6 p-4 tablet:p-8 desktop:grid desktop:grid-cols-[220px_minmax(0,1fr)]">
      <nav class="flex flex-row gap-2 overflow-x-auto desktop:flex-col" aria-label={t("account.settings")}>
        <MonoLabel class="hidden px-3 desktop:block">{t("account.settings")}</MonoLabel>
        <For each={NAV}>
          {(item, index) => (
            <a href={`#${item.id}`} class="flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2 text-body-md transition-colors hover:bg-surface-container-high" classList={{ "bg-primary-container text-on-primary-container hover:!bg-primary-container": index() === 0 }}>
              <Icon name={item.icon} class="text-[20px]" />
              {t(item.label)}
            </a>
          )}
        </For>
        <Button class="mt-2 hidden desktop:inline-flex" onClick={() => void shell.leaveAccount()}>
          <Icon name="arrow_back" />
          {t("account.back")}
          <kbd class="rounded bg-surface-container-highest px-1.5 py-0.5 font-code text-label-code-sm">Esc</kbd>
        </Button>
      </nav>

      <div class="flex min-w-0 flex-col gap-6">
        <header>
          <MonoLabel>{t("account.crumb")}</MonoLabel>
          <h1 class="mt-1 font-display text-display-lg-mobile desktop:text-display-lg">{t("account.title")}</h1>
          <p class="mt-1 text-body-md text-on-surface-variant">{t("account.subtitle")}</p>
        </header>

        <section id="profile" class="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-6 tablet:flex-row tablet:items-center">
          <Avatar name={me().display_name || me().handle} src={photo()} online size="lg" />
          <div class="flex min-w-0 flex-1 flex-col gap-2">
            <Show
              when={editing()}
              fallback={
                <div class="flex items-center gap-2">
                  <h2 class="truncate font-display text-headline-lg">{me().display_name || me().handle}</h2>
                  <button type="button" class="grid h-8 w-8 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface" title={t("account.editName")} aria-label={t("account.editName")} onClick={() => setEditing(true)}>
                    <Icon name="edit" class="text-[18px]" />
                  </button>
                </div>
              }
            >
              <form class="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); void saveName(); }}>
                <input class="min-w-0 flex-1 rounded-md border border-primary-container bg-surface-container-lowest px-3 py-2 text-body-md focus:outline-none" aria-label={t("shell.displayName")} maxlength={DISPLAY_NAME_MAX_CHARS} value={name()} placeholder={me().handle} ref={(el) => queueMicrotask(() => el.focus())} onInput={(e) => setName(e.currentTarget.value)} onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setEditing(false); setName(me().display_name ?? ""); } }} />
                <Button variant="primary" type="submit" disabled={busy()}>{t("shell.save")}</Button>
                <Button onClick={() => { setEditing(false); setName(me().display_name ?? ""); }}>{t("shell.cancel")}</Button>
              </form>
            </Show>
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-code text-label-code-md text-on-surface-variant">@{me().handle}</span>
              <Badge tone="secure" mono icon="key">{t("account.identityChip")}</Badge>
            </div>
          </div>
        </section>

        <Show when={note()}>
          {(message) => <p class={`notice ${message().tone}`} role="alert">{message().text}</p>}
        </Show>

        <Card icon="add_a_photo" label={t("account.photoLabel")} title={t("account.photoTitle")}>
          <p class="text-body-sm text-on-surface-variant">{t("account.photoHint")}</p>
          <div class="flex flex-wrap gap-3">
            <label class="ui-button primary cursor-pointer" classList={{ "opacity-50": busy() }}>
              <Icon name="upload" />
              {t("account.photoChange")}
              <input type="file" class="sr-only" accept={[...PROFILE_IMAGE_MEDIA_TYPES].join(",")} disabled={busy()} onChange={(e) => { pickPhoto(e.currentTarget.files?.[0]); e.currentTarget.value = ""; }} />
            </label>
            <Show when={me().has_avatar}>
              <Button disabled={busy()} onClick={() => void removePhoto()}>
                <Icon name="delete" />
                {t("account.photoRemove")}
              </Button>
            </Show>
          </div>
        </Card>

        <Card icon="key" label={t("account.passwordLabel")} title={t("account.passwordTitle")}>
          <form class="flex flex-col gap-3" onSubmit={(event) => void savePassword(event)}>
            <label class="flex flex-col gap-1 text-body-sm">
              {t("account.passwordCurrent")}
              <input type="password" autocomplete="current-password" required class="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2" value={currentPassword()} onInput={(event) => setCurrentPassword(event.currentTarget.value)} />
            </label>
            <label class="flex flex-col gap-1 text-body-sm">
              {t("account.passwordNew")}
              <input type="password" autocomplete="new-password" required minLength={8} class="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2" value={nextPassword()} onInput={(event) => setNextPassword(event.currentTarget.value)} />
            </label>
            <label class="flex flex-col gap-1 text-body-sm">
              {t("account.passwordConfirm")}
              <input type="password" autocomplete="new-password" required minLength={8} class="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2" value={confirmPassword()} onInput={(event) => setConfirmPassword(event.currentTarget.value)} />
            </label>
            <Button variant="primary" type="submit" disabled={busy()}>{t("account.passwordSave")}</Button>
          </form>
        </Card>

        <Card icon="vpn_key" label={t("account.recoveryLabel")} title={t("account.recoveryTitle")}>
          <p class="text-body-sm text-on-surface-variant">
            {me().has_recovery_key ? t("account.recoveryReplace") : t("account.recoveryMissing")}
          </p>
          <Show when={recoveryCode()} fallback={
            <Button disabled={busy()} onClick={() => void beginRecoveryKey()}>
              {me().has_recovery_key ? t("account.recoveryReplaceButton") : t("account.recoveryCreate")}
            </Button>
          }>
            <form class="flex flex-col gap-3" onSubmit={(event) => void saveRecoveryKey(event)}>
              <code class="break-all rounded-md bg-surface-container-lowest px-3 py-2 font-code text-body-sm">{recoveryCode()}</code>
              <p class="text-body-sm text-on-surface-variant">{t("recover.setupOnce")}</p>
              <label class="flex flex-col gap-1 text-body-sm">
                {t("account.passwordCurrent")}
                <input type="password" autocomplete="current-password" required class="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2" value={recoveryPassword()} onInput={(event) => setRecoveryPassword(event.currentTarget.value)} />
              </label>
              <label class="flex items-start gap-3 text-body-sm">
                <input type="checkbox" class="mt-1" checked={recoverySaved()} onChange={(event) => setRecoverySaved(event.currentTarget.checked)} />
                <span>{t("recover.saved")}</span>
              </label>
              <Button variant="primary" type="submit" disabled={busy()}>{t("account.recoverySave")}</Button>
            </form>
          </Show>
        </Card>

        <AudioVideoSettings />

        <section id="appearance">
          <Card icon="translate" label={t("account.appearanceLabel")} title={t("account.appearanceTitle")}>
            <div class="flex flex-col gap-2">
              <MonoLabel>{t("shell.language")}</MonoLabel>
              <Segmented label={t("shell.language")} value={getLocale()} options={LOCALES.map((entry) => ({ value: entry.code, label: entry.name }))} onChange={(code: AppLocale) => setLocale(code)} />
            </div>
            <div class="flex flex-col gap-2">
              <MonoLabel>{t("shell.theme")}</MonoLabel>
              <Segmented
                label={t("shell.theme")}
                value={themeMode()}
                options={[
                  { value: "system" as ThemeMode, label: t("shell.system") },
                  { value: "light" as ThemeMode, label: t("shell.light") },
                  { value: "dark" as ThemeMode, label: t("shell.dark") },
                ]}
                onChange={setThemeMode}
              />
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
