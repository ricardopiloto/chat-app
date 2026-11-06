import { Show, createSignal, onCleanup, onMount } from "solid-js";
import { t } from "../i18n";
import { Button, Dialog } from "../components/ui";
import { useCall } from "../voice/callSession";

export type UpdateState = { kind: "notify" | "ready"; version: string; url: string };

export function UpdateToast() {
  const call = useCall();
  const [state, setState] = createSignal<UpdateState | null>(null);
  const [dismissed, setDismissed] = createSignal<UpdateState | null>(null);
  const [confirming, setConfirming] = createSignal(false);
  onMount(() => {
    const native = window.mesaNative;
    if (!native) return;
    let receivedEvent = false;
    const stop = native.onUpdateState(value => { receivedEvent = true; setState(value); });
    void native.updateState().then(value => { if (value && !receivedEvent) setState(value); }).catch(() => undefined);
    onCleanup(stop);
  });
  const visible = () => {
    const current = state();
    const hidden = dismissed();
    return current && (current.kind !== hidden?.kind || current.version !== hidden.version) ? current : null;
  };
  function restart() {
    if (call.live()) { setConfirming(true); return; }
    void window.mesaNative?.restartForUpdate();
  }
  return <>
    <Show when={visible()}>{update =>
      <div role="status" class="fixed left-1/2 top-20 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 rounded-xl border border-outline bg-surface-container-high p-4 shadow-floating text-on-surface">
        <p>{update().kind === "ready" ? t("shell.updateReady", { version: update().version }) : t("shell.updateAvailable", { version: update().version })}</p>
        <div class="mt-3 flex items-center gap-3">
          <Show when={update().kind === "ready"} fallback={<a class="font-semibold underline" href={update().url} target="_blank" rel="noopener noreferrer">{t("shell.updateManually")}</a>}>
            <button type="button" class="font-semibold underline" onClick={restart}>{t("shell.updateRestartNow")}</button>
          </Show>
          <button type="button" class="underline" onClick={() => setDismissed(update())}>{t("shell.updateLater")}</button>
        </div>
      </div>
    }</Show>
    <Dialog open={confirming()} title={t("shell.updateRestartNow")} onClose={() => setConfirming(false)}>
      <p>{t("shell.updateRestartInCall")}</p>
      <div class="mt-4 flex justify-end gap-2">
        <Button onClick={() => setConfirming(false)}>{t("shell.cancel")}</Button>
        <Button variant="primary" onClick={() => { setConfirming(false); void window.mesaNative?.restartForUpdate(); }}>{t("shell.updateRestartNow")}</Button>
      </div>
    </Dialog>
  </>;
}
