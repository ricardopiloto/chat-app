// Who may do what in a text channel, from the data the shell already holds.
import type { Channel, Server, ServerRole } from "../../api";
import type { ChatMessage } from "./timeline";

/** The author, whoever created the channel, the server owner, or a role with "delete messages". */
export function canDeleteMessage(message: ChatMessage, me: string, channel: Channel, server: Server | undefined, roles: readonly ServerRole[]): boolean {
  if (message.system) return false;
  if (message.senderId === me) return true;
  if (channel.created_by_account_id === me) return true;
  if (server?.owner_account_id === me) return true;
  return roles.some((role) => role.member_ids.includes(me) && role.capabilities?.can_delete_messages);
}

/** Replies are not offered on system lines or on messages that could not be read. */
export const canReplyTo = (message: ChatMessage): boolean => !message.system && !message.unreadable;

/** The level the backend resolved for this account in the channel; only "write" may send. */
export const canWrite = (channel: Channel): boolean => channel.my_permission === "write";
