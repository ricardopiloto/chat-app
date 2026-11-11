import { http } from "../http";
import type { Message } from "../types";
import type { DiceAppearance } from "../../chat/diceAppearance";

export const dice = {
  getAppearance: (channelId: string) => http.get<DiceAppearance>(`/api/channels/${channelId}/dice-appearance/me`),
  putAppearance: (channelId: string, appearance: DiceAppearance) => http.put<DiceAppearance>(`/api/channels/${channelId}/dice-appearance/me`, appearance),
  roll: (channelId: string, notation: string, label?: string) =>
    http.post<Message>(`/api/channels/${channelId}/dice`, { notation, label }),
};
