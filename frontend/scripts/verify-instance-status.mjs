import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const directory = await mkdtemp(join(tmpdir(), "parley-instance-status-"));
try {
  await build({
    entryPoints: [new URL("../src/auth/instanceStatus.ts", import.meta.url).pathname],
    outfile: join(directory, "module.mjs"), bundle: true, platform: "node", format: "esm",
    plugins: [{ name: "mock-http", setup(b) {
      b.onResolve({ filter: /^\.\.\/api\/http$/ }, () => ({ path: "mock-http", namespace: "mock" }));
      b.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "export const request = (...args) => globalThis.__statusRequest(...args)", loader: "js" }));
    } }],
  });
  const { readInstanceStatus, resetInstanceStatus } = await import(pathToFileURL(join(directory, "module.mjs")));
  let calls = 0;
  globalThis.__statusRequest = async (_path, options) => { calls++; assert.equal(options.signal instanceof AbortSignal, true); return { initial_setup: true }; };
  const [a, b] = await Promise.all([readInstanceStatus(), readInstanceStatus()]);
  assert.deepEqual(a, { initial_setup: true }); assert.deepEqual(b, a); assert.equal(calls, 1);
  await readInstanceStatus(); assert.equal(calls, 1);
  // A completed registration invalidates the previously observed initial setup state.
  const sessionSource = await readFile(new URL("../src/session/session.tsx", import.meta.url), "utf8");
  assert.match(sessionSource, /const me = await auth\.register\([\s\S]*?\);\s*resetInstanceStatus\(\)/);
  assert.match(sessionSource, /function invalidate\(\): void \{\s*resetInstanceStatus\(\)/);
  resetInstanceStatus();
  globalThis.__statusRequest = async () => { calls++; return { initial_setup: false }; };
  assert.deepEqual(await readInstanceStatus(), { initial_setup: false });
  assert.equal(calls, 2);
  resetInstanceStatus();
  let finishOld;
  globalThis.__statusRequest = () => { calls++; return new Promise((resolve) => { finishOld = resolve; }); };
  const oldRead = readInstanceStatus();
  resetInstanceStatus();
  globalThis.__statusRequest = async () => { calls++; return { initial_setup: false }; };
  assert.deepEqual(await readInstanceStatus(), { initial_setup: false });
  finishOld({ initial_setup: true });
  assert.equal(await oldRead, undefined);
  assert.deepEqual(await readInstanceStatus(), { initial_setup: false });
  assert.equal(calls, 4);
  resetInstanceStatus();
  globalThis.__statusRequest = async () => { calls++; throw { status: 429 }; };
  assert.equal(await readInstanceStatus(), undefined);
  assert.equal(await readInstanceStatus(), undefined); assert.equal(calls, 6);
  resetInstanceStatus();
  globalThis.__statusRequest = async () => { calls++; return {}; };
  assert.equal(await readInstanceStatus(), undefined);
  assert.equal(await readInstanceStatus(), undefined); assert.equal(calls, 8);
  resetInstanceStatus();
  let now = 1000;
  const realNow = Date.now;
  Date.now = () => now;
  try {
    globalThis.__statusRequest = async () => { calls++; return { initial_setup: false }; };
    await readInstanceStatus(); now += 60_001; await readInstanceStatus(); assert.equal(calls, 10);
  } finally { Date.now = realNow; }
  resetInstanceStatus();
  globalThis.__statusRequest = (_path, options) => new Promise((_resolve, reject) => {
    calls++;
    assert.equal(options.signal instanceof AbortSignal, true);
    options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true });
  });
  const keepAlive = setTimeout(() => {}, 3100);
  try { assert.equal(await readInstanceStatus(), undefined); } finally { clearTimeout(keepAlive); }
  assert.equal(calls, 11);
  console.log("instance status: shared request, registration reset, timeout, 429, unreadable and expired retry passed");
} finally { delete globalThis.__statusRequest; await rm(directory, { recursive: true, force: true }); }
