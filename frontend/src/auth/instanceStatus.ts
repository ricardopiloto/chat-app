import { request } from "../api/http";
import type { InstanceStatus } from "../api/endpoints/instance";

const MAX_AGE_MS = 60_000;
let cached: { value: InstanceStatus; at: number } | undefined;
let pending: Promise<InstanceStatus | undefined> | undefined;
let generation = 0;

/** One readable instance status per visit; failures are deliberately retryable. */
export function readInstanceStatus(): Promise<InstanceStatus | undefined> {
  if (cached && Date.now() - cached.at < MAX_AGE_MS) return Promise.resolve(cached.value);
  if (pending) return pending;
  const currentGeneration = generation;
  const query = request<InstanceStatus>("/api/instance/status", { signal: AbortSignal.timeout(3000) })
    .then((value) => {
      if (!value || typeof value.initial_setup !== "boolean") throw new Error("Unreadable instance status");
      if (currentGeneration !== generation) return undefined;
      cached = { value, at: Date.now() };
      return value;
    })
    .catch((error: unknown) => {
      console.debug("Instance status unavailable", error);
      return undefined;
    })
    .finally(() => { if (pending === query) pending = undefined; });
  pending = query;
  return pending;
}

export function resetInstanceStatus(): void { generation++; cached = undefined; pending = undefined; }
