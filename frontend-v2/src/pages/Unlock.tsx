import { Show, createSignal } from "solid-js";
import { AuthField, AuthFrame, bindValue } from "../auth/AuthFrame";
import { Avatar, Badge, Button, Dialog, Icon, MonoLabel } from "../components/ui";
import { avatarUrl } from "../api";
import { IdentityUnlockError } from "../crypto/identity";
import { t } from "../i18n";
import { useSession } from "../session/session";

const MIN_PASSWORD = 8;

// Shown when the server knows who you are but this tab holds no unlocked identity: a reload, a new
// device, or cleared site data. The password opens the vault; "Recuperar identidade" is always
// available because losing the password is exactly when it is needed.
export function Unlock() {
  const session = useSession();
  const me = () => session.account()!;
  const [password, setPassword] = createSignal("");
  const [revealed, setRevealed] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [problem, setProblem] = createSignal<"" | "bad_password" | "missing_vault" | "short" | "failed">("");
  const [confirming, setConfirming] = createSignal(false);

  // What the screen tells the person depends on where the vault could (not) be found.
  const nothingAnywhere = () => problem() === "missing_vault" || session.lockReason() === "missing_vault";
  const noLocalCopy = () => nothingAnywhere() || session.lockReason() === "no_local";

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (busy()) return;
    setProblem("");
    setBusy(true);
    try {
      await session.unlock(password());
    } catch (error) {
      setProblem(error instanceof IdentityUnlockError ? error.reason : "failed");
    } finally {
      setBusy(false);
    }
  }

  async function recover() {
    if (password().length < MIN_PASSWORD) {
      setConfirming(false);
      setProblem("short");
      return;
    }
    setBusy(true);
    try {
      await session.recover(password());
    } catch {
      setProblem("failed");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  const name = () => me().display_name || me().handle;

  return (
    <AuthFrame
      headline={t("unlock.headline")}
      text={t("unlock.pitch")}
      features={[
        { icon: "key", title: t("unlock.featureKeys"), text: t("unlock.featureKeysText") },
        { icon: "verified_user", title: t("unlock.featureZero"), text: t("unlock.featureZeroText") },
      ]}
    >
      <form class="flex flex-col gap-5" onSubmit={submit} noValidate>
        <Badge tone="primary" mono icon="shield">
          {t(noLocalCopy() ? "unlock.chipMissing" : "unlock.chipLocked")}
        </Badge>
        <div>
          <h2 class="font-display text-headline-lg">{t("unlock.title")}</h2>
          <p class="mt-2 text-body-md text-on-surface-variant">{t("unlock.intro", { handle: me().handle })}</p>
        </div>

        <div class="flex items-center justify-between gap-4 rounded-lg bg-surface-container p-4">
          <div class="flex items-center gap-3">
            <Avatar name={name()} src={me().has_avatar ? avatarUrl(me().id) : undefined} size="lg" />
            <div class="flex flex-col">
              <span class="font-display text-headline-sm">{name()}</span>
              <span class="font-code text-label-code-sm text-secondary">
                @{me().handle} · {t("unlock.sessionActive")}
              </span>
            </div>
          </div>
          <Button onClick={() => void session.logout()}>
            <Icon name="switch_account" />
            {t("unlock.switch")}
          </Button>
        </div>

        <div class="notice warn flex items-start gap-3" role="status">
          <Icon name="warning" class="mt-0.5 text-primary" />
          <div>
            <MonoLabel class="!text-primary">{t("unlock.noticeTitle")}</MonoLabel>
            <p class="mt-1 text-body-sm">{t(noLocalCopy() && !nothingAnywhere() ? "unlock.noticeMissing" : "unlock.noticeBody")}</p>
          </div>
        </div>

        <AuthField
          label={t("unlock.password")}
          aside={<span class="font-code text-label-code-sm text-on-surface-variant">{t("unlock.kdf")}</span>}
          lead={<Icon name="lock" class="text-[18px]" />}
          trail={
            <button type="button" class="grid h-8 w-8 place-items-center rounded-full text-on-surface-variant hover:text-on-surface" title={revealed() ? t("auth.hidePassword") : t("auth.showPassword")} aria-label={revealed() ? t("auth.hidePassword") : t("auth.showPassword")} aria-pressed={revealed()} onClick={() => setRevealed(!revealed())}>
              <Icon name={revealed() ? "visibility_off" : "visibility"} class="text-[20px]" />
            </button>
          }
          hint={t("unlock.passwordHint")}
          error={problem() === "bad_password" ? t("auth.badPassword") : problem() === "short" ? t("auth.passwordShort") : problem() === "failed" ? t("auth.genericError") : undefined}
        >
          <input name="password" type={revealed() ? "text" : "password"} autocomplete="current-password" required {...bindValue(password, setPassword)} />
        </AuthField>

        <Show when={nothingAnywhere()}>
          <p class="notice info" role="status">
            {t("auth.missingVault")}
          </p>
        </Show>

        <Button variant="primary" type="submit" disabled={busy()} class="!py-3.5 text-body-lg">
          <Icon name="key" />
          {busy() ? t("auth.waiting") : t("unlock.button")}
        </Button>

        <div class="flex items-center gap-4 font-code text-label-code-sm text-on-surface-variant" aria-hidden="true">
          <span class="h-px flex-1 bg-outline-variant" />
          {t("auth.or")}
          <span class="h-px flex-1 bg-outline-variant" />
        </div>

        <div class="flex flex-col gap-3 rounded-lg bg-surface-container p-4 tablet:flex-row tablet:items-center tablet:justify-between">
          <div>
            <h3 class="flex items-center gap-2 font-display text-headline-sm">
              <Icon name="history" class="text-primary" />
              {t("unlock.recoverTitle")}
            </h3>
            <p class="mt-1 text-body-sm text-on-surface-variant">{t("unlock.recoverText")}</p>
          </div>
          <Button disabled={busy()} onClick={() => setConfirming(true)}>
            <Icon name="autorenew" />
            {t("unlock.recoverButton")}
          </Button>
        </div>

        <p class="text-center text-body-sm text-on-surface-variant">
          {t("unlock.notYou", { handle: me().handle })}{" "}
          <button type="button" class="text-primary underline" onClick={() => void session.logout()}>
            {t("unlock.switchLink")}
          </button>
        </p>
      </form>

      <Dialog open={confirming()} title={t("unlock.confirmTitle")} onClose={() => setConfirming(false)}>
        <p>{t("auth.recoveryWarning")}</p>
        <div class="flex flex-wrap justify-end gap-3">
          <Button onClick={() => setConfirming(false)}>{t("shell.cancel")}</Button>
          <Button variant="danger" disabled={busy()} onClick={() => void recover()}>
            <Icon name="autorenew" />
            {t("auth.generateKeys")}
          </Button>
        </div>
      </Dialog>
    </AuthFrame>
  );
}
