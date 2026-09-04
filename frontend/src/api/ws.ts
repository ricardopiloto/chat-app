export type WsEnvelope = {
  event: string;
  server_id: string;
  payload: Record<string, unknown>;
};

type Handler = (msg: WsEnvelope) => void;

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
  }, 25000);
  ws.addEventListener("close", () => window.clearInterval(ping));
  return ws;
}
