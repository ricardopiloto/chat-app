import type { RoleCapabilities } from "./types";

const CAPABILITY_KEYS = [
  "can_view_channels", "can_manage_channels", "can_manage_roles", "can_create_invites", "can_send_messages", "can_delete_messages",
  "can_attach_files", "can_remove_members", "can_mute_members", "can_connect_voice", "can_speak_voice", "can_mention_everyone",
] as const;
const GRANTED_BY_DEFAULT = new Set<string>(["can_view_channels", "can_send_messages", "can_attach_files", "can_connect_voice", "can_speak_voice"]);

/** What a member can do before any role grants or removes anything: the backend's defaults. */
export const DEFAULT_ROLE_CAPABILITIES = Object.fromEntries(
  CAPABILITY_KEYS.map((key) => [key, GRANTED_BY_DEFAULT.has(key)]),
) as unknown as RoleCapabilities;

/** Author, the channel's creator and the server owner may always delete; roles add `can_delete_messages` on top. */
export function mayDeleteMessage(args: { me: string; sender: string; channelCreator: string; serverOwner: string }): boolean {
  return [args.sender, args.channelCreator, args.serverOwner].includes(args.me);
}

/** "mm:ss", or "h:mm:ss" once the call passes an hour. */
export function callDuration(startedAt: string, now: number = Date.now()): string {
  const started = Date.parse(startedAt);
  if (Number.isNaN(started)) return "00:00";
  const total = Math.max(0, Math.floor((now - started) / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  const hours = Math.floor(total / 3600);
  const rest = `${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  return hours > 0 ? `${hours}:${rest}` : rest;
}
