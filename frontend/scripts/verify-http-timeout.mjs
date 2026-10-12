#!/usr/bin/env node
// Default JSON timeout in http.ts. A fetch that never settles must reject near 15s.
// Uploads (`bytes`) and a caller-supplied signal keep the previous behaviour.
import { build } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "verify-http-timeout-"));

await build({
  stdin: {
    contents: `export { request, JSON_REQUEST_TIMEOUT_MS } from "./src/api/http.ts";
`,
    resolveDir: root,
    sourcefile: "verify-http-timeout-entry.ts",
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: join(dir, "m.mjs"),
  logLevel: "error",
  define: { "import.meta.env.DEV": "true" },
});

const store = {};
globalThis.localStorage = {
  getItem: (key) => (key in store ? store[key] : null),
  setItem: (key, value) => { store[key] = String(value); },
  removeItem: (key) => { delete store[key]; },
};
globalThis.window = {};

const seen = [];
let mode = "hang";
globalThis.fetch = (url, init) => {
  const headers = new Headers(init?.headers);
  const entry = {
    url: String(url),
    signal: init?.signal,
    bytes: headers.get("content-type") === "application/octet-stream",
  };
  seen.push(entry);
  if (mode === "ok") {
    return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }));
  }
  return new Promise((_resolve, reject) => {
    if (init?.signal?.aborted) {
      reject(new DOMException("The operation was aborted", "AbortError"));
      return;
    }
    init?.signal?.addEventListener("abort", () => {
      reject(new DOMException("The operation was aborted", "AbortError"));
    });
  });
};

const mod = await import(pathToFileURL(join(dir, "m.mjs")).href);
let failed = 0;
const check = (name, cond) => { console.log(`${cond ? "ok  " : "FAIL"}  ${name}`); if (!cond) failed++; };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

check("timeout is 15s", mod.JSON_REQUEST_TIMEOUT_MS === 15_000);

mode = "ok";
const quick = await mod.request("/api/auth/me");
const quickSignal = seen.at(-1)?.signal;
check("fast json still resolves", quick?.ok === true);
await sleep(50);
check("settled json does not abort later", quickSignal instanceof AbortSignal && quickSignal.aborted === false);

mode = "hang";
const started = Date.now();
const mark = seen.length;
let jsonState = "pending";
let jsonError = "";
const json = mod.request("/api/auth/me").then(
  () => { jsonState = "resolved"; },
  (error) => { jsonState = "rejected"; jsonError = error?.name ?? ""; },
);
let bytesState = "pending";
const bytes = mod.request("/api/attachments", { method: "POST", bytes: new Uint8Array([1, 2, 3, 4]) }).then(
  () => { bytesState = "resolved"; },
  () => { bytesState = "rejected"; },
);
const owned = new AbortController();
let ownedState = "pending";
const ownedCall = mod.request("/api/auth/me", { signal: owned.signal }).then(
  () => { ownedState = "resolved"; },
  () => { ownedState = "rejected"; },
);
const hang = seen.slice(mark);
const jsonSignal = hang.find((entry) => !entry.bytes && entry.signal !== owned.signal)?.signal;
const bytesSignal = hang.find((entry) => entry.bytes)?.signal;
const passedSignal = hang.find((entry) => entry.signal === owned.signal)?.signal;

await sleep(12_000);
check("json still pending before 15s", jsonState === "pending");
check("bytes still pending before 15s", bytesState === "pending");
check("caller signal still pending before 15s", ownedState === "pending");

await Promise.race([json, sleep(6_000)]);
const elapsed = Date.now() - started;
check("json rejects around 15s", jsonState === "rejected" && jsonError === "AbortError" && elapsed >= 14_000 && elapsed <= 18_000);
check("json abort uses an internal signal", jsonSignal instanceof AbortSignal && jsonSignal !== owned.signal && jsonSignal.aborted === true);
check("bytes does not reject on its own", bytesState === "pending" && bytesSignal === undefined);
check("caller signal is forwarded", passedSignal === owned.signal);

const abortAt = Date.now();
owned.abort();
await ownedCall;
check("caller abort rejects without the default timeout", ownedState === "rejected" && Date.now() - abortAt < 1_000);

process.exit(failed ? 1 : 0);
