#!/usr/bin/env node
// Instance memory, native request planning, and the websocket URL. Dev simulation uses
// localStorage. The Electron bridge is a plain object on `window`, so this runs in Node.
import { build } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "verify-instance-"));

await build({
  stdin: {
    contents: `export * from "./src/api/instance.ts";
export { planRequest, request } from "./src/api/http.ts";
export { socketUrl } from "./src/api/realtime.ts";
export { ptBR } from "./src/i18n/catalogs/pt-BR.ts";
export { en } from "./src/i18n/catalogs/en.ts";
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
});

const browserCalls = [];
globalThis.fetch = async (url, init) => {
  const headers = new Headers(init?.headers);
  browserCalls.push({ url: String(url), authorization: headers.get("authorization"), credentials: init?.credentials });
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
};
globalThis.location = { protocol: "https:", host: "localhost:1421", origin: "https://localhost:1421", search: "" };
const store = {};
globalThis.localStorage = {
  getItem: (key) => (key in store ? store[key] : null),
  setItem: (key, value) => { store[key] = String(value); },
  removeItem: (key) => { delete store[key]; },
};
globalThis.window = {};

const mod = await import(pathToFileURL(join(dir, "m.mjs")).href);
let failed = 0;
const check = (name, cond) => { console.log(`${cond ? "ok  " : "FAIL"}  ${name}`); if (!cond) failed++; };

check("browser is not native", mod.isNative() === false);
check("bare host becomes https", mod.normalizeInstanceUrl("chat.1nodado.com.br") === "https://chat.1nodado.com.br");
check("pasted https drops the path", mod.normalizeInstanceUrl("https://chat.1nodado.com.br/caminho") === "https://chat.1nodado.com.br");
check("bare host keeps the port", mod.normalizeInstanceUrl("chat.exemplo.com:8443") === "https://chat.exemplo.com:8443");
let refusedHttp = false;
try { mod.normalizeInstanceUrl("http://chat.1nodado.com.br"); } catch (error) { refusedHttp = error.message === "https"; }
check("http is refused", refusedHttp);
let refusedMesa = false;
try { mod.normalizeInstanceUrl("mesa://app"); } catch (error) { refusedMesa = error.message === "protocol"; }
check("mesa scheme stays invalid", refusedMesa);
check("web invite origin is the page", mod.inviteLinkOrigin() === "https://localhost:1421");
const asksForScheme = (text) => text.includes("http://") || text.includes("https://");
check("pt placeholder is a host", mod.ptBR.instance.placeholder === "chat.exemplo.com" && !asksForScheme(mod.ptBR.instance.placeholder) && !asksForScheme(mod.ptBR.instance.https));
check("en placeholder is a host", mod.en.instance.placeholder === "chat.example.com" && !asksForScheme(mod.en.instance.placeholder) && !asksForScheme(mod.en.instance.https));
await mod.saveInstanceUrl("http://192.168.1.50:8080");
await mod.saveSessionToken("secret");
check("web save is a no-op", (await mod.loadInstance()).baseUrl === null && (await mod.loadInstance()).sessionToken === null);
const web = mod.planRequest("/api/auth/me");
check("web path stays relative", web.url === "/api/auth/me" && web.transport === "browser" && web.init.credentials === "include");
check("web socket uses the page", mod.socketUrl() === "wss://localhost:1421/ws");

store["mesa.dev.native"] = "1";
check("dev flag turns native on", mod.isNative() === true);
check("dev flag is not the native shell", globalThis.window.__MESA_NATIVE__ !== true);
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

const bridge = { baseUrl: null, sessionToken: null };
globalThis.window = {
  __MESA_NATIVE__: true,
  mesaNative: {
    loadInstance: async () => ({ baseUrl: bridge.baseUrl, sessionToken: bridge.sessionToken }),
    saveInstanceUrl: async (url) => { bridge.baseUrl = url; },
    saveSessionToken: async (token) => { bridge.sessionToken = token; },
    clearSessionToken: async () => { bridge.sessionToken = null; },
    clearInstance: async () => { bridge.baseUrl = null; bridge.sessionToken = null; },
  },
};
await mod.saveInstanceUrl("https://chat.exemplo.com");
await mod.saveSessionToken("token-c");
check("bridge stores the instance", bridge.baseUrl === "https://chat.exemplo.com" && bridge.sessionToken === "token-c");
const bridged = mod.planRequest("/api/servers");
check("bridge uses fetch with the bearer", bridged.transport === "browser" && bridged.url === "https://chat.exemplo.com/api/servers");
await mod.request("/api/servers");
check("fetch received the bearer", browserCalls.length === 1 && browserCalls[0].authorization === "Bearer token-c" && browserCalls[0].url === "https://chat.exemplo.com/api/servers");
check("https instance uses wss", mod.socketUrl() === "wss://chat.exemplo.com/ws");
await mod.saveInstanceUrl("https://chat.1nodado.com.br");
check("native invite origin is the instance", mod.inviteLinkOrigin() === "https://chat.1nodado.com.br");
const plain = `${mod.inviteLinkOrigin()}/invite/abc`;
check("native plain invite uses the instance", plain.startsWith("https://chat.1nodado.com.br/invite/") && !plain.includes("mesa://"));
await mod.clearInstance();
check("bridge clear drops both", bridge.baseUrl === null && bridge.sessionToken === null);
check("native invite without an instance is empty", mod.inviteLinkOrigin() === null);

process.exit(failed ? 1 : 0);
