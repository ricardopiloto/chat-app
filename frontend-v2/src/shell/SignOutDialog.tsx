import { Show, createSignal } from "solid-js";
import { Button, Dialog, Icon, MonoLabel } from "../components/ui";
import { t } from "../i18n";
import { useSession } from "../session/session";

// Leaving always asks first, and says what it does on this device. Escape cancels.
export function SignOutDialog(props: { open: boolean; onClose: () => void }) {
  const session = useSession();
  const [busy, setBusy] = createSignal(false);
  const [failed, setFailed] = createSignal(false);

  async function confirm() {
    setBusy(true);
    setFailed(false);
    try {
      await session.logout();
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <Dialog open={props.open} title={t("shell.signOutTitle")} onClose={props.onClose} icon="logout" accent>
      <div class="flex flex-col gap-4">
        <p class="!mb-0 !mt-3">{t("shell.signOutAsk", { handle: session.account()?.handle ?? "" })}</p>
        <div class="notice warn flex items-start gap-3">
          <Icon name="lock_reset" class="mt-0.5 text-primary" />
          <div>
            <MonoLabel class="!text-primary">{t("shell.signOutNoticeTitle")}</MonoLabel>
            <p class="!m-0 mt-1 text-body-sm text-on-surface">{t("shell.signOutNotice")}</p>
          </div>
        </div>
        <Show when={failed()}>
          <p class="notice error !mb-0" role="alert">{t("shell.logoutError")}</p>
        </Show>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <Button onClick={props.onClose} data-autofocus>
            {t("shell.cancel")}
            <kbd class="rounded bg-surface-container-highest px-1.5 py-0.5 font-code text-label-code-sm">Esc</kbd>
          </Button>
          <Button variant="primary" disabled={busy()} onClick={() => void confirm()}>
            <Icon name="lock" />
            {t("shell.confirmSignOut")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
