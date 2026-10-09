// Real-time channel (GET /ws). The server pushes events to every member of the servers the
// account belongs to; the client never publishes. This module keeps the socket alive and reports
// connection health so screens can show "reconnecting" and re-sync what they missed.

// Events the backend actually emits (checked against backend/src). Note the presence event is named
// plain "presence" and carries { online_account_ids }; the older docs call it "presence.update".
// The backend does not emit channel.created or server.created: lists refresh by refetching.
export const REALTIME_EVENTS = [
  "message.new",
  "message.deleted",
  "reaction.added",
  "reaction.removed",
  "presence",
  "voice.occupancy",
  "channel.e2ee_changed",
  "channel.deleted",
  "channel_role.changed",
  "server.deleted",
  "invite.consumed",
  "grid.updated",
  "scene.changed",
  "key_handoff.requested",
  "key_handoff.completed",
  "notification.created",
] as const;

export type RealtimeEventName = (typeof REALTIME_EVENTS)[number];

export interface RealtimeEnvelope {
  event: string;
  server_id?: string;
  payload: Record<string, unknown>;
}

export type DeliveryState = "connected" | "reconnecting" | "disconnected";

export interface RealtimeOptions {
  onEvent: (envelope: RealtimeEnvelope) => void;
  onState?: (state: DeliveryState) => void;
  /** Called after a connection that follows an interruption, so the caller can fetch what it missed. */
  onResync?: () => void;
  onSessionRevoked?: () => void;
}

export interface RealtimeConnection {
  close(): void;
}

const FIRST_DELAY_MS = 500;
const MAX_DELAY_MS = 15_000;
// The backend accepts the bare text "ping" as a keep-alive, which stops idle proxies closing the socket.
const KEEPALIVE_MS = 25_000;

function socketUrl(): string {
  const scheme = location.protocol === "https:" ? "wss:" : "ws:";
  return `${scheme}//${location.host}/ws`;
}

function parse(data: unknown): RealtimeEnvelope | null {
  if (typeof data !== "string") return null;
  try {
    const value = JSON.parse(data) as Partial<RealtimeEnvelope>;
    if (typeof value.event !== "string") return null;
    return { event: value.event, server_id: value.server_id, payload: value.payload ?? {} };
  } catch {
    return null;
  }
}

export function connectRealtime(options: RealtimeOptions): RealtimeConnection {
  let socket: WebSocket | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let keepalive: ReturnType<typeof setInterval> | undefined;
  let attempt = 0;
  let closedByCaller = false;
  let hadConnection = false;
  let reconnectGeneration = 0;

  const report = (state: DeliveryState) => options.onState?.(state);

  const open = () => {
    socket = new WebSocket(socketUrl());
    socket.onopen = () => {
      const resumed = hadConnection && attempt > 0;
      attempt = 0;
      hadConnection = true;
      report("connected");
      keepalive = setInterval(() => socket?.readyState === WebSocket.OPEN && socket.send("ping"), KEEPALIVE_MS);
      if (resumed) options.onResync?.();
    };
    socket.onmessage = (message) => {
      const envelope = parse(message.data);
      if (envelope) options.onEvent(envelope);
    };
    socket.onclose = () => {
      clearInterval(keepalive);
      socket = null;
      if (closedByCaller) return report("disconnected");
      report("reconnecting");
      const generation = ++reconnectGeneration;
      // Browser WebSocket hides the HTTP status of a failed upgrade (often close code 1006).
      // Check the cookie session before retrying, regardless of the close code.
      void fetch("/api/auth/me", { credentials: "same-origin" }).then((response) => {
        if (closedByCaller || generation !== reconnectGeneration) return;
        if (response.status === 204 || response.status === 401 || response.status === 403) {
          closedByCaller = true;
          report("disconnected");
          options.onSessionRevoked?.();
          return;
        }
        const ceiling = Math.min(MAX_DELAY_MS, FIRST_DELAY_MS * 2 ** attempt);
        attempt += 1;
        timer = setTimeout(open, ceiling / 2 + Math.random() * (ceiling / 2));
      }).catch(() => {
        if (closedByCaller || generation !== reconnectGeneration) return;
        const ceiling = Math.min(MAX_DELAY_MS, FIRST_DELAY_MS * 2 ** attempt);
        attempt += 1;
        timer = setTimeout(open, ceiling / 2 + Math.random() * (ceiling / 2));
      });
    };
  };
  open();

  return {
    close() {
      closedByCaller = true;
      reconnectGeneration += 1;
      clearTimeout(timer);
      clearInterval(keepalive);
      socket?.close();
    },
  };
}
