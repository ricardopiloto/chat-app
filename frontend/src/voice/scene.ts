// The single editable scene of a voice channel, as plain data and pure functions.
// A scene is a layout family (how the seats are arranged), a seat count (2 to 8) and who sits where.
// The editor works on a draft; nothing here talks to the network or the DOM.
import type { GridLayout, LayoutKey } from "../api";

export const MIN_SEATS = 2;
export const MAX_SEATS = 8;
export const LAYOUTS: readonly LayoutKey[] = ["mestre", "quad", "faixa"];

export interface Seat {
  index: number;
  accountId: string | null;
}

export interface Scene {
  layout: LayoutKey;
  seats: Seat[];
}

export const clampSeats = (n: number): number => Math.min(MAX_SEATS, Math.max(MIN_SEATS, Math.round(n)));

export function fromWire(wire: GridLayout): Scene {
  const count = clampSeats(wire.slot_count);
  const byIndex = new Map(wire.slots.map((s) => [s.index, s.account_id]));
  return {
    layout: LAYOUTS.includes(wire.layout_key) ? wire.layout_key : "quad",
    seats: Array.from({ length: count }, (_, index) => ({ index, accountId: byIndex.get(index) ?? null })),
  };
}

export function toWire(scene: Scene): GridLayout {
  return {
    layout_key: scene.layout,
    slot_count: scene.seats.length,
    assigned_by: "owner",
    slots: scene.seats.map((s) => ({ index: s.index, account_id: s.accountId })),
  };
}

export const emptyScene = (layout: LayoutKey = "mestre", count = 5): Scene => ({
  layout,
  seats: Array.from({ length: clampSeats(count) }, (_, index) => ({ index, accountId: null })),
});

/** Seat index of a person, or -1 when they are on the bench. */
export const seatOf = (scene: Scene, accountId: string): number => scene.seats.findIndex((s) => s.accountId === accountId);

/** People present who hold no seat, in the order given. */
export const bench = (scene: Scene, present: readonly string[]): string[] => present.filter((id) => seatOf(scene, id) === -1);

/** Seats a person into `index`; whoever was there goes back to the bench and the person leaves any earlier seat. */
export function assign(scene: Scene, index: number, accountId: string): Scene {
  return {
    ...scene,
    seats: scene.seats.map((s) => {
      if (s.index === index) return { ...s, accountId };
      return s.accountId === accountId ? { ...s, accountId: null } : s;
    }),
  };
}

/** Sends whoever sits at `index` back to the bench. */
export const release = (scene: Scene, index: number): Scene => ({
  ...scene,
  seats: scene.seats.map((s) => (s.index === index ? { ...s, accountId: null } : s)),
});

export const setLayout = (scene: Scene, layout: LayoutKey): Scene => ({ ...scene, layout });

export const occupied = (scene: Scene): Seat[] => scene.seats.filter((s) => s.accountId !== null);

/** How many occupied seats must be given up to reach `count`; 0 means the change loses nobody. */
export function seatsToDrop(scene: Scene, count: number): number {
  const next = clampSeats(count);
  if (next >= scene.seats.length) return 0;
  return Math.max(0, occupied(scene).length - next);
}

/**
 * Changes the number of seats. Growing adds empty seats at the end. Shrinking removes the seats the
 * admin chose in `remove` first, then empty seats from the highest index, and only then occupied
 * ones, until `count` remain, so nobody loses a seat unless the count leaves no other way. People
 * from removed seats return to the bench. Remaining seats are renumbered from zero, keeping order.
 */
export function resize(scene: Scene, count: number, remove: readonly number[] = []): Scene {
  const next = clampSeats(count);
  const current = scene.seats.length;
  if (next === current) return scene;
  if (next > current) {
    return { ...scene, seats: [...scene.seats, ...Array.from({ length: next - current }, (_, i) => ({ index: current + i, accountId: null }))] };
  }
  const gone = new Set(remove.filter((i) => i >= 0 && i < current));
  const byHighest = (a: Seat, b: Seat) => b.index - a.index;
  for (const pool of [scene.seats.filter((s) => s.accountId === null).sort(byHighest), scene.seats.filter((s) => s.accountId !== null).sort(byHighest)]) {
    for (const seat of pool) {
      if (current - gone.size <= next) break;
      gone.add(seat.index);
    }
  }
  const kept = scene.seats.filter((s) => !gone.has(s.index));
  return { ...scene, seats: kept.map((s, index) => ({ index, accountId: s.accountId })) };
}

/** True when the draft differs from what was last saved. */
export function isDirty(saved: Scene, draft: Scene): boolean {
  if (saved.layout !== draft.layout || saved.seats.length !== draft.seats.length) return true;
  return saved.seats.some((s, i) => s.accountId !== draft.seats[i]?.accountId);
}

/** Drops people who left the call from their seats, so a stale seat never shows an empty tile. */
export function withoutAbsent(scene: Scene, present: ReadonlySet<string>): Scene {
  return { ...scene, seats: scene.seats.map((s) => (s.accountId && !present.has(s.accountId) ? { ...s, accountId: null } : s)) };
}
