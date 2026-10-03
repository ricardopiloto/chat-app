// Plays the two sound effects from the real-time events the shell already receives.
import { createEffect, onCleanup } from "solid-js";
import { useCall } from "../voice/callSession";
import { useShell } from "../shell/state";
import { arrivals } from "./arrivals";
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

  // Someone else joined the call I am in. Without a previous list nobody counts as arrived.
  createEffect(() => {
    const stop = shell.subscribeOccupancy(({ channelId, before, after }) => {
      if (call.deafened() || !call.live() || call.channelId() !== channelId) return;
      const prior = before ? new Set(before) : undefined;
      if (arrivals(prior, after, shell.meId()).length > 0) notify("callJoin");
    });
    onCleanup(stop);
  });
}
