import { http } from "../http";
import type { AccessReport, AclEntry, AclEntryInput, Channel, CreateChannelBody, Mentionable, Mute, MyMute } from "../types";

export const channels = {
  listForServer: (serverId: string) => http.get<Channel[]>(`/api/servers/${serverId}/channels`),
  get: (channelId: string) => http.get<Channel>(`/api/channels/${channelId}`),
  create: (serverId: string, body: CreateChannelBody) => http.post<Channel>(`/api/servers/${serverId}/channels`, body),
  update: (channelId: string, changes: { name?: string; visibility?: Channel["visibility"]; visible_to_new_members?: boolean }) =>
    http.patch<Channel>(`/api/channels/${channelId}`, changes),
  remove: (channelId: string) => http.delete(`/api/channels/${channelId}`),
  mentionables: (channelId: string) => http.get<Mentionable[]>(`/api/channels/${channelId}/mentionables`),
  markRead: (channelId: string, lastReadAt?: string) => http.put<void>(`/api/channels/${channelId}/read`, { last_read_at: lastReadAt }),
};

export const acl = {
  list: (channelId: string) => http.get<AclEntry[]>(`/api/channels/${channelId}/acl`),
  replace: (channelId: string, entries: AclEntryInput[]) => http.put<AclEntry[]>(`/api/channels/${channelId}/acl`, entries),
  inspect: (channelId: string, accountId: string) => http.get<AccessReport>(`/api/channels/${channelId}/access/${accountId}`),
};

export const mutes = {
  list: (channelId: string) => http.get<Mute[]>(`/api/channels/${channelId}/mutes`),
  mine: (channelId: string) => http.get<MyMute>(`/api/channels/${channelId}/mutes/me`),
  set: (channelId: string, accountId: string, durationMinutes: number) =>
    http.put<Mute>(`/api/channels/${channelId}/mutes/${accountId}`, { duration_minutes: durationMinutes }),
  clear: (channelId: string, accountId: string) => http.delete(`/api/channels/${channelId}/mutes/${accountId}`),
};
