import type { IdentityVault } from "../crypto/identity";

export type Account = {
  id: string;
  handle: string;
  is_initial_operator: boolean;
  identity_vault?: IdentityVault | null;
  has_avatar?: boolean;
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
};

export type Message = {
  id: string;
  channel_id: string;
  sender_account_id: string;
  content_ciphertext: string;
  created_at: string;
  attachment_ids?: string[];
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
};

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
  has_avatar?: boolean;
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

export async function patchVoiceMedia(
  channelId: string,
  body: { mic_on?: boolean; cam_on?: boolean } = {},
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

export async function deleteMessage(channelId: string, messageId: string): Promise<void> {
  await api<void>(`/api/channels/${channelId}/messages/${messageId}`, { method: "DELETE" });
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
