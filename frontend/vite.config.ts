import { defineConfig, createLogger } from "vite";
import solid from "vite-plugin-solid";
import basicSsl from "@vitejs/plugin-basic-ssl";

/**
 * Vite's built-in WS proxy always logs `ws proxy error:` on half-close races
 * (LiveKit `/rtc` leave → writeAfterFIN). Client disconnect is ordered first;
 * this filter only drops that exact benign message so real proxy failures stay visible.
 * See specs/025-ws-disconnect-proxy and docs/operar-instancia.md.
 */
function mesaDevLogger() {
  const logger = createLogger();
  const error = logger.error.bind(logger);
  logger.error = (msg, options) => {
    const text = typeof msg === "string" ? msg : String(msg);
    const errMsg =
      options?.error instanceof Error
        ? options.error.message
        : typeof options?.error === "string"
          ? options.error
          : "";
    if (
      text.includes("ws proxy error") &&
      errMsg.includes("This socket has been ended by the other party")
    ) {
      return;
    }
    error(msg, options);
  };
  return logger;
}

export default defineConfig({
  plugins: [solid(), basicSsl()],
  clearScreen: false,
  customLogger: mesaDevLogger(),
  server: {
    port: 1420,
    strictPort: true,
    host: true,
    proxy: {
      "/api": { target: "http://127.0.0.1:8080", changeOrigin: true },
      "/health": { target: "http://127.0.0.1:8080", changeOrigin: true },
      "/ws": { target: "ws://127.0.0.1:8080", ws: true, changeOrigin: true },
      "/rtc": { target: "http://127.0.0.1:7880", ws: true, changeOrigin: true },
    },
  },
});
