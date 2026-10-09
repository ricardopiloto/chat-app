import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createLogger, defineConfig, type Logger } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import solid from "vite-plugin-solid";
import { syncAudio } from "./scripts/sync-audio.mjs";

const BACKEND_HTTP = process.env.MESA_BACKEND ?? "http://127.0.0.1:8080";
const BACKEND_WS = process.env.MESA_BACKEND_WS ?? "ws://127.0.0.1:8080";
const LIVEKIT_HTTP = "http://127.0.0.1:7880";
const DEV_PORT = Number(process.env.MESA_DEV_PORT ?? 1421);

const manifest = JSON.parse(
  readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf8"),
) as { version: string };

// The dev proxy prints an error whenever a peer closes a websocket first (LiveKit signalling does
// this on every leave). That one message is harmless noise; every other proxy error stays visible.
function loggerWithoutWsCloseNoise(): Logger {
  const base = createLogger();
  const original = base.error.bind(base);
  const harmless = "This socket has been ended by the other party";
  base.error = (message, options) => {
    const reason = options?.error;
    const detail = reason instanceof Error ? reason.message : String(reason ?? "");
    if (message.includes("ws proxy error") && detail.includes(harmless)) return;
    original(message, options);
  };
  return base;
}

// Sound effects live in <repo>/assets/audio; copy them into public/ whenever Vite starts (dev and build).
function soundEffects() {
  return { name: "sync-sound-effects", buildStart: () => void syncAudio() };
}

const proxyTo = (target: string, ws = false) => ({ target, changeOrigin: true, ws });

export default defineConfig({
  plugins: [soundEffects(), solid(), basicSsl()],
  clearScreen: false,
  customLogger: loggerWithoutWsCloseNoise(),
  define: { __APP_VERSION__: JSON.stringify(manifest.version) },
  server: {
    https: {},
    host: true,
    port: DEV_PORT,
    strictPort: true,
    proxy: {
      "/api": proxyTo(BACKEND_HTTP),
      "/health": proxyTo(BACKEND_HTTP),
      "/ws": proxyTo(BACKEND_WS, true),
      "/rtc": proxyTo(LIVEKIT_HTTP, true),
    },
  },
});
