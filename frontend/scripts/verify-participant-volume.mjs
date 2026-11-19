#!/usr/bin/env node
// Checks the per-handle volume preference store: clamp, default, round-trip, isolation.
import { build } from "esbuild";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "verify-participant-volume-"));
const entry = join(dir, "entry.ts");
writeFileSync(entry, `export * from ${JSON.stringify(resolve(root, "src/voice/participantVolume.ts"))};\nexport * from ${JSON.stringify(resolve(root, "src/voice/applyVolumeForIdentity.ts"))};`);
await build({
  entryPoints: [entry],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: join(dir, "volume.mjs"),
  logLevel: "error",
  nodePaths: [join(root, "node_modules")],
  conditions: ["browser"],
});

let failed = 0;
const check = (name, cond) => {
  console.log(`${cond ? "ok  " : "FAIL"}  ${name}`);
  if (!cond) failed++;
};

const data = new Map();
globalThis.localStorage = {
  getItem: (key) => (data.has(key) ? data.get(key) : null),
  setItem: (key, value) => data.set(key, String(value)),
  removeItem: (key) => data.delete(key),
};

const mod = await import(pathToFileURL(join(dir, "volume.mjs")).href);
const { clampVolume, volumeForHandle, setVolumeForHandle, VOLUME_DEFAULT, applyVolumeForIdentity } = mod;

check("default is 100 for unknown handle", volumeForHandle("alice") === VOLUME_DEFAULT);
check("clamp rejects NaN", clampVolume(Number.NaN) === VOLUME_DEFAULT);
check("clamp floors below 0", clampVolume(-10) === 0);
check("clamp caps above 200", clampVolume(250) === 200);

setVolumeForHandle("alice", 150);
check("alice round-trips at 150", volumeForHandle("alice") === 150);
check("bob still defaults to 100", volumeForHandle("bob") === VOLUME_DEFAULT);

setVolumeForHandle("alice", 100);
check("writing 100 clears alice entry", volumeForHandle("alice") === VOLUME_DEFAULT);

setVolumeForHandle("carol", 40);
const raw = JSON.parse(data.get("mesa.participantVolume.v1"));
check("storage keeps only non-default entries", raw.carol === 40 && raw.alice === undefined);

const aliceAudio = { dataset: { identity: "alice" }, volume: 1 };
const bobAudio = { dataset: { identity: "bob" }, volume: 1 };
const audioHost = { querySelectorAll: (selector) => selector === "audio" ? [aliceAudio, bobAudio] : [] };
const applyElementVolume = (el, percent) => { el.volume = percent / 100; return true; };
const originalWarn = console.warn;
let warning;
console.warn = (...args) => { warning = args; };
try {
  check("zero matching elements returns false", applyVolumeForIdentity(audioHost, "carol", 50, applyElementVolume) === false);
} finally {
  console.warn = originalWarn;
}
check("zero-match warning includes searched and present identities", warning?.[1]?.identity === "carol" && warning[1].presentIdentities.join(",") === "alice,bob");
check("one matching element returns true", applyVolumeForIdentity(audioHost, "alice", 50, applyElementVolume) === true);
check("only matching audio element changes", aliceAudio.volume === 0.5 && bobAudio.volume === 1);

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log("all passed");
