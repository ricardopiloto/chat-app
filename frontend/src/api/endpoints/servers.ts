import { MEDIA_TYPE_HEADER, http, request } from "../http";
import type {
  AcceptInviteBody, CreateServerBody, Invite, InvitePreview, Member, Membership, Presence, RoleCapabilities,
  Server, ServerRole, WelcomeSettings,
} from "../types";

export const servers = {
  list: () => http.get<Server[]>("/api/servers"),
  create: (body: CreateServerBody) => http.post<Server>("/api/servers", body),
  remove: (serverId: string) => http.delete(`/api/servers/${serverId}`),
  imageUrl: (serverId: string) => `/api/servers/${serverId}/image`,
  setImage: (serverId: string, image: Blob | Uint8Array, mediaType: string) =>
    request<Server>(`/api/servers/${serverId}/image`, { method: "PUT", bytes: image, headers: { [MEDIA_TYPE_HEADER]: mediaType } }),
  removeImage: (serverId: string) => http.delete(`/api/servers/${serverId}/image`),
  welcome: (serverId: string) => http.get<WelcomeSettings>(`/api/servers/${serverId}/welcome`),
  updateWelcome: (serverId: string, changes: Partial<WelcomeSettings>) => http.patch<WelcomeSettings>(`/api/servers/${serverId}/welcome`, changes),
  members: (serverId: string) => http.get<Member[]>(`/api/servers/${serverId}/members`),
  presence: (serverId: string) => http.get<Presence>(`/api/servers/${serverId}/presence`),
  removeMember: (serverId: string, accountId: string) => http.delete(`/api/servers/${serverId}/members/${accountId}`),
  setMemberRole: (serverId: string, accountId: string, roleId: string | null) =>
    http.put<{ account_id: string; role_id: string | null }>(`/api/servers/${serverId}/members/${accountId}/role`, { role_id: roleId }),
};

export const roles = {
  list: (serverId: string) => http.get<ServerRole[]>(`/api/servers/${serverId}/roles`),
  create: (serverId: string, name: string, capabilities?: RoleCapabilities) =>
    http.post<ServerRole>(`/api/servers/${serverId}/roles`, { name, capabilities }),
  update: (serverId: string, roleId: string, changes: { name?: string; can_create_channels?: boolean; capabilities?: RoleCapabilities }) =>
    http.patch<ServerRole>(`/api/servers/${serverId}/roles/${roleId}`, changes),
  remove: (serverId: string, roleId: string) => http.delete(`/api/servers/${serverId}/roles/${roleId}`),
  reorder: (serverId: string, order: { id: string; position: number }[]) =>
    http.put<ServerRole[]>(`/api/servers/${serverId}/roles/positions`, { roles: order }),
  setMembers: (serverId: string, roleId: string, memberIds: string[]) =>
    http.put<ServerRole>(`/api/servers/${serverId}/roles/${roleId}/members`, { member_ids: memberIds }),
};

export const invites = {
  create: (serverId: string, options: { include_history?: boolean; welcome_channel_id?: string; expires_in_seconds?: number; key_seed?: string } = {}) =>
    http.post<Invite>(`/api/servers/${serverId}/invites`, options),
  preview: (code: string) => http.get<InvitePreview>(`/api/invites/${encodeURIComponent(code)}`),
  handleAvailable: (code: string, handle: string) =>
    http.get<{ available: boolean }>(`/api/invites/${encodeURIComponent(code)}/handle-available?handle=${encodeURIComponent(handle)}`),
  accept: (code: string, body: AcceptInviteBody = {}) => http.post<Membership>(`/api/invites/${encodeURIComponent(code)}/accept`, body),
};
