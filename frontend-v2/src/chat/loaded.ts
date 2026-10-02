// Messages already decrypted on this device, per channel. Search reads from here first, so what
// the user has been looking at is searchable without asking the server again.
import type { ChatMessage } from "./logic/timeline";

const byChannel = new Map<string, ChatMessage[]>();

export const rememberLoaded = (channelId: string, messages: readonly ChatMessage[]): void => void byChannel.set(channelId, [...messages]);

export const loadedMessages = (channelId: string): ChatMessage[] | undefined => byChannel.get(channelId);

export const forgetChannel = (channelId: string): void => void byChannel.delete(channelId);
