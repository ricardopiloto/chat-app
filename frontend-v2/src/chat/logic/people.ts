// A member as the chat needs to show them.
import type { Mentionable, Member } from "../../api";
import { publicDisplayLabel } from "../../lib/displayName";

export interface ChatPerson {
  accountId: string;
  handle: string;
  label: string;
  hasAvatar: boolean;
}

export const toPerson = (source: Member | Mentionable): ChatPerson => ({
  accountId: source.account_id,
  handle: source.handle,
  label: publicDisplayLabel(source.handle, source.display_name),
  hasAvatar: source.has_avatar,
});

/** Members whose handle or name starts with, or contains, what was typed after "@". */
export function matchPeople(people: readonly ChatPerson[], query: string, limit = 6): ChatPerson[] {
  const needle = query.toLowerCase();
  const starts = people.filter((p) => p.handle.toLowerCase().startsWith(needle));
  const rest = people.filter((p) => !starts.includes(p) && (p.handle.toLowerCase().includes(needle) || p.label.toLowerCase().includes(needle)));
  return [...starts, ...rest].slice(0, limit);
}
