// Ephemeral typing presence. The composer decides when to announce; the channel page decides who is shown.

export const TYPING_RENEW_MS = 3_000;
export const TYPING_IDLE_MS = 5_000;
export const TYPING_HOLD_MS = 6_000;

export interface AnnounceState {
  announced: boolean;
  lastInputAt: number;
  lastSentAt: number;
}

export const idleAnnounce = (): AnnounceState => ({ announced: false, lastInputAt: 0, lastSentAt: 0 });

export type AnnounceEvent = { type: "input"; text: string } | { type: "tick" } | { type: "stop" };

/** `send` is the frame to emit. `null` means the keystroke or tick changed nothing on the wire. */
export function reduceAnnounce(state: AnnounceState, event: AnnounceEvent, now: number): { state: AnnounceState; send: boolean | null } {
  if (event.type === "stop") {
    if (!state.announced) return { state, send: null };
    return { state: idleAnnounce(), send: false };
  }
  if (event.type === "input") {
    if (event.text.trim() === "") {
      if (!state.announced) return { state, send: null };
      return { state: idleAnnounce(), send: false };
    }
    const next = { ...state, lastInputAt: now };
    if (state.announced) return { state: next, send: null };
    return { state: { ...next, announced: true, lastSentAt: now }, send: true };
  }
  if (!state.announced) return { state, send: null };
  if (now - state.lastInputAt >= TYPING_IDLE_MS) return { state: idleAnnounce(), send: false };
  if (now - state.lastSentAt >= TYPING_RENEW_MS) return { state: { ...state, lastSentAt: now }, send: true };
  return { state, send: null };
}

export interface Typer {
  accountId: string;
  until: number;
}

export interface TypingNotice {
  channelId: string;
  accountId: string;
  active: boolean;
}

export function applyTyping(typers: readonly Typer[], notice: TypingNotice, channelId: string, meId: string, now: number, holdMs = TYPING_HOLD_MS): Typer[] {
  const current = expireTypers(typers, now);
  if (notice.channelId !== channelId || notice.accountId === "" || notice.accountId === meId) return current;
  if (!notice.active) return current.filter((typer) => typer.accountId !== notice.accountId);
  const until = now + holdMs;
  const rest = current.filter((typer) => typer.accountId !== notice.accountId);
  return [...rest, { accountId: notice.accountId, until }];
}

export function expireTypers(typers: readonly Typer[], now: number): Typer[] {
  return typers.filter((typer) => typer.until > now);
}

/** Names in arrival order. An id that is not in the member list is omitted, never shown as a raw id. */
export function namedTypers(typers: readonly Typer[], names: ReadonlyMap<string, string>, now: number): string[] {
  return expireTypers(typers, now).flatMap((typer) => {
    const name = names.get(typer.accountId);
    return name ? [name] : [];
  });
}

export function summarizeTypers(names: readonly string[], maxNames: number): { names: string[]; more: number } {
  const limit = Math.max(1, maxNames);
  if (names.length <= limit) return { names: [...names], more: 0 };
  return { names: names.slice(0, limit), more: names.length - limit };
}
