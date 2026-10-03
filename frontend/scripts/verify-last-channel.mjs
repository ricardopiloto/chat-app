#!/usr/bin/env node
// Checks the last-channel memory and the two return targets, including storage that throws.
import { build } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "verify-last-channel-"));
await build({ entryPoints: [resolve(root, "src/shell/lastChannel.ts")], bundle: true, platform: "node", format: "esm", outfile: join(dir, "m.mjs"), logLevel: "error", nodePaths: [join(root, "node_modules")], conditions: ["browser"] });

let failed = 0;
const check = (name, cond) => { console.log(`${cond ? "ok  " : "FAIL"}  ${name}`); if (!cond) failed++; };
const load = async (storage) => { globalThis.localStorage = storage; return import(pathToFileURL(join(dir, "m.mjs")).href + `?${Math.random()}`); };

const data = {};
const { lastChannel, channelTarget, accountTarget } = await load({ getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } });
lastChannel.remember("me", "A", "geral");
lastChannel.remember("me", "B", "mesa");
check("last per server A", lastChannel.inServer("me", "A") === "geral");
check("last per server B", lastChannel.inServer("me", "B") === "mesa");
check("last overall", lastChannel.overall("me")?.channelId === "mesa");
check("other account sees nothing", lastChannel.overall("you") === undefined);
check("persisted", JSON.parse(data["mesa.lastChannel.v1"]).me.byServer.A === "geral");
lastChannel.forget("me", "mesa");
check("forget clears server and overall", lastChannel.inServer("me", "B") === undefined && lastChannel.overall("me") === undefined);
check("forget keeps the others", lastChannel.inServer("me", "A") === "geral");

check("server: remembered and listed", channelTarget("A", "geral", [{ id: "geral" }]) === "/servers/A/channels/geral");
check("server: remembered but gone", channelTarget("A", "geral", [{ id: "x" }]) === "/servers/A");
check("server: nothing remembered", channelTarget("A", undefined, [{ id: "x" }]) === "/servers/A");
const last = { serverId: "B", channelId: "mesa" };
check("account: listed", accountTarget(last, ["A", "B"], [{ id: "mesa" }]) === "/servers/B/channels/mesa");
check("account: channel gone", accountTarget(last, ["A", "B"], []) === "/");
check("account: server gone", accountTarget(last, ["A"], [{ id: "mesa" }]) === "/");
check("account: no memory", accountTarget(undefined, ["A"], []) === "/");

const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
const m = await load(blocked);
let threw = false;
try { m.lastChannel.remember("me", "A", "geral"); } catch { threw = true; }
check("blocked storage does not throw", !threw);
check("blocked storage still remembers in session", m.lastChannel.inServer("me", "A") === "geral");

process.exit(failed ? 1 : 0);
