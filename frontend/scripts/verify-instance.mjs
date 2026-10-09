#!/usr/bin/env node
// Instance memory, native request planning, and the websocket URL. The Tauri plugins are stubbed
// so this runs in Node; the dev-simulation path never loads the store plugin.
import { build } from "esbuild";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "verify-instance-"));
const stubs = join(dir, "stubs");
mkdirSync(stubs);
writeFileSync(
  join(stubs, "plugin-http.mjs"),
  `export async function fetch(url, init) {
    const headers = new Headers(init?.headers);
    globalThis.__pluginCalls.push({ url: String(url), authorization: headers.get("authorization"), credentials: init?.credentials });
    return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
  }
`,
);
writeFileSync(
  join(stubs, "plugin-store.mjs"),
  `const data = {};
  export async function load() {
    globalThis.__storeLoads = (globalThis.__storeLoads ?? 0) + 1;
    return {
      get: async (key) => data[key],
      set: async (key, value) => { data[key] = value; },
      delete: async (key) => { delete data[key]; return true; },
      save: async () => {},
    };
  }
`,
);
writeFileSync(join(stubs, "plugin-websocket.mjs"), "export default class WebSocket { static async connect() { throw new Error('unused'); } }\n");

await build({
  stdin: {
    contents: `export * from "./src/api/instance.ts";
export { planRequest, request } from "./src/api/http.ts";
export { socketUrl } from "./src/api/realtime.ts";
`,
    resolveDir: root,
    sourcefile: "verify-instance-entry.ts",
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: join(dir, "m.mjs"),
  logLevel: "error",
  define: { "import.meta.env.DEV": "true" },
  alias: {
    "@tauri-apps/plugin-http": join(stubs, "plugin-http.mjs"),
    "@tauri-apps/plugin-store": join(stubs, "plugin-store.mjs"),
    "@tauri-apps/plugin-websocket": join(stubs, "plugin-websocket.mjs"),
  },
});

const browserCalls = [];
globalThis.__pluginCalls = [];
globalThis.fetch = async (url, init) => {
  const headers = new Headers(init?.headers);
  browserCalls.push({ url: String(url), authorization: headers.get("authorization"), credentials: init?.credentials });
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
};
globalThis.location = { protocol: "https:", host: "localhost:1421", search: "" };
const store = {};
globalThis.localStorage = {
  getItem: (key) => (key in store ? store[key] : null),
  setItem: (key, value) => { store[key] = String(value); },
  removeItem: (key) => { delete store[key]; },
};
globalThis.isTauri = false;

const mod = await import(pathToFileURL(join(dir, "m.mjs")).href);
let failed = 0;
const check = (name, cond) => { console.log(`${cond ? "ok  " : "FAIL"}  ${name}`); if (!cond) failed++; };

check("browser is not native", mod.isNative() === false);
await mod.saveInstanceUrl("http://192.168.1.50:8080");
await mod.saveSessionToken("secret");
check("web save is a no-op", (await mod.loadInstance()).baseUrl === null && (await mod.loadInstance()).sessionToken === null);
check("store plugin stays unused off-bridge", (globalThis.__storeLoads ?? 0) === 0);
const web = mod.planRequest("/api/auth/me");
check("web path stays relative", web.url === "/api/auth/me" && web.transport === "browser" && web.init.credentials === "include");
check("web socket uses the page", mod.socketUrl() === "wss://localhost:1421/ws");

store["mesa.dev.native"] = "1";
check("dev flag turns native on", mod.isNative() === true);
check("dev flag is not the Tauri bridge", mod.tauriBridge() === false);
await mod.saveInstanceUrl("http://192.168.1.50:8080");
check("url stored before any token", mod.currentInstance().baseUrl === "http://192.168.1.50:8080" && mod.currentInstance().sessionToken === null);
await mod.saveSessionToken("token-a");
check("token stored beside the url", store["mesa.instance.baseUrl"] === "http://192.168.1.50:8080" && store["mesa.instance.sessionToken"] === "token-a");
await mod.clearSessionToken();
check("logout clears the token only", mod.currentInstance().baseUrl === "http://192.168.1.50:8080" && mod.currentInstance().sessionToken === null && store["mesa.instance.sessionToken"] === undefined);
await mod.saveSessionToken("token-b");
const native = mod.planRequest("/api/auth/me");
const nativeHeaders = new Headers(native.init.headers);
check("native url is absolute", native.url === "http://192.168.1.50:8080/api/auth/me");
check("native sends the bearer and omits cookies", nativeHeaders.get("authorization") === "Bearer token-b" && native.init.credentials === "omit" && native.transport === "browser");
check("native socket follows the instance", mod.socketUrl() === "ws://192.168.1.50:8080/ws");
await mod.clearInstance();
check("clear drops url and token", mod.currentInstance().baseUrl === null && mod.currentInstance().sessionToken === null && !("mesa.instance.baseUrl" in store));
let missing = false;
try { mod.planRequest("/api/auth/me"); } catch { missing = true; }
check("native without a url rejects", missing === true && browserCalls.length === 0);

globalThis.isTauri = true;
await mod.saveInstanceUrl("https://chat.exemplo.com");
await mod.saveSessionToken("token-c");
check("bridge uses the store plugin", (globalThis.__storeLoads ?? 0) > 0);
const bridged = mod.planRequest("/api/servers");
check("bridge selects the plugin fetch", bridged.transport === "plugin" && bridged.url === "https://chat.exemplo.com/api/servers");
await mod.request("/api/servers");
check("plugin fetch received the bearer", globalThis.__pluginCalls.length === 1 && globalThis.__pluginCalls[0].authorization === "Bearer token-c" && globalThis.__pluginCalls[0].url === "https://chat.exemplo.com/api/servers");
check("browser fetch stayed unused", browserCalls.length === 0);
check("https instance uses wss", mod.socketUrl() === "wss://chat.exemplo.com/ws");

process.exit(failed ? 1 : 0);
