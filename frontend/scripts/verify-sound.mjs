#!/usr/bin/env node
// Checks the pure parts of the sound effects: quiet window, saved preference.
import { build } from "esbuild";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "verify-sound-"));
const entry = join(dir, "entry.ts");
writeFileSync(entry, `export * from ${JSON.stringify(resolve(root, "src/sound/effects.ts"))};`);
await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", outfile: join(dir, "sound.mjs"), logLevel: "error", nodePaths: [join(root, "node_modules")], conditions: ["browser"] });

let failed = 0;
const check = (name, cond) => { console.log(`${cond ? "ok  " : "FAIL"}  ${name}`); if (!cond) failed++; };

const mod0 = await (async () => {
  globalThis.localStorage = { getItem: () => null, setItem: () => {} };
  return import(pathToFileURL(join(dir, "sound.mjs")).href);
})();
const { createQuietWindow, QUIET_MS } = mod0;

// --- quiet window
let clock = 1000;
const pass = createQuietWindow(QUIET_MS, () => clock);
check("first mention passes", pass("mention") === true);
clock += 1000;
check("burst inside the window is dropped", pass("mention") === false);
check("other effect is independent", pass("callJoin") === true);
check("call-leave is independent", pass("callLeave") === true);
clock += 1500;
check("mention still quiet at 2.5 s", pass("mention") === false);
check("call-leave still quiet at 1.5 s", pass("callLeave") === false);
clock += 500;
check("call-join passes again after 2 s", pass("callJoin") === true);
check("call-leave passes again after 2 s", pass("callLeave") === true);
clock += 500;
check("mention passes after 3 s", pass("mention") === true);

// --- preference
const data = new Map();
const loadFresh = async (storage) => {
  globalThis.localStorage = storage;
  const bundle = join(dir, `sound-${Math.random().toString(36).slice(2)}.mjs`);
  await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", outfile: bundle, logLevel: "error", nodePaths: [join(root, "node_modules")], conditions: ["browser"] });
  return import(pathToFileURL(bundle).href);
};
const memory = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, String(v)) };
let m = await loadFresh(memory);
check("on by default", m.soundPrefs.enabled() === true);
m.soundPrefs.setEnabled(false);
check("change is immediate", m.soundPrefs.enabled() === false);
m = await loadFresh(memory);
check("choice survives a reload", m.soundPrefs.enabled() === false);
const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
m = await loadFresh(blocked);
check("blocked storage: on by default", m.soundPrefs.enabled() === true);
m.soundPrefs.setEnabled(false);
check("blocked storage: works for the session", m.soundPrefs.enabled() === false);

console.log(failed ? `${failed} failed` : "all passed");
process.exit(failed ? 1 : 0);
