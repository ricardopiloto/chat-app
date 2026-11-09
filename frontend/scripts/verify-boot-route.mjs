#!/usr/bin/env node
import { build } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "verify-boot-route-"));
await build({ entryPoints: [resolve(root, "src/shell/bootRoute.ts")], bundle: true, platform: "node", format: "esm", outfile: join(dir, "m.mjs"), logLevel: "error", nodePaths: [join(root, "node_modules")], conditions: ["browser"] });

let failed = 0;
const check = (name, cond) => { console.log(`${cond ? "ok  " : "FAIL"}  ${name}`); if (!cond) failed++; };
const load = async (pathname) => { globalThis.location = { pathname }; return import(pathToFileURL(join(dir, "m.mjs")).href + `?${Math.random()}`); };

for (const pathname of ["/", "/servers/A", "/servers/A/settings"]) {
  const route = await load(pathname);
  check(`${pathname}: no channel requires consent`, !route.needsExplicitConsent("X") && !route.needsExplicitConsent("Y"));
}

for (const pathname of ["/servers/A/channels/X", "/servers/A/channels/X/"]) {
  const route = await load(pathname);
  check(`${pathname}: exact channel requires consent`, route.needsExplicitConsent("X") && !route.needsExplicitConsent("Y"));
  globalThis.location.pathname = "/servers/A/channels/Y";
  check(`${pathname}: navigation does not change boot channel`, route.needsExplicitConsent("X") && !route.needsExplicitConsent("Y"));
  route.resolveBootChannel();
  route.resolveBootChannel();
  check(`${pathname}: resolution is idempotent`, !route.needsExplicitConsent("X"));
}

process.exit(failed ? 1 : 0);
