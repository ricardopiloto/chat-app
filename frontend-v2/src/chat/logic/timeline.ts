// Turns a chronological list of messages into the rows the list renders: day separators, system
// lines and user messages, with consecutive messages of one sender grouped together.

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string | undefined;
  text: string;
  createdAt: string;
  system: boolean;
  attachmentIds: string[];
  replyToId: string | undefined;
  replySenderId: string | undefined;
  mentionedIds: string[];
  /** Set when the ciphertext could not be decrypted with the key this device holds. */
  unreadable?: boolean;
}

export type TimelineRow =
  | { type: "day"; key: string; label: string }
  | { type: "system"; key: string; message: ChatMessage }
  | { type: "message"; key: string; message: ChatMessage; startsGroup: boolean };

export interface DayLabels {
  today: string;
  yesterday: string;
  /** Formats a date that is neither today nor yesterday, for example "24 de outubro de 2026". */
  full: (date: Date) => string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Calendar day in the viewer's time zone, as "YYYY-MM-DD". */
export const dayKey = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function dayLabel(date: Date, now: Date, labels: DayLabels): string {
  const key = dayKey(date);
  if (key === dayKey(now)) return labels.today;
  const before = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return key === dayKey(before) ? labels.yesterday : labels.full(date);
}

export function buildTimeline(messages: readonly ChatMessage[], now: Date, labels: DayLabels): TimelineRow[] {
  const rows: TimelineRow[] = [];
  let currentDay = "";
  let previous: ChatMessage | undefined;

  for (const message of messages) {
    const when = new Date(message.createdAt);
    const key = dayKey(when);
    if (key !== currentDay) {
      currentDay = key;
      previous = undefined;
      rows.push({ type: "day", key: `day:${key}`, label: dayLabel(when, now, labels) });
    }
    if (message.system) {
      rows.push({ type: "system", key: message.id, message });
      previous = undefined;
      continue;
    }
    const continues = previous !== undefined && previous.senderId === message.senderId && message.replyToId === undefined;
    rows.push({ type: "message", key: message.id, message, startsGroup: !continues });
    previous = message;
  }
  return rows;
}

/** Inserts or replaces a message, keeping the list ordered by time (ties by id) and free of duplicates. */
export function mergeMessage(list: readonly ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  const without = list.filter((m) => m.id !== incoming.id);
  const at = without.findIndex((m) => m.createdAt > incoming.createdAt || (m.createdAt === incoming.createdAt && m.id > incoming.id));
  return at === -1 ? [...without, incoming] : [...without.slice(0, at), incoming, ...without.slice(at)];
}

export const mergeMessages = (list: readonly ChatMessage[], incoming: readonly ChatMessage[]): ChatMessage[] =>
  incoming.reduce<ChatMessage[]>((all, one) => mergeMessage(all, one), [...list]);
