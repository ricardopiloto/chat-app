// Transitional aliases: screens written before the API layer was rebuilt still import these names.
// Each line maps an old name onto the new modules ("./endpoints", "./types", "./helpers", "./limits").
// Remove entries as the screens that use them are rewritten; delete this file when none remain.
import { ApiError, request } from "./http";
import { acl, attachments, auth, avatarUrl, channels, grid, invites, links, messages, mutes, notifications, roles, servers, voice } from "./endpoints";
import { callDuration, DEFAULT_ROLE_CAPABILITIES, mayDeleteMessage } from "./helpers";
import { ATTACHMENT_MEDIA_TYPES, MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS_PER_MESSAGE, MAX_IMAGE_BYTES, PROFILE_IMAGE_MEDIA_TYPES } from "./limits";
import type * as T from "./types";

export { ApiError };
export type {
  Account, Channel, CreateChannelBody, GridLayout, InvitePreview, Message, RoleCapabilities, Scene, SceneList, Server, ServerRole, Invite, Membership,
} from "./types";
export type CreateServerResult = T.Server & { channels?: T.Channel[] };
export type ChannelAccessExplain = T.AccessReport;
export type ChannelAclEntry = Omit<T.AclEntry, "id" | "channel_id"> & Partial<Pick<T.AclEntry, "id" | "channel_id">>;
export type ChannelMentionable = T.Mentionable;
export type ChannelMute = T.Mute;
export type MyChannelMute = T.MyMute;
export type ServerMember = T.Member;
export type UnfurlResult = T.LinkPreview;
export type UserNotification = T.Notification;
export type VoiceChannelOccupancy = T.ChannelOccupancy;
export type VoiceOccupantView = T.Occupant;
export type AttachmentMeta = T.Attachment;
export type ServerWelcomeSettings = T.WelcomeSettings;
export type VoiceOccupancySnapshot = T.VoiceOccupancy;
export type VoiceJoin = T.VoiceJoin;

export const MAX_ATTACHMENTS = MAX_ATTACHMENTS_PER_MESSAGE;
export { MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS_PER_MESSAGE };
export const MAX_AVATAR_BYTES = MAX_IMAGE_BYTES;
export const ALLOWED_MEDIA_TYPES = ATTACHMENT_MEDIA_TYPES;
export const ALLOWED_AVATAR_TYPES = PROFILE_IMAGE_MEDIA_TYPES;
export const OPEN_ROLE_CAPABILITIES = DEFAULT_ROLE_CAPABILITIES;

/** Untyped escape hatch: `body` is a JSON string, as callers always passed it. */
export const api = <R>(path: string, init: RequestInit = {}): Promise<R> =>
  request<R>(path, {
    method: (init.method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | undefined) ?? "GET",
    json: typeof init.body === "string" ? JSON.parse(init.body) : undefined,
  });

export const formatCallDuration = callDuration;
export const canDeleteMessage = (me: string, sender: string, channelCreator: string, serverOwner: string) =>
  mayDeleteMessage({ me, sender, channelCreator, serverOwner });
export const accountAvatarUrl = avatarUrl;
export const serverImageUrl = servers.imageUrl;

export const fetchCurrentAccount = auth.me;
export const patchDisplayName = auth.setDisplayName;
export const putOwnAvatar = auth.uploadAvatar;
export const deleteOwnAvatar = auth.removeAvatar;

export const deleteServer = servers.remove;
export const putServerImage = servers.setImage;
export const deleteServerImage = servers.removeImage;
export const fetchServerWelcome = servers.welcome;
export const patchServerWelcome = servers.updateWelcome;
export const fetchServerPresence = servers.presence;
export const kickServerMember = servers.removeMember;
export const setMemberRole = servers.setMemberRole;

export const fetchServerRoles = roles.list;
export const createServerRole = (serverId: string, body: { name: string; capabilities?: T.RoleCapabilities }) => roles.create(serverId, body.name, body.capabilities);
export const patchServerRole = roles.update;
export const deleteServerRole = roles.remove;
export const putRolePositions = roles.reorder;
export const setServerRoleMembers = roles.setMembers;

export const createInvite = invites.create;

export const createChannel = channels.create;
export const patchChannel = channels.update;
export const deleteChannel = channels.remove;
export const fetchChannelMentionables = channels.mentionables;
export const markChannelRead = channels.markRead;
export const fetchChannelAcl = acl.list;
export const putChannelAcl = (channelId: string, entries: ChannelAclEntry[]) => acl.replace(channelId, entries);
export const fetchChannelAccess = acl.inspect;
export const fetchChannelMutes = mutes.list;
export const fetchMyChannelMute = mutes.mine;
export const putChannelMute = mutes.set;
export const deleteChannelMute = mutes.clear;

export const deleteMessage = messages.remove;
export const uploadAttachment = attachments.upload;
export const fetchAttachmentBlob = async (attachmentId: string) => {
  const { bytes, mediaType } = await attachments.download(attachmentId);
  return { bytes, contentType: mediaType };
};
export const unfurlUrl = links.preview;
export const listNotifications = notifications.list;
export const markNotificationRead = notifications.markRead;
export const markAllNotificationsRead = notifications.markAllRead;

export const fetchVoiceOccupancy = voice.occupancy;
export const leaveVoice = voice.leave;
export const leaveVoiceKeepalive = voice.leaveOnUnload;
export const patchVoiceMedia = voice.reportMedia;
export const setChannelE2ee = voice.setE2ee;

export const fetchGrid = grid.get;
