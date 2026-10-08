// Wire types. Each mirrors a serialised struct in `backend/src` (domain/* and api/*);
// fields the backend skips when empty are optional here.

export type Id = string;
export type Timestamp = string; // RFC 3339

// --- accounts and identity -------------------------------------------------------------------
export interface IdentityVaultPayload {
  v: 1;
  publicKey: number[];
  salt: number[];
  iv: number[];
  wrapped: number[];
}

export interface Account {
  id: Id;
  handle: string;
  is_initial_operator: boolean;
  identity_vault: IdentityVaultPayload | null;
  has_recovery_key?: boolean;
  has_avatar: boolean;
  display_name?: string;
}

export interface RegisterBody {
  handle: string;
  password: string;
  identity_pubkey: string;
  identity_vault?: IdentityVaultPayload;
  invite_code?: string;
  recovery_vault?: { v: 1; publicKey: number[]; iv: number[]; wrapped: number[] };
  recovery_verifier_pubkey?: string;
}

// --- servers, roles, members -----------------------------------------------------------------
export interface Server {
  id: Id;
  name: string;
  owner_account_id: Id;
  has_image: boolean;
  has_unread: boolean;
  has_voice: boolean;
}

export interface CreateServerBody {
  name: string;
  custody_ack?: boolean;
  channel_key_sealed?: string;
}

export interface WelcomeSettings {
  welcome_channel_id: Id | null;
  welcome_message_template: string | null;
}

export interface RoleCapabilities {
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
  can_mention_everyone: boolean;
}

export interface ServerRole {
  id: Id;
  server_id: Id;
  name: string;
  can_create_channels: boolean;
  capabilities: RoleCapabilities;
  is_system: boolean;
  position: number;
  member_ids: Id[];
}

export interface Member {
  account_id: Id;
  handle: string;
  identity_pubkey: string;
  has_avatar: boolean;
  display_name?: string;
}

export interface Mentionable {
  account_id: Id;
  handle: string;
  has_avatar: boolean;
  display_name?: string;
}

export interface Membership {
  account_id: Id;
  server_id: Id;
  key_handoff_status: "synced" | "pending";
}

export interface Presence {
  online_account_ids: Id[];
}

// --- channels and access ---------------------------------------------------------------------
export type ChannelKind = "text" | "voice_video";
export type ChannelVisibility = "public" | "private";
export type PermissionLevel = "read" | "write" | "listen" | "speak";

export interface Channel {
  id: Id;
  server_id: Id;
  name: string;
  type: ChannelKind;
  grid_slot_count: number | null;
  created_by_account_id: Id;
  e2ee_enabled: boolean;
  has_channel_key: boolean;
  visibility: ChannelVisibility;
  visible_to_new_members: boolean;
  my_permission?: string;
}

export interface CreateChannelBody {
  name: string;
  type: ChannelKind;
  grid_slot_count?: number;
  visibility?: ChannelVisibility;
  custody_ack?: boolean;
  channel_key_sealed?: string;
}

export interface AclEntry {
  id: Id;
  channel_id: Id;
  subject_type: "account" | "role" | "everyone";
  subject_id: Id;
  level: PermissionLevel;
  effect: "allow" | "deny";
}

export type AclEntryInput = Pick<AclEntry, "subject_type" | "level" | "effect"> & { subject_id?: Id };

export interface AccessFactor {
  layer: string;
  detail: string;
}

export interface AccessReport {
  account_id: Id;
  channel_id: Id;
  view: boolean;
  level: PermissionLevel | null;
  factors: AccessFactor[];
}

export interface Mute {
  channel_id: Id;
  account_id: Id;
  muted_by_account_id: Id;
  created_at: Timestamp;
  ends_at: Timestamp;
}

export interface MyMute {
  muted: boolean;
  ends_at?: Timestamp;
  muted_by_account_id?: Id;
}

// --- messages, attachments, notifications ----------------------------------------------------
export interface Message {
  id: Id;
  channel_id: Id;
  sender_account_id?: Id;
  content_ciphertext?: string;
  created_at: Timestamp;
  kind?: string;
  content_plaintext?: string;
  attachment_ids: Id[];
  reply_to_message_id?: Id;
  mentioned_account_ids?: Id[];
  reply_to_sender_account_id?: Id;
  /** The sender was allowed to mention @todos and the server notified every member of the channel. */
  mentions_everyone?: boolean;
}

export interface PostMessageBody {
  content_ciphertext: string;
  attachment_ids?: Id[];
  mentioned_account_ids?: Id[];
  reply_to_message_id?: Id;
  /** The text contains @todos; the server only honours it for someone with the permission. */
  mention_everyone?: boolean;
}

export interface Attachment {
  id: Id;
  channel_id: Id;
  message_id: Id | null;
  uploader_account_id: Id;
  content_type: string;
  size_bytes: number;
  created_at: Timestamp;
}

export interface LinkPreview {
  url: string;
  kind: string;
  title?: string;
  description?: string;
  image_url?: string;
  site_name?: string;
  error?: string;
}

export interface Notification {
  id: Id;
  /** Present on REST results; the real-time `notification.created` payload omits it. */
  account_id?: Id;
  kind: "mention" | "reply";
  channel_id: Id;
  message_id: Id | null;
  actor_account_id: Id;
  created_at: Timestamp;
  read_at: Timestamp | null;
}

// --- invites ---------------------------------------------------------------------------------
export interface Invite {
  code: string;
  server_id: Id;
  expires_at: Timestamp | null;
  include_history: boolean;
  use_count: number;
  welcome_channel_id?: Id;
}

export interface InvitePreview {
  server_name: string;
  include_history: boolean;
  requires_account_creation: boolean;
}

export interface AcceptInviteBody {
  handle?: string;
  password?: string;
  identity_pubkey?: string;
  identity_vault?: IdentityVaultPayload;
  recovery_vault?: { v: 1; publicKey: number[]; iv: number[]; wrapped: number[] };
  recovery_verifier_pubkey?: string;
}

// --- voice, grid and scenes ------------------------------------------------------------------
export interface VoiceJoin {
  token: string;
  url: string;
  room: string;
}

export interface MediaFlags {
  mic_on?: boolean;
  cam_on?: boolean;
  screen_on?: boolean;
}

export interface Occupant {
  account_id: Id;
  handle: string;
  mic_on: boolean;
  cam_on: boolean;
  screen_on: boolean;
  has_avatar: boolean;
  display_name?: string;
}

export interface ChannelOccupancy {
  channel_id: Id;
  call_started_at: Timestamp | null;
  occupants: Occupant[];
}

export interface VoiceOccupancy {
  channels: ChannelOccupancy[];
}

export type LayoutKey = "mestre" | "quad" | "faixa";

export interface GridLayout {
  layout_key: LayoutKey;
  slot_count: number;
  assigned_by: "auto" | "owner";
  slots: { index: number; account_id: Id | null }[];
}

export interface Scene {
  id: Id;
  channel_id: Id;
  name: string;
  is_active: boolean;
  layout: GridLayout;
}

export interface SceneList {
  active_scene_id: Id;
  scenes: Scene[];
}

// --- key envelopes ---------------------------------------------------------------------------
export interface KeyEnvelope {
  server_id: Id;
  account_id: Id;
  sealed_key: string;
}
