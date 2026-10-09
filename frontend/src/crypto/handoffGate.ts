export type HandoffSendResult = "ok" | "conflict" | "error";
export type HandoffRunResult = "ok" | "duplicate" | "error";

/** Dedupes handoff work by id and caps how many sends run at once. A 409 counts as done. */
export function createHandoffGate(limit = 4) {
  const seen = new Set<string>();
  let active = 0;
  const waiters: Array<() => void> = [];

  return {
    async run(id: string, send: () => Promise<HandoffSendResult>): Promise<HandoffRunResult> {
      if (seen.has(id)) return "duplicate";
      seen.add(id);
      if (active >= limit) await new Promise<void>((resolve) => waiters.push(resolve));
      active += 1;
      try {
        const result = await send();
        if (result === "error") {
          seen.delete(id);
          return "error";
        }
        return "ok";
      } finally {
        active -= 1;
        waiters.shift()?.();
      }
    },
  };
}
