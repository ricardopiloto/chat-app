import { Show, createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { AuthField, AuthFrame, bindValue } from "../auth/AuthFrame";
import { Avatar, Badge, Button, Dialog, Icon, MonoLabel } from "../components/ui";
import { avatarUrl, useAuthedSrc } from "../api";
import { clearInstance, currentInstance, isNative } from "../api/instance";
import { IdentityUnlockError } from "../crypto/identity";
import { t } from "../i18n";
import { useSession } from "../session/session";

const MIN_PASSWORD = 8;

// Shown when the server knows who you are but this tab holds no unlocked identity: a reload, a new
// device, or cleared site data. The password opens the vault; "Recuperar identidade" is always
// available because losing the password is exactly when it is needed.
export function Unlock() {
  const session = useSession();
  const navigate = useNavigate();
  async function switchAccount() {
    await session.logout();
    if (!isNative()) navigate("/login", { replace: true });
  }
  const me = () => session.account()!;
  const avatar = useAuthedSrc(() => (me().has_avatar ? avatarUrl(me().id) : undefined));
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
    <AuthFrame single hideInstancePanel headline={t("unlock.returnTitle")} text={t("unlock.returnIntro")} features={[]}>
      <form class="flex flex-col gap-5" onSubmit={submit} noValidate>
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-outline-variant bg-surface-container p-4">
          <div class="flex min-w-0 items-center gap-3">
            <Avatar name={name()} src={avatar()} size="lg" />
            <div class="min-w-0">
              <p class="truncate font-display text-headline-sm">{name()}</p>
              <p class="truncate font-code text-label-code-sm text-on-surface-variant">@{me().handle}</p>
            </div>
          </div>
          <Badge tone="primary" mono icon="shield">{t("entry.onDevice")}</Badge>
        </div>
        <Show when={isNative() && currentInstance().baseUrl}>
          <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-outline-variant bg-surface-container p-4">
            <div class="min-w-0"><p class="text-label-code-sm text-on-surface-variant">{t("unlock.accountInstance")}</p><p class="break-all">{currentInstance().baseUrl}</p></div>
            <Button variant="secondary" class="entry-control" onClick={() => void switchAccount()}>{t("unlock.otherAccess")}</Button>
          </div>
        </Show>
        <div class="notice warn flex items-start gap-3" role="status">
          <Icon name="warning" class="mt-0.5 text-primary" />
          <div>
            <MonoLabel class="!text-primary">{t("unlock.noticeTitle")}</MonoLabel>
            <p class="mt-1 text-body-sm">{t(noLocalCopy() && !nothingAnywhere() ? "unlock.noticeMissing" : "unlock.noticeBody")}</p>
          </div>
        </div>

        <AuthField
          label={t("unlock.password")}
          lead={<Icon name="lock" class="text-[18px]" />}
          trail={
            <button type="button" class="grid h-10 w-12 place-items-center rounded-full text-on-surface-variant hover:text-on-surface" title={revealed() ? t("auth.hidePassword") : t("auth.showPassword")} aria-label={revealed() ? t("auth.hidePassword") : t("auth.showPassword")} aria-pressed={revealed()} onClick={() => setRevealed(!revealed())}>
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

        <Button variant="primary" type="submit" disabled={busy()} class="entry-control !py-3.5 text-body-lg">
          <Icon name="key" />
          {busy() ? t("auth.waiting") : t("unlock.button")}
        </Button>

        <div class="flex items-center gap-4 font-code text-label-code-sm text-on-surface-variant" aria-hidden="true">
          <span class="h-px flex-1 bg-outline-variant" />
          {t("auth.or")}
          <span class="h-px flex-1 bg-outline-variant" />
        </div>

        <p class="text-body-sm text-on-surface-variant"><strong>{t("unlock.helpTitle")}</strong> {t("unlock.helpText")}</p>
        <div class="flex flex-col gap-3 rounded-lg bg-surface-container p-4 tablet:flex-row tablet:items-center tablet:justify-between">
          <div>
            <h3 class="flex items-center gap-2 font-display text-headline-sm">
              <Icon name="history" class="text-primary" />
              {t("unlock.recoverTitle")}
            </h3>
            <p class="mt-1 text-body-sm text-on-surface-variant">{t("unlock.recoverText")}</p>
            <p class="mt-2 text-body-sm text-on-surface-variant">{t("auth.forgotVaultHelp")}</p>
          </div>
          <Button class="entry-control shrink-0 whitespace-nowrap" disabled={busy()} onClick={() => setConfirming(true)}>
            <Icon name="autorenew" />
            {t("unlock.recoverButton")}
          </Button>
        </div>

        <p class="text-center text-body-sm text-on-surface-variant">
          {t("unlock.notYou", { handle: me().handle })}{" "}
          <button type="button" class="inline-flex min-h-6 items-center text-primary underline" onClick={() => void switchAccount()}>
            {t("unlock.switchLink")}
          </button>
          <Show when={isNative()}>
            {" "}
            <button
              type="button"
              class="inline-flex min-h-6 items-center text-primary underline"
              onClick={() => {
                void (async () => {
                  try {
                    await session.logout();
                  } catch {
                    session.invalidate();
                  }
                  await clearInstance();
                })();
              }}
            >
              {t("instance.switch")}
            </button>
          </Show>
        </p>
      </form>

      <Dialog open={confirming()} title={t("unlock.confirmTitle")} onClose={() => setConfirming(false)}>
        <p>{t("auth.recoveryWarning")}</p>
        <div class="flex flex-wrap justify-end gap-3">
          <Button class="entry-control" onClick={() => setConfirming(false)}>{t("shell.cancel")}</Button>
          <Button variant="danger" class="entry-control" disabled={busy()} onClick={() => void recover()}>
            <Icon name="autorenew" />
            {t("auth.generateKeys")}
          </Button>
        </div>
      </Dialog>
    </AuthFrame>
  );
}
