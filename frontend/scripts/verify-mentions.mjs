#!/usr/bin/env node
// Checks how @handle and @todos are read out of a message body.
import { build } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "verify-mentions-"));
await build({ entryPoints: [resolve(root, "src/chat/logic/mentions.ts")], bundle: true, platform: "node", format: "esm", outfile: join(dir, "m.mjs"), logLevel: "error" });
const { splitMentions, mentionsEveryone, mentionedAccountIds } = await import(pathToFileURL(join(dir, "m.mjs")).href);

let failed = 0;
const check = (name, ok) => { console.log(`${ok ? "ok  " : "FAIL"}  ${name}`); if (!ok) failed++; };
const people = [{ accountId: "a1", handle: "bob" }, { accountId: "a2", handle: "todos" }];
const types = (parts) => parts.map((p) => p.type).join(",");

check("detects @todos as a whole word", mentionsEveryone("@todos reunião") && mentionsEveryone("oi @TODOS!") && mentionsEveryone("a\n@todos"));
check("does not detect inside other words or e-mails", !mentionsEveryone("@todosantos") && !mentionsEveryone("ana@todos.com") && !mentionsEveryone("todos"));
check("without the server mark, @todos is not an everyone part", !types(splitMentions("@todos olá", [people[0]])).includes("everyone"));
check("with the mark, @todos becomes an everyone part", types(splitMentions("@todos olá", [people[0]], true)) === "everyone,text");
check("the mark does not touch member mentions", types(splitMentions("@bob e @todos", people.slice(0, 1), true)) === "mention,text,everyone");
check("a member called todos is shadowed only when marked", types(splitMentions("@todos", people, false)) === "mention" && types(splitMentions("@todos", people, true)) === "everyone");
check("@todos never becomes an individual mention id", mentionedAccountIds("@todos @bob", [people[0]]).join() === "a1");
console.log(failed ? `${failed} failed` : "all passed");
process.exit(failed ? 1 : 0);
