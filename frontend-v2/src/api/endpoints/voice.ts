import { http, request } from "../http";
import type { GridLayout, KeyEnvelope, MediaFlags, SceneList, VoiceJoin, VoiceOccupancy } from "../types";

export const voice = {
  join: (channelId: string, flags: Pick<MediaFlags, "mic_on" | "cam_on">) => http.post<VoiceJoin>(`/api/channels/${channelId}/voice/join`, flags),
  leave: (channelId: string) => http.post<void>(`/api/channels/${channelId}/voice/leave`),
  /** Leave that survives the page closing (fire and forget). */
  leaveOnUnload: (channelId: string) => {
    void request<void>(`/api/channels/${channelId}/voice/leave`, { method: "POST", keepalive: true }).catch(() => undefined);
  },
  /** With no flags this is only a heartbeat that keeps the occupancy fresh. */
  reportMedia: (channelId: string, flags: MediaFlags = {}) => http.patch<void>(`/api/channels/${channelId}/voice/media`, flags),
  occupancy: (serverId: string) => http.get<VoiceOccupancy>(`/api/servers/${serverId}/voice-occupancy`),
  setE2ee: (channelId: string, enabled: boolean, intent?: string) =>
    http.post<{ e2ee_enabled: boolean }>(`/api/channels/${channelId}/voice/e2ee`, { enabled, intent }),
};

export const grid = {
  get: (channelId: string) => http.get<GridLayout>(`/api/channels/${channelId}/grid`),
  save: (channelId: string, layout: GridLayout) => http.put<GridLayout>(`/api/channels/${channelId}/grid`, layout),
  scenes: (channelId: string) => http.get<SceneList>(`/api/channels/${channelId}/scenes`),
};

export const keyEnvelopes = {
  publish: (serverId: string, accountId: string, sealedKeyB64: string) =>
    http.post<KeyEnvelope>(`/api/servers/${serverId}/key-envelopes`, { account_id: accountId, sealed_key: sealedKeyB64 }),
  mine: (serverId: string) => http.get<KeyEnvelope>(`/api/servers/${serverId}/key-envelopes/me`),
};
