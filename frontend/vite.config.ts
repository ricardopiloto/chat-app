import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  plugins: [solid(), basicSsl()],
  clearScreen: false,
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
