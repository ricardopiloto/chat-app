/** Static 2×2 map — keep in sync with specs/001-fase-0-spike/contracts/grid-layout.json */
export const GRID = {
  columns: 2 as const,
  rows: 2 as const,
  slots: [
    { index: 0, identity: "alice" as const },
    { index: 1, identity: "bob" as const },
    { index: 2, identity: null },
    { index: 3, identity: null },
  ],
};

export function slotIndexForIdentity(identity: string): number | null {
  const slot = GRID.slots.find((s) => s.identity === identity);
  return slot ? slot.index : null;
}

export function attachVideo(identity: string, stream: MediaStream | null): void {
  const index = slotIndexForIdentity(identity);
  if (index === null) {
    console.warn("identity not mapped to a slot", identity);
    return;
  }
  const el = document.getElementById(`slot-${index}`) as HTMLVideoElement | null;
  if (!el) return;
  el.srcObject = stream;
  const cell = el.parentElement;
  if (cell) {
    cell.classList.toggle("empty", !stream);
  }
}

export function clearSlot(identity: string): void {
  attachVideo(identity, null);
}
