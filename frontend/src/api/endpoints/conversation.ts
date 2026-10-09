import { MEDIA_TYPE_HEADER, http, request, requestBytes } from "../http";
import type { Attachment, LinkPreview, Message, Notification, PostMessageBody } from "../types";

export const messages = {
  /** Newest first page; pass `before` (a timestamp) to page backwards. */
  list: (channelId: string, before?: string) =>
    http.get<Message[]>(`/api/channels/${channelId}/messages${before ? `?before=${encodeURIComponent(before)}` : ""}`),
  post: (channelId: string, body: PostMessageBody) => http.post<Message>(`/api/channels/${channelId}/messages`, body),
  remove: (channelId: string, messageId: string) => http.delete(`/api/channels/${channelId}/messages/${messageId}`),
  addReaction: (channelId: string, messageId: string, emojiCode: string) =>
    http.post<unknown>(`/api/channels/${channelId}/messages/${messageId}/reactions`, { emoji_code: emojiCode }),
  removeReaction: (channelId: string, messageId: string, emojiCode: string) =>
    http.delete(`/api/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emojiCode)}`),
};

export const attachments = {
  /** `ciphertext` is already encrypted by the caller; the backend stores opaque bytes. */
  upload: (channelId: string, ciphertext: Uint8Array, mediaType: string) =>
    request<Attachment>(`/api/channels/${channelId}/attachments`, {
      method: "POST",
      bytes: ciphertext,
      headers: { [MEDIA_TYPE_HEADER]: mediaType },
    }),
  download: async (attachmentId: string) => {
    const { bytes, headers } = await requestBytes(`/api/attachments/${attachmentId}`);
    return { bytes, mediaType: headers.get(MEDIA_TYPE_HEADER) ?? "application/octet-stream" };
  },
};

export const links = {
  preview: (url: string) => http.post<LinkPreview>("/api/unfurl", { url }),
};

export const notifications = {
  list: (options: { unreadOnly?: boolean; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (options.unreadOnly !== undefined) query.set("unread_only", String(options.unreadOnly));
    if (options.limit !== undefined) query.set("limit", String(options.limit));
    const suffix = query.size ? `?${query}` : "";
    return http.get<Notification[]>(`/api/notifications${suffix}`);
  },
  markRead: (notificationId: string) => http.post<void>(`/api/notifications/${notificationId}/read`),
  markAllRead: () => http.post<void>("/api/notifications/read-all"),
};
