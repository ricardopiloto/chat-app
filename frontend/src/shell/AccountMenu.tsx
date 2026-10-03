import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { auth, avatarUrl } from "../api";
import { Avatar, Button, Icon, MonoLabel } from "../components/ui";
import { DISPLAY_NAME_MAX_CHARS } from "../lib/displayName";
import { LOCALES, getLocale, setLocale, t } from "../i18n";
import { useSession } from "../session/session";
import { ThemeSwitch } from "./ThemeSwitch";
import { SignOutDialog } from "./SignOutDialog";
import { useShell } from "./state";

const row = "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-body-md text-on-surface transition-colors hover:bg-surface-container-highest";

// Popover of actions, not a form: open your account page, pick a language and a theme, rename
// yourself, sign out. The photo is changed on the account page.
export function AccountMenu(props: { onClose: () => void }) {
  const session = useSession();
  const shell = useShell();
  const me = () => session.account()!;
  let root: HTMLDivElement | undefined;

  const [name, setName] = createSignal(me().display_name ?? "");
  const [saving, setSaving] = createSignal(false);
  const [problem, setProblem] = createSignal("");
  const [signingOut, setSigningOut] = createSignal(false);

  createEffect(() => {
    const away = (event: PointerEvent) => !signingOut() && root && !root.contains(event.target as Node) && props.onClose();
    const escape = (event: KeyboardEvent) => event.key === "Escape" && !signingOut() && props.onClose();
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", escape);
    onCleanup(() => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", escape);
    });
  });

  async function saveName() {
    setSaving(true);
    setProblem("");
    try {
      session.updateAccount(await auth.setDisplayName(name().trim() || null));
    } catch {
      setProblem(t("shell.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div ref={root} role="menu" class="absolute bottom-full left-2 z-40 mb-2 flex w-72 max-w-[calc(100vw-1rem)] flex-col gap-1 rounded-lg border border-outline-variant bg-surface-container-high p-2 shadow-floating">
        <div class="flex items-center gap-3 px-2 py-2">
          <Avatar name={me().display_name || me().handle} src={me().has_avatar ? avatarUrl(me().id) : undefined} />
          <div class="min-w-0">
            <p class="truncate text-body-md font-semibold">{me().display_name || me().handle}</p>
            <p class="truncate font-code text-label-code-sm text-on-surface-variant">@{me().handle}</p>
          </div>
        </div>

        <form class="flex items-end gap-2 px-2 pb-2" onSubmit={(e) => { e.preventDefault(); void saveName(); }}>
          <label class="flex min-w-0 flex-1 flex-col gap-1">
            <MonoLabel>{t("shell.displayName")}</MonoLabel>
            <input class="min-w-0 rounded-md border border-outline-variant bg-surface-container-low px-2 py-1.5 text-body-md focus:border-primary-container focus:outline-none" maxlength={DISPLAY_NAME_MAX_CHARS} value={name()} placeholder={me().handle} onInput={(e) => setName(e.currentTarget.value)} />
          </label>
          <Button type="submit" disabled={saving() || name().trim() === (me().display_name ?? "")}>
            {saving() ? t("shell.saving") : t("shell.save")}
          </Button>
        </form>
        <Show when={problem()}>
          <p class="px-3 pb-1 text-body-sm text-error" role="alert">{problem()}</p>
        </Show>

        <button type="button" role="menuitem" class={row} onClick={() => { props.onClose(); shell.go("/account"); }}>
          <Icon name="manage_accounts" class="text-[20px] text-on-surface-variant" />
          {t("shell.myAccount")}
        </button>

        <div class="flex items-center justify-between gap-3 px-3 py-2">
          <span class="flex items-center gap-3 text-body-md"><Icon name="translate" class="text-[20px] text-on-surface-variant" />{t("shell.language")}</span>
          <select class="rounded-md border border-outline-variant bg-surface-container-low px-2 py-1 text-body-sm" aria-label={t("shell.language")} value={getLocale()} onChange={(e) => setLocale(e.currentTarget.value as (typeof LOCALES)[number]["code"])}>
            <For each={LOCALES}>{(entry) => <option value={entry.code}>{entry.name}</option>}</For>
          </select>
        </div>

        <div class="flex items-center justify-between gap-3 px-3 py-2">
          <span class="flex items-center gap-3 text-body-md"><Icon name="contrast" class="text-[20px] text-on-surface-variant" />{t("shell.theme")}</span>
          <ThemeSwitch />
        </div>

        <hr class="my-1 border-outline-variant" />
        <button type="button" role="menuitem" class={`${row} !text-error`} onClick={() => setSigningOut(true)}>
          <Icon name="logout" class="text-[20px]" />
          {t("shell.signOut")}
        </button>
      </div>
      <SignOutDialog open={signingOut()} onClose={() => setSigningOut(false)} />
    </>
  );
}
