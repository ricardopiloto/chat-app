#!/usr/bin/env node
// Exercises the API layer in src/api against a running backend (default http://127.0.0.1:8080):
// register, session, servers, channels, error mapping and the real-time socket.
// Usage: node scripts/verify-api.mjs [origin]
import { build } from "esbuild";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const origin = process.argv[2] ?? "http://127.0.0.1:8080";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "verify-api-"));
const entry = join(dir, "entry.ts");
writeFileSync(entry, `export * from ${JSON.stringify(resolve(root, "src/api/http.ts"))};
export * from ${JSON.stringify(resolve(root, "src/api/endpoints/index.ts"))};
export * from ${JSON.stringify(resolve(root, "src/api/realtime.ts"))};`);
await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", outfile: join(dir, "api.mjs"), logLevel: "error", nodePaths: [join(root, "node_modules")] });

// Browser stand-ins: same-origin fetch with a cookie jar, and a `location` for the socket URL.
const jar = new Map();
const nativeFetch = globalThis.fetch;
globalThis.fetch = async (path, init = {}) => {
  const headers = new Headers(init.headers);
  if (jar.size) headers.set("cookie", [...jar].map(([k, v]) => `${k}=${v}`).join("; "));
  const res = await nativeFetch(origin + path, { ...init, headers });
  for (const line of res.headers.getSetCookie?.() ?? []) {
    const [pair] = line.split(";");
    const [k, ...v] = pair.split("=");
    jar.set(k.trim(), v.join("="));
  }
  return res;
};
const url = new URL(origin);
globalThis.location = { protocol: url.protocol, host: url.host };
const OriginalWebSocket = globalThis.WebSocket;
globalThis.WebSocket = class extends OriginalWebSocket {
  constructor(u) {
    super(u, { headers: { cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; ") } });
  }
};

const api = await import(pathToFileURL(join(dir, "api.mjs")).href);
let failed = 0;
const check = async (name, fn) => {
  try {
    await fn();
    console.log(`ok    ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL  ${name}: ${e.message}`);
  }
};
const must = (cond, msg) => { if (!cond) throw new Error(msg); };

const handle = `api${Math.floor(Math.random() * 1e6)}`;
const password = "x".repeat(10) + "Aa1!";
const pubkey = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64");

await check("GET /api/auth/me without session -> 204, undefined", async () => {
  must((await api.auth.me()) === undefined, "expected undefined");
});
await check("ApiError carries status and message", async () => {
  try { await api.servers.list(); } catch (e) { must(e instanceof api.ApiError && e.status === 401 && e.message.length > 0, `got ${e}`); return; }
  throw new Error("did not throw");
});
await check("POST /api/auth/register", async () => {
  const acc = await api.auth.register({ handle, password, identity_pubkey: pubkey });
  must(acc.handle === handle && typeof acc.id === "string", "account shape");
});
let me;
await check("GET /api/auth/me with session", async () => { me = await api.auth.me(); must(me.handle === handle, "handle"); });
await check("POST /api/auth/login", async () => { jar.clear(); const acc = await api.auth.login(handle, password); must(acc.id === me.id, "same account"); });
await check("login with wrong password -> ApiError 401/403", async () => {
  try { await api.auth.login(handle, "wrong-password-1A!"); } catch (e) { must(e instanceof api.ApiError && [400, 401, 403].includes(e.status), `status ${e.status}`); return; }
  throw new Error("did not throw");
});
await check("PATCH display-name", async () => { const a = await api.auth.setDisplayName("Nome de Teste"); must(a.display_name === "Nome de Teste", "display_name"); });
let server;
await check("POST /api/servers (custody) + list", async () => {
  server = await api.servers.create({ name: "Servidor API", custody_ack: true, channel_key_sealed: Buffer.alloc(80).toString("base64") });
  const list = await api.servers.list();
  must(list.some((s) => s.id === server.id), "listed");
});
await check("channels: text + voice created by bootstrap", async () => {
  const list = await api.channels.listForServer(server.id);
  must(list.some((c) => c.type === "text") && list.some((c) => c.type === "voice_video"), "both kinds");
});
await check("roles, members, presence", async () => {
  must((await api.roles.list(server.id)).length >= 1, "roles");
  must((await api.servers.members(server.id)).some((m) => m.account_id === me.id), "member");
  must(Array.isArray((await api.servers.presence(server.id)).online_account_ids), "presence shape");
});
await check("error body mapping: duplicate/invalid -> ApiError with message", async () => {
  try { await api.channels.update("00000000-0000-0000-0000-000000000000", { name: "x" }); } catch (e) { must(e instanceof api.ApiError && e.message.length > 0, "message"); return; }
  throw new Error("did not throw");
});
await check("WebSocket: receives `presence` envelope on connect", async () => {
  const seen = [];
  const states = [];
  const conn = api.connectRealtime({ onEvent: (e) => seen.push(e), onState: (s) => states.push(s) });
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline && !seen.some((e) => e.event === "presence")) await new Promise((r) => setTimeout(r, 100));
  conn.close();
  const presence = seen.find((e) => e.event === "presence");
  must(presence, `no presence event, saw ${JSON.stringify(seen.map((e) => e.event))}`);
  must(Array.isArray(presence.payload.online_account_ids) && presence.server_id === server.id, "envelope shape");
  must(states.includes("connected"), "state connected");
});
await check("WebSocket: message.new delivered after POST message", async () => {
  const text = (await api.channels.listForServer(server.id)).find((c) => c.type === "text");
  const seen = [];
  const conn = api.connectRealtime({ onEvent: (e) => seen.push(e) });
  await new Promise((r) => setTimeout(r, 600));
  await api.messages.post(text.id, { content_ciphertext: Buffer.from("opaque").toString("base64") });
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline && !seen.some((e) => e.event === "message.new")) await new Promise((r) => setTimeout(r, 100));
  conn.close();
  const ev = seen.find((e) => e.event === "message.new");
  must(ev && ev.payload.channel_id === text.id, "message.new envelope");
});
await check("POST /api/auth/logout ends the session", async () => { await api.auth.logout(); must((await api.auth.me()) === undefined, "session survived"); });

console.log(failed ? `${failed} failed` : "all passed");
process.exit(failed ? 1 : 0);
