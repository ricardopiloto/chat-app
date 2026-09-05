import type { Channel } from "../api/client";

export type ActiveChannelInfo = {
  id: string;
  name: string;
  type: Channel["type"];
};

let active: ActiveChannelInfo | null = null;

/** Set by ChannelRoute when a channel page is shown; cleared on leave. */
export function setActiveChannel(info: ActiveChannelInfo | null): void {
  active = info;
}

export function getActiveChannel(): ActiveChannelInfo | null {
  return active;
}

/** Name for Ctrl+F seed when viewing a text channel; otherwise null. */
export function getActiveTextChannelName(): string | null {
  if (!active || active.type !== "text") return null;
  return active.name;
}
