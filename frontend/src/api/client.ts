import type { IdentityVault } from "../crypto/identity";

export type Account = {
  id: string;
  handle: string;
  is_initial_operator: boolean;
  identity_vault?: IdentityVault | null;
};

export type Server = {
  id: string;
  name: string;
  owner_account_id: string;
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
};

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
};

export type VoiceJoin = {
  token: string;
  url: string;
  room: string;
};

export type EgressStart = {
  recording_id: string;
  egress_id?: string | null;
  status: string;
};

export async function deleteChannel(channelId: string): Promise<void> {
  await api<void>(`/api/channels/${channelId}`, { method: "DELETE" });
}

export async function deleteServer(serverId: string): Promise<void> {
  await api<void>(`/api/servers/${serverId}`, { method: "DELETE" });
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
  if (init.body && !headers.has("content-type")) {
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
