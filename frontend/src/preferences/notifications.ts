import { createSignal } from "solid-js";

/** In-memory unseen channels for the current session (FR-016). */
const unseenByChannel = new Set<string>();
const [tick, setTick] = createSignal(0);

function bump() {
  setTick((n) => n + 1);
}

export function markUnseen(channelId: string) {
  if (!channelId) return;
  unseenByChannel.add(channelId);
  bump();
}

export function markSeen(channelId: string) {
  if (!channelId) return;
  if (unseenByChannel.delete(channelId)) bump();
}

export function removeChannel(channelId: string) {
  markSeen(channelId);
}

export function clearAllUnseen() {
  if (unseenByChannel.size === 0) return;
  unseenByChannel.clear();
  bump();
}

/** Reactive: call inside a tracking scope (component/effect). */
export function hasAnyUnseen(): boolean {
  tick();
  return unseenByChannel.size > 0;
}

export function unseenChannelIds(): string[] {
  tick();
  return [...unseenByChannel];
}
