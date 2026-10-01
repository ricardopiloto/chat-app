import type { VoiceChannelOccupancy } from "../api/client";

export type VoiceState = Record<string, Record<string, boolean>>;

// REST returns a server snapshot; WS sends the changed channel only.
export function voiceOccupancyUpdates(
  payload: Record<string, unknown>,
): VoiceChannelOccupancy[] {
  if (
    typeof payload.channel_id === "string" &&
    Array.isArray(payload.occupants)
  ) {
    return [payload as unknown as VoiceChannelOccupancy];
  }
  return Array.isArray(payload.channels)
    ? (payload.channels as VoiceChannelOccupancy[])
    : [];
}

export function mergeVoiceOccupancy(
  previous: VoiceState,
  serverId: string,
  updates: VoiceChannelOccupancy[],
): VoiceState {
  return {
    ...previous,
    [serverId]: {
      ...previous[serverId],
      ...Object.fromEntries(
        updates.map((channel) => [
          channel.channel_id,
          channel.occupants.length > 0,
        ]),
      ),
    },
  };
}
