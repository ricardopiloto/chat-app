import { http } from "../http";
import type { Message } from "../types";

export const dice = {
  roll: (channelId: string, notation: string, label?: string) =>
    http.post<Message>(`/api/channels/${channelId}/dice`, { notation, label }),
};
