import { ApiError, request } from "./http";
import { currentInstance, isNative } from "./instance";

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

interface LiveSocket {
  send(data: string): void;
  close(): void;
  isOpen(): boolean;
}

const FIRST_DELAY_MS = 500;
const MAX_DELAY_MS = 15_000;
// The backend accepts the bare text "ping" as a keep-alive, which stops idle proxies closing the socket.
const KEEPALIVE_MS = 25_000;

export function socketUrl(): string {
  if (!isNative()) {
    const scheme = location.protocol === "https:" ? "wss:" : "ws:";
    return `${scheme}//${location.host}/ws`;
  }
  const base = currentInstance().baseUrl;
  if (!base) throw new Error("No Mesa instance is configured");
  const url = new URL(base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  url.search = "";
  url.hash = "";
  return url.toString();
}

function browserSocket(url: string, protocols: string[] | undefined, events: { open(): void; message(data: unknown): void; close(): void }): LiveSocket {
  const socket = protocols && protocols.length > 0 ? new WebSocket(url, protocols) : new WebSocket(url);
  socket.onopen = () => events.open();
  socket.onmessage = (message) => events.message(message.data);
  socket.onclose = () => events.close();
  return {
    send: (data) => socket.send(data),
    close: () => socket.close(),
    isOpen: () => socket.readyState === WebSocket.OPEN,
  };
}

async function openSocket(url: string, events: { open(): void; message(data: unknown): void; close(): void }): Promise<LiveSocket> {
  const token = isNative() ? currentInstance().sessionToken : null;
  return browserSocket(url, token ? [token] : undefined, events);
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
  let socket: LiveSocket | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let keepalive: ReturnType<typeof setInterval> | undefined;
  let attempt = 0;
  let closedByCaller = false;
  let hadConnection = false;
  let reconnectGeneration = 0;

  const report = (state: DeliveryState) => options.onState?.(state);

  const scheduleRetry = () => {
    const ceiling = Math.min(MAX_DELAY_MS, FIRST_DELAY_MS * 2 ** attempt);
    attempt += 1;
    timer = setTimeout(open, ceiling / 2 + Math.random() * (ceiling / 2));
  };

  const open = () => {
    let url: string;
    try {
      url = socketUrl();
    } catch {
      report("reconnecting");
      scheduleRetry();
      return;
    }
    const generationAtOpen = reconnectGeneration;
    void openSocket(url, {
      open: () => {
        if (closedByCaller || generationAtOpen !== reconnectGeneration) return;
        const resumed = hadConnection && attempt > 0;
        attempt = 0;
        hadConnection = true;
        report("connected");
        keepalive = setInterval(() => socket?.isOpen() && socket.send("ping"), KEEPALIVE_MS);
        if (resumed) options.onResync?.();
      },
      message: (data) => {
        const envelope = parse(data);
        if (envelope) options.onEvent(envelope);
      },
      close: () => {
        clearInterval(keepalive);
        socket = null;
        if (closedByCaller) return report("disconnected");
        report("reconnecting");
        const generation = ++reconnectGeneration;
        // A failed upgrade hides its HTTP status. Ask /api/auth/me before retrying.
        void request<unknown>("/api/auth/me")
          .then((body) => {
            if (closedByCaller || generation !== reconnectGeneration) return;
            if (body === undefined) {
              closedByCaller = true;
              report("disconnected");
              options.onSessionRevoked?.();
              return;
            }
            scheduleRetry();
          })
          .catch((error: unknown) => {
            if (closedByCaller || generation !== reconnectGeneration) return;
            if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
              closedByCaller = true;
              report("disconnected");
              options.onSessionRevoked?.();
              return;
            }
            scheduleRetry();
          });
      },
    })
      .then((live) => {
        if (closedByCaller || generationAtOpen !== reconnectGeneration) {
          live.close();
          return;
        }
        socket = live;
      })
      .catch(() => {
        if (closedByCaller || generationAtOpen !== reconnectGeneration) return;
        report("reconnecting");
        scheduleRetry();
      });
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
