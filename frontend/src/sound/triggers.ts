// Plays sound effects from shell realtime events and call-session arrival notifications.
import { createEffect, onCleanup } from "solid-js";
import { useCall } from "../voice/callSession";
import { useShell } from "../shell/state";
import { notify, preloadEffects } from "./effects";

export function useSoundEffects(): void {
  const shell = useShell();
  const call = useCall();

  preloadEffects();

  // A new notification (mention or reply). The visible bell is handled elsewhere and is unaffected.
  createEffect(() => {
    const stop = shell.subscribe((message) => {
      if (message.event !== "notification.created" || call.deafened()) return;
      const channelId = String(message.payload.channel_id ?? "");
      const inView = channelId === shell.route().channelId && document.visibilityState === "visible" && document.hasFocus();
      if (!inView) notify("mention");
    });
    onCleanup(stop);
  });

  // Remote call-join sounds are emitted from callSession on LiveKit ParticipantConnected
  // (after the participant tile refresh), not from HTTP occupancy.
}
