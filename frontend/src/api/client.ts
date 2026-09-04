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

export type Channel = {
  id: string;
  server_id: string;
  name: string;
  type: "text" | "voice_video";
  grid_slot_count: number | null;
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
  slot_count: number;
  assigned_by: "auto" | "owner";
  slots: { index: number; account_id: string | null }[];
};

export type VoiceJoin = {
  token: string;
  url: string;
  room: string;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
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
    const message = data?.error ?? res.statusText;
    throw new ApiError(res.status, message);
  }
  return data as T;
}
