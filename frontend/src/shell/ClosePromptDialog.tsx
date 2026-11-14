import { createSignal, onCleanup, onMount } from "solid-js";
import { Button, Dialog } from "../components/ui";
import { t } from "../i18n";

export function ClosePromptDialog() {
  const [pendingRequestId, setPendingRequestId] = createSignal<string | null>(null);

  onMount(() => {
    const native = window.mesaNative;
    if (!native) return;
    const stop = native.onClosePrompt(requestId => setPendingRequestId(requestId));
    onCleanup(stop);
  });

  function respond(choice: "tray" | "quit" | null) {
    const requestId = pendingRequestId();
    if (!requestId) return;
    setPendingRequestId(null);
    window.mesaNative?.respondToClosePrompt(requestId, choice);
  }

  return (
    <Dialog open={pendingRequestId() !== null} title={t("shell.closePromptTitle")} onClose={() => respond(null)}>
      <p>{t("shell.closePromptMessage")}</p>
      <div class="mt-4 flex flex-wrap justify-end gap-2">
        <Button variant="primary" onClick={() => respond("tray")}>{t("shell.closePromptTray")}</Button>
        <Button variant="primary" onClick={() => respond("quit")}>{t("shell.closePromptQuit")}</Button>
      </div>
    </Dialog>
  );
}
