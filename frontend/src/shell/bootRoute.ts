// The channel in the URL when this page loaded. Internal navigation does not change it.
const [, first, , kind, channelId] = location.pathname.split("/");
const bootChannelId = first === "servers" && kind === "channels" ? channelId : undefined;
let resolved = false;

export function needsExplicitConsent(channelId: string): boolean {
  return !resolved && !!bootChannelId && channelId === bootChannelId;
}

export function resolveBootChannel(): void {
  resolved = true;
}
