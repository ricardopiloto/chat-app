export type WsEnvelope = {
  event: string;
  server_id: string;
  payload: Record<string, unknown>;
};

export type LiveDeliveryStatus = "connected" | "reconnecting" | "disconnected";

type Handler = (msg: WsEnvelope) => void;

export type LiveWsHandle = {
  close: () => void;
};

const PING_MS = 25_000;
const BACKOFF_BASE_MS = 500;
const BACKOFF_MAX_MS = 10_000;

/**
 * WebSocket with automatic reconnect, keepalive ping, and delivery status.
 * Intentional `close()` stops the reconnect loop (logout / effect cleanup).
 */
export function connectLiveWs(
  onEvent: Handler,
  onStatus: (status: LiveDeliveryStatus) => void,
): LiveWsHandle {
  let stopped = false;
  let ws: WebSocket | null = null;
  let pingTimer: number | undefined;
  let reconnectTimer: number | undefined;
  let attempt = 0;

  function clearPing() {
    if (pingTimer !== undefined) {
      window.clearInterval(pingTimer);
      pingTimer = undefined;
    }
  }

  function clearReconnect() {
    if (reconnectTimer !== undefined) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
    }
  }

  function scheduleReconnect() {
    if (stopped) return;
    onStatus("reconnecting");
    const delay = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** attempt);
    attempt += 1;
    clearReconnect();
    reconnectTimer = window.setTimeout(() => openSocket(), delay);
  }

  function openSocket() {
    if (stopped) return;
    clearPing();
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${proto}://${location.host}/ws`);
    ws = socket;

    socket.addEventListener("open", () => {
      if (stopped || ws !== socket) {
        socket.close();
        return;
      }
      attempt = 0;
      onStatus("connected");
      pingTimer = window.setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) socket.send("ping");
      }, PING_MS);
    });

    socket.addEventListener("message", (ev) => {
      try {
        onEvent(JSON.parse(String(ev.data)) as WsEnvelope);
      } catch {
        /* ignore keepalives / non-JSON */
      }
    });

    socket.addEventListener("close", () => {
      if (ws === socket) ws = null;
      clearPing();
      if (stopped) {
        onStatus("disconnected");
        return;
      }
      scheduleReconnect();
    });
  }

  function nudgeIfDown() {
    if (stopped) return;
    const state = ws?.readyState;
    if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;
    clearReconnect();
    attempt = 0;
    openSocket();
  }

  function onVisibility() {
    if (document.visibilityState === "visible") nudgeIfDown();
  }

  function onOnline() {
    nudgeIfDown();
  }

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("online", onOnline);
  onStatus("reconnecting");
  openSocket();

  return {
    close() {
      stopped = true;
      clearReconnect();
      clearPing();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      const sock = ws;
      ws = null;
      sock?.close();
      onStatus("disconnected");
    },
  };
}

/** @deprecated Prefer connectLiveWs — kept for simple one-shot callers */
export function connectWs(onEvent: Handler): WebSocket {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${proto}://${location.host}/ws`);
  ws.addEventListener("message", (ev) => {
    try {
      onEvent(JSON.parse(String(ev.data)) as WsEnvelope);
    } catch {
      /* ignore keepalives */
    }
  });
  const ping = window.setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) ws.send("ping");
  }, PING_MS);
  ws.addEventListener("close", () => window.clearInterval(ping));
  return ws;
}
