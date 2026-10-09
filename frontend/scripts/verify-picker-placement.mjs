#!/usr/bin/env node
// Checks which side the reaction emoji picker opens on.
import { build } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "verify-picker-"));
await build({ entryPoints: [resolve(root, "src/chat/logic/popover.ts")], bundle: true, platform: "node", format: "esm", outfile: join(dir, "m.mjs"), logLevel: "error" });
const { PICKER_HEIGHT_PX, pickPlacement } = await import(pathToFileURL(join(dir, "m.mjs")).href);

let failed = 0;
const check = (name, ok) => { console.log(`${ok ? "ok  " : "FAIL"}  ${name}`); if (!ok) failed++; };
const fits = (side) => side.placement && side.maxHeight === undefined;

check("opens below when that side fits, even if above also fits", (() => {
  const side = pickPlacement({ below: PICKER_HEIGHT_PX, above: PICKER_HEIGHT_PX + 80 });
  return fits(side) && side.placement === "below";
})());
check("opens above when only that side fits", (() => {
  const side = pickPlacement({ below: PICKER_HEIGHT_PX - 1, above: PICKER_HEIGHT_PX });
  return fits(side) && side.placement === "above";
})());
check("shrinks onto the larger side when neither fits", (() => {
  const side = pickPlacement({ below: 120, above: 200 });
  return side.placement === "above" && side.maxHeight === 196;
})());
check("equal space that fits on neither side stays below", (() => {
  const side = pickPlacement({ below: 180, above: 180 });
  return side.placement === "below" && side.maxHeight === 176;
})());
console.log(failed ? `${failed} failed` : "all passed");
process.exit(failed ? 1 : 0);
