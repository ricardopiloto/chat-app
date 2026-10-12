#!/usr/bin/env node
// Typing announcement cadence and who the channel page is allowed to show.
import { build } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "verify-typing-"));
await build({ entryPoints: [resolve(root, "src/chat/logic/typing.ts")], bundle: true, platform: "node", format: "esm", outfile: join(dir, "typing.mjs"), logLevel: "error" });
await build({ entryPoints: [resolve(root, "src/api/typingFrame.ts")], bundle: true, platform: "node", format: "esm", outfile: join(dir, "typingFrame.mjs"), logLevel: "error" });
const typing = await import(pathToFileURL(join(dir, "typing.mjs")).href);
const frames = await import(pathToFileURL(join(dir, "typingFrame.mjs")).href);

let failed = 0;
const check = (name, ok) => { console.log(`${ok ? "ok  " : "FAIL"}  ${name}`); if (!ok) failed++; };

const start = typing.reduceAnnounce(typing.idleAnnounce(), { type: "input", text: "o" }, 1_000);
check("first character announces", start.send === true && start.state.announced);
const again = typing.reduceAnnounce(start.state, { type: "input", text: "ol" }, 1_100);
check("another key does not announce again", again.send === null && again.state.announced);
const renew = typing.reduceAnnounce(again.state, { type: "tick" }, 1_000 + typing.TYPING_RENEW_MS);
check("renews on the cadence", renew.send === true);
const idle = typing.reduceAnnounce(again.state, { type: "tick" }, again.state.lastInputAt + typing.TYPING_IDLE_MS);
check("inactivity stops the announcement", idle.send === false && !idle.state.announced);
const quiet = typing.reduceAnnounce(idle.state, { type: "stop" }, 9_000);
check("stopping twice sends nothing", quiet.send === null);
const cleared = typing.reduceAnnounce(start.state, { type: "input", text: "   " }, 1_200);
check("clearing the field stops", cleared.send === false);

const me = "me";
const channel = "geral";
const notice = (accountId, active = true, channelId = channel) => ({ channelId, accountId, active });
let typers = typing.applyTyping([], notice("ada"), channel, me, 0);
typers = typing.applyTyping(typers, notice("bia"), channel, me, 10);
typers = typing.applyTyping(typers, notice("cio"), channel, me, 20);
typers = typing.applyTyping(typers, notice("me", true), channel, me, 30);
typers = typing.applyTyping(typers, notice("ada", true, "outro"), channel, me, 40);
const names = new Map([["ada", "Ada"], ["bia", "Bia"], ["cio", "Cio"]]);
check("other channel, self and unknown ids stay out", typing.namedTypers(typers, names, 50).join() === "Ada,Bia,Cio");
typers = typing.applyTyping(typers, notice("bia", false), channel, me, 60);
check("an explicit stop removes that member", typing.namedTypers(typers, names, 60).join() === "Ada,Cio");
check("a missing name is omitted", typing.namedTypers(typers, new Map([["ada", "Ada"]]), 60).join() === "Ada");
check("entries expire without a renewal", typing.namedTypers(typers, names, 20 + typing.TYPING_HOLD_MS).join() === "");
const wide = typing.summarizeTypers(["Ada", "Bia", "Cio"], 2);
const narrow = typing.summarizeTypers(["Ada", "Bia", "Cio"], 1);
check("two names stay, the rest are counted", wide.names.join() === "Ada,Bia" && wide.more === 1);
check("a narrow row keeps one name", narrow.names.join() === "Ada" && narrow.more === 2);

const sent = [];
const closed = { isOpen: () => false, send: (data) => sent.push(data) };
frames.deliverTyping(closed, channel, true);
frames.deliverTyping(null, channel, true);
check("a closed socket does not throw or queue", sent.length === 0);
const open = { isOpen: () => true, send: (data) => sent.push(data) };
frames.deliverTyping(open, channel, true);
check("an open socket sends one frame", sent.length === 1 && JSON.parse(sent[0]).type === "typing" && JSON.parse(sent[0]).active === true);

console.log(failed ? `${failed} failed` : "all passed");
process.exit(failed ? 1 : 0);
