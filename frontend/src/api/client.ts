import type { IdentityVault } from "../crypto/identity";

export type Account = {
  id: string;
  handle: string;
  is_initial_operator: boolean;
  identity_vault?: IdentityVault | null;
  has_avatar?: boolean;
  /** Optional public presentation name (099). */
  display_name?: string | null;
};

export type Server = {
  id: string;
  name: string;
  owner_account_id: string;
  has_image?: boolean;
  has_unread?: boolean;
  has_voice?: boolean;
};

/** Body for POST /api/servers (bootstrap text + voice with custody). */
export type CreateServerBody = {
  name: string;
  custody_ack: true;
  channel_key_sealed: string;
};

/** Optional richer create-server response; bare Server also accepted. */
export type CreateServerResult = Server & {
  channels?: Channel[];
};

export type Channel = {
  id: string;
  server_id: string;
  name: string;
  type: "text" | "voice_video";
  grid_slot_count: number | null;
  created_by_account_id: string;
  e2ee_enabled: boolean;
  has_channel_key: boolean;
  visibility: "public" | "private";
  visible_to_new_members: boolean;
  my_permission?: "read" | "write" | "listen" | "speak";
};

export type ChannelAclEntry = {
  id?: string;
  channel_id?: string;
  subject_type: "account" | "role" | "everyone";
  subject_id: string;
  level: "read" | "write" | "listen" | "speak";
  /** Default allow when omitted. */
  effect?: "allow" | "deny";
};

export type RoleCapabilities = {
  can_view_channels: boolean;
  can_manage_channels: boolean;
  can_manage_roles: boolean;
  can_create_invites: boolean;
  can_send_messages: boolean;
  can_delete_messages: boolean;
  can_attach_files: boolean;
  can_remove_members: boolean;
  can_mute_members: boolean;
  can_connect_voice: boolean;
  can_speak_voice: boolean;
};

export type ServerRole = {
  id: string;
  server_id: string;
  name: string;
  position: number;
  can_create_channels: boolean;
  capabilities: RoleCapabilities;
  member_ids: string[];
  is_system?: boolean;
};

export type ChannelAccessFactor = {
  layer: string;
  detail: string;
};

export type ChannelAccessExplain = {
  account_id: string;
  channel_id: string;
  view: boolean;
  level: ChannelAclEntry["level"] | null;
  factors: ChannelAccessFactor[];
};

export const OPEN_ROLE_CAPABILITIES: RoleCapabilities = {
  can_view_channels: true,
  can_manage_channels: false,
  can_manage_roles: false,
  can_create_invites: false,
  can_send_messages: true,
  can_delete_messages: false,
  can_attach_files: true,
  can_remove_members: false,
  can_mute_members: false,
  can_connect_voice: true,
  can_speak_voice: true,
};

export type CreateChannelBody = {
  name: string;
  type: "text" | "voice_video";
  visibility?: "public" | "private";
  custody_ack?: true;
  channel_key_sealed?: string;
};

export type Message = {
  id: string;
  channel_id: string;
  sender_account_id?: string | null;
  content_ciphertext?: string;
  created_at: string;
  kind?: string;
  content_plaintext?: string | null;
  attachment_ids?: string[];
  reply_to_message_id?: string | null;
  mentioned_account_ids?: string[];
  reply_to_sender_account_id?: string | null;
};

export type UserNotification = {
  id: string;
  account_id?: string;
  kind: "mention" | "reply";
  channel_id: string;
  message_id: string | null;
  actor_account_id: string;
  created_at: string;
  read_at?: string | null;
};

export type AttachmentMeta = {
  id: string;
  channel_id: string;
  message_id?: string | null;
  uploader_account_id: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
};

export type UnfurlResult = {
  url: string;
  kind: "link" | "image" | "video" | string;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  site_name?: string | null;
  error?: string | null;
};

export const MAX_ATTACHMENTS_PER_MESSAGE = 10;
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const MAX_AVATAR_BYTES = 1 * 1024 * 1024;
export const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
export const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);


export type Invite = {
  code: string;
  server_id: string;
  expires_at: string | null;
  include_history: boolean;
  use_count?: number;
  welcome_channel_id?: string | null;
};

export type ServerWelcomeSettings = {
  welcome_channel_id: string | null;
  welcome_message_template: string | null;
};

export async function fetchServerWelcome(
  serverId: string,
): Promise<ServerWelcomeSettings> {
  return api<ServerWelcomeSettings>(`/api/servers/${serverId}/welcome`);
}

export async function patchServerWelcome(
  serverId: string,
  body: {
    welcome_channel_id?: string | null;
    welcome_message_template?: string | null;
  },
): Promise<ServerWelcomeSettings> {
  return api<ServerWelcomeSettings>(`/api/servers/${serverId}/welcome`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function createInvite(
  serverId: string,
  body: {
    include_history?: boolean;
    welcome_channel_id?: string;
    expires_in_seconds?: number;
  } = {},
): Promise<Invite> {
  return api<Invite>(`/api/servers/${serverId}/invites`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type InvitePreview = {
  server_name: string;
  include_history: boolean;
  requires_account_creation: boolean;
};

export type Membership = {
  account_id: string;
  server_id: string;
  key_handoff_status: "synced" | "pending";
};

export type GridLayout = {
  layout_key: "mestre" | "quad" | "faixa";
  slot_count: number;
  assigned_by: "auto" | "owner";
  slots: { index: number; account_id: string | null }[];
};

export type Scene = {
  id: string;
  channel_id: string;
  name: string;
  is_active: boolean;
  layout: GridLayout;
};

export type SceneList = {
  active_scene_id: string;
  scenes: Scene[];
};

export type ChannelRole = {
  channel_id: string;
  account_id: string;
  role: "co_director";
};

export type ServerMember = {
  account_id: string;
  handle: string;
  identity_pubkey: string;
  has_avatar?: boolean;
  display_name?: string | null;
};

export type ChannelMentionable = {
  account_id: string;
  handle: string;
  has_avatar?: boolean;
  display_name?: string | null;
};

export type VoiceJoin = {
  token: string;
  url: string;
  room: string;
};

export type VoiceOccupantView = {
  account_id: string;
  handle: string;
  mic_on: boolean;
  cam_on: boolean;
  screen_on?: boolean;
  has_avatar?: boolean;
  display_name?: string | null;
};

export type VoiceChannelOccupancy = {
  channel_id: string;
  call_started_at: string | null;
  occupants: VoiceOccupantView[];
};

export type VoiceOccupancySnapshot = {
  channels: VoiceChannelOccupancy[];
};

export function formatCallDuration(startedAt: string, nowMs = Date.now()): string {
  const start = Date.parse(startedAt);
  if (Number.isNaN(start)) return "00:00";
  const secs = Math.max(0, Math.floor((nowMs - start) / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export async function fetchVoiceOccupancy(serverId: string): Promise<VoiceOccupancySnapshot> {
  return api<VoiceOccupancySnapshot>(`/api/servers/${serverId}/voice-occupancy`);
}

export async function leaveVoice(channelId: string): Promise<void> {
  await api<void>(`/api/channels/${channelId}/voice/leave`, { method: "POST" });
}

/** Best-effort leave that can complete during tab unload (087). Fire-and-forget. */
export function leaveVoiceKeepalive(channelId: string): void {
  void fetch(`/api/channels/${channelId}/voice/leave`, {
    method: "POST",
    credentials: "include",
    keepalive: true,
  }).catch(() => undefined);
}

export async function patchVoiceMedia(
  channelId: string,
  body: { mic_on?: boolean; cam_on?: boolean; screen_on?: boolean } = {},
): Promise<void> {
  await api<void>(`/api/channels/${channelId}/voice/media`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export type EgressStart = {
  recording_id: string;
  egress_id?: string | null;
  status: string;
};

export async function deleteChannel(channelId: string): Promise<void> {
  await api<void>(`/api/channels/${channelId}`, { method: "DELETE" });
}

export async function createChannel(
  serverId: string,
  body: CreateChannelBody,
): Promise<Channel> {
  return api<Channel>(`/api/servers/${serverId}/channels`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchChannel(
  channelId: string,
  body: Partial<Pick<Channel, "name" | "visibility" | "visible_to_new_members">>,
): Promise<Channel> {
  return api<Channel>(`/api/channels/${channelId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function fetchChannelAcl(channelId: string): Promise<ChannelAclEntry[]> {
  return api<ChannelAclEntry[]>(`/api/channels/${channelId}/acl`);
}

export async function putChannelAcl(
  channelId: string,
  entries: ChannelAclEntry[],
): Promise<ChannelAclEntry[]> {
  return api<ChannelAclEntry[]>(`/api/channels/${channelId}/acl`, {
    method: "PUT",
    body: JSON.stringify(
      entries.map(({ subject_type, subject_id, level, effect }) => ({
        subject_type,
        subject_id,
        level,
        effect: effect ?? "allow",
      })),
    ),
  });
}

export async function fetchServerRoles(serverId: string): Promise<ServerRole[]> {
  return api<ServerRole[]>(`/api/servers/${serverId}/roles`);
}

export async function createServerRole(
  serverId: string,
  body: { name: string; can_create_channels?: boolean; capabilities?: RoleCapabilities },
): Promise<ServerRole> {
  return api<ServerRole>(`/api/servers/${serverId}/roles`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchServerRole(
  serverId: string,
  roleId: string,
  body: {
    name?: string;
    can_create_channels?: boolean;
    capabilities?: RoleCapabilities;
  },
): Promise<ServerRole> {
  return api<ServerRole>(`/api/servers/${serverId}/roles/${roleId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteServerRole(serverId: string, roleId: string): Promise<void> {
  await api<void>(`/api/servers/${serverId}/roles/${roleId}`, { method: "DELETE" });
}

export async function putRolePositions(
  serverId: string,
  roles: { id: string; position: number }[],
): Promise<ServerRole[]> {
  return api<ServerRole[]>(`/api/servers/${serverId}/roles/positions`, {
    method: "PUT",
    body: JSON.stringify({ roles }),
  });
}

export async function fetchChannelAccess(
  channelId: string,
  accountId: string,
): Promise<ChannelAccessExplain> {
  return api<ChannelAccessExplain>(`/api/channels/${channelId}/access/${accountId}`);
}

export async function fetchChannelMentionables(
  channelId: string,
): Promise<ChannelMentionable[]> {
  return api<ChannelMentionable[]>(`/api/channels/${channelId}/mentionables`);
}

export async function setServerRoleMembers(
  serverId: string,
  roleId: string,
  memberIds: string[],
): Promise<ServerRole> {
  return api<ServerRole>(`/api/servers/${serverId}/roles/${roleId}/members`, {
    method: "PUT",
    body: JSON.stringify({ member_ids: memberIds }),
  });
}

export async function setMemberRole(
  serverId: string,
  accountId: string,
  roleId: string | null,
): Promise<{ account_id: string; role_id: string | null }> {
  return api<{ account_id: string; role_id: string | null }>(
    `/api/servers/${serverId}/members/${accountId}/role`,
    {
      method: "PUT",
      body: JSON.stringify({ role_id: roleId }),
    },
  );
}

export async function fetchServerPresence(serverId: string): Promise<{ online_account_ids: string[] }> {
  return api<{ online_account_ids: string[] }>(`/api/servers/${serverId}/presence`);
}

export async function kickServerMember(serverId: string, accountId: string): Promise<void> {
  await api<void>(`/api/servers/${serverId}/members/${accountId}`, { method: "DELETE" });
}

export type ChannelMute = {
  channel_id: string;
  account_id: string;
  muted_by_account_id: string;
  created_at: string;
  ends_at: string;
};

export type MyChannelMute = {
  muted: boolean;
  ends_at?: string;
  muted_by_account_id?: string;
};

export async function putChannelMute(
  channelId: string,
  accountId: string,
  durationMinutes: number,
): Promise<ChannelMute> {
  return api<ChannelMute>(`/api/channels/${channelId}/mutes/${accountId}`, {
    method: "PUT",
    body: JSON.stringify({ duration_minutes: durationMinutes }),
  });
}

export async function deleteChannelMute(channelId: string, accountId: string): Promise<void> {
  await api<void>(`/api/channels/${channelId}/mutes/${accountId}`, { method: "DELETE" });
}

export async function fetchMyChannelMute(channelId: string): Promise<MyChannelMute> {
  return api<MyChannelMute>(`/api/channels/${channelId}/mutes/me`);
}

export async function fetchChannelMutes(channelId: string): Promise<ChannelMute[]> {
  return api<ChannelMute[]>(`/api/channels/${channelId}/mutes`);
}

export async function deleteMessage(channelId: string, messageId: string): Promise<void> {
  await api<void>(`/api/channels/${channelId}/messages/${messageId}`, { method: "DELETE" });
}

export async function listNotifications(opts?: {
  unreadOnly?: boolean;
  limit?: number;
}): Promise<UserNotification[]> {
  const q = new URLSearchParams();
  if (opts?.unreadOnly === false) q.set("unread_only", "false");
  else q.set("unread_only", "true");
  if (opts?.limit != null) q.set("limit", String(opts.limit));
  return api<UserNotification[]>(`/api/notifications?${q}`);
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await api<void>(`/api/notifications/${notificationId}/read`, { method: "POST" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await api<void>(`/api/notifications/read-all`, { method: "POST" });
}

/** Mirror of server ACL for showing the Apagar control. */
export function canDeleteMessage(
  meId: string,
  senderId: string,
  channelCreatedBy: string,
  serverOwnerId: string,
): boolean {
  return meId === senderId || meId === channelCreatedBy || meId === serverOwnerId;
}

export async function deleteServer(serverId: string): Promise<void> {
  await api<void>(`/api/servers/${serverId}`, { method: "DELETE" });
}

/** Persist channel read cursor (037 unread rail). */
export async function markChannelRead(
  channelId: string,
  lastReadAt?: string,
): Promise<void> {
  await api<void>(`/api/channels/${channelId}/read`, {
    method: "PUT",
    body: JSON.stringify(lastReadAt ? { last_read_at: lastReadAt } : {}),
  });
}

export function accountAvatarUrl(accountId: string): string {
  return `/api/accounts/${accountId}/avatar`;
}

export function serverImageUrl(serverId: string): string {
  return `/api/servers/${serverId}/image`;
}

async function putImageBytes<T>(path: string, bytes: Blob | Uint8Array, mediaType: string): Promise<T> {
  const res = await fetch(path, {
    method: "PUT",
    headers: {
      "content-type": mediaType,
      "X-Mesa-Media-Type": mediaType,
    },
    body: bytes,
    credentials: "include",
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? data?.error ?? res.statusText, data?.code);
  }
  return data as T;
}

export async function putOwnAvatar(bytes: Blob | Uint8Array, mediaType: string): Promise<Account> {
  return putImageBytes<Account>("/api/auth/avatar", bytes, mediaType);
}

export async function patchDisplayName(displayName: string | null): Promise<Account> {
  return api<Account>("/api/auth/display-name", {
    method: "PATCH",
    body: JSON.stringify({ display_name: displayName }),
  });
}

export async function deleteOwnAvatar(): Promise<void> {
  await api<void>("/api/auth/avatar", { method: "DELETE" });
}

export async function putServerImage(
  serverId: string,
  bytes: Blob | Uint8Array,
  mediaType: string,
): Promise<Server> {
  return putImageBytes<Server>(`/api/servers/${serverId}/image`, bytes, mediaType);
}

export async function deleteServerImage(serverId: string): Promise<void> {
  await api<void>(`/api/servers/${serverId}/image`, { method: "DELETE" });
}

export async function setChannelE2ee(
  channelId: string,
  enabled: boolean,
  intent?: string,
): Promise<{ e2ee_enabled: boolean }> {
  return api(`/api/channels/${channelId}/voice/e2ee`, {
    method: "POST",
    body: JSON.stringify({ enabled, intent }),
  });
}

export async function startEgress(channelId: string): Promise<EgressStart> {
  return api(`/api/channels/${channelId}/egress/start`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function stopEgress(channelId: string): Promise<{ status: string }> {
  return api(`/api/channels/${channelId}/egress/stop`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type") && !(init.body instanceof ArrayBuffer) && !(init.body instanceof Uint8Array) && !(init.body instanceof Blob)) {
    headers.set("content-type", "application/json");
  }
  const res = await fetch(path, { ...init, headers, credentials: "include" });
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = data?.message ?? data?.error ?? res.statusText;
    const code = typeof data?.error === "string" && data?.message ? data.error : data?.code;
    throw new ApiError(res.status, message, code);
  }
  return data as T;
}

export async function uploadAttachment(
  channelId: string,
  ciphertext: Uint8Array,
  mediaType: string,
): Promise<AttachmentMeta> {
  const res = await fetch(`/api/channels/${channelId}/attachments`, {
    method: "POST",
    headers: {
      "content-type": "application/octet-stream",
      "X-Mesa-Media-Type": mediaType,
    },
    body: ciphertext,
    credentials: "include",
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? data?.error ?? res.statusText, data?.code);
  }
  return data as AttachmentMeta;
}

export async function fetchAttachmentBlob(
  attachmentId: string,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const res = await fetch(`/api/attachments/${attachmentId}`, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text();
    let message = res.statusText;
    try {
      message = JSON.parse(text)?.message ?? message;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message);
  }
  const contentType = res.headers.get("X-Mesa-Media-Type") ?? "application/octet-stream";
  const buf = new Uint8Array(await res.arrayBuffer());
  return { bytes: buf, contentType };
}

export async function unfurlUrl(url: string): Promise<UnfurlResult> {
  return api<UnfurlResult>("/api/unfurl", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}
