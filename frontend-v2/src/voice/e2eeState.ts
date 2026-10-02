// Who turned a voice channel's end-to-end encryption off, and when. The backend announces this only in
// the `channel.e2ee_changed` event (there is no endpoint to read the history), so what is known here is
// what this client has seen since it connected; the banner says so rather than inventing a name.
import { createSignal } from "solid-js";

export interface E2eeChange {
  enabled: boolean;
  actorId: string | null;
  at: string | null;
}

const [changes, setChanges] = createSignal<Record<string, E2eeChange>>({});

export function noteE2eeChange(channelId: string, payload: Record<string, unknown>): void {
  setChanges((now) => ({
    ...now,
    [channelId]: {
      enabled: payload.e2ee_enabled === true,
      actorId: typeof payload.actor_account_id === "string" ? payload.actor_account_id : null,
      at: typeof payload.at === "string" ? payload.at : null,
    },
  }));
}

export const e2eeChangeFor = (channelId: string): E2eeChange | undefined => changes()[channelId];
