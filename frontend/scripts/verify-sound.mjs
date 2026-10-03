#!/usr/bin/env node
// Checks the pure parts of the sound effects: arrival detection, quiet window, saved preference.
import { build } from "esbuild";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "verify-sound-"));
const entry = join(dir, "entry.ts");
writeFileSync(entry, `export * from ${JSON.stringify(resolve(root, "src/sound/arrivals.ts"))};
export * from ${JSON.stringify(resolve(root, "src/sound/effects.ts"))};`);
await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", outfile: join(dir, "sound.mjs"), logLevel: "error", nodePaths: [join(root, "node_modules")], conditions: ["browser"] });

let failed = 0;
const check = (name, cond) => { console.log(`${cond ? "ok  " : "FAIL"}  ${name}`); if (!cond) failed++; };

// --- arrivals
const mod0 = await (async () => {
  globalThis.localStorage = { getItem: () => null, setItem: () => {} };
  return import(pathToFileURL(join(dir, "sound.mjs")).href);
})();
const { arrivals, createQuietWindow, QUIET_MS } = mod0;
const set = (...ids) => new Set(ids);
check("one person arrives", arrivals(set("a", "me"), ["a", "me", "b"], "me").join() === "b");
check("my own entry is not an arrival", arrivals(set("a"), ["a", "me"], "me").length === 0);
check("several arrivals", arrivals(set("me"), ["me", "b", "c"], "me").join() === "b,c");
check("leave and join in one event", arrivals(set("me", "a"), ["me", "b"], "me").join() === "b");
check("no previous list means no arrival", arrivals(undefined, ["me", "a", "b"], "me").length === 0);
check("reconnection with the same people", arrivals(set("me", "a"), ["me", "a"], "me").length === 0);

// --- quiet window
let clock = 1000;
const pass = createQuietWindow(QUIET_MS, () => clock);
check("first mention passes", pass("mention") === true);
clock += 1000;
check("burst inside the window is dropped", pass("mention") === false);
check("other effect is independent", pass("callJoin") === true);
clock += 1500;
check("mention still quiet at 2.5 s", pass("mention") === false);
clock += 500;
check("call-join passes again after 2 s", pass("callJoin") === true);
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
