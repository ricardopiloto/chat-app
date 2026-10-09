#!/usr/bin/env node
// Checks the pure logic of the text chat in src/chat/logic: timeline grouping, mentions, links,
// completion triggers, emoji and search helpers.
import { build } from "esbuild";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "verify-chat-"));
const entry = join(dir, "entry.ts");
const modules = ["timeline", "mentions", "links", "autocomplete", "emoji", "search", "permissions"];
writeFileSync(entry, modules.map((m) => `export * from ${JSON.stringify(resolve(root, `src/chat/logic/${m}.ts`))};`).join("\n"));
await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", outfile: join(dir, "chat.mjs"), logLevel: "error" });
const c = await import(pathToFileURL(join(dir, "chat.mjs")).href);

let failed = 0;
const check = (name, cond) => { console.log(`${cond ? "ok  " : "FAIL"}  ${name}`); if (!cond) failed++; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// --- timeline
const labels = { today: "Hoje", yesterday: "Ontem", full: (d) => d.toISOString().slice(0, 10) };
const msg = (id, sender, iso, extra = {}) => ({ id, channelId: "c", senderId: sender, text: id, createdAt: iso, system: false, attachmentIds: [], replyToId: undefined, replySenderId: undefined, mentionedIds: [], ...extra });
const now = new Date(2026, 9, 24, 12, 0, 0);
const at = (day, hour, min = 0) => new Date(2026, 9, day, hour, min).toISOString();
const rows = c.buildTimeline([msg("a", "u1", at(23, 9)), msg("b", "u1", at(23, 9, 1)), msg("c", "u1", at(23, 9, 2)), msg("d", "u2", at(23, 9, 3)), msg("e", "u1", at(24, 8)), msg("f", "u1", at(24, 9), { replyToId: "e" })], now, labels);
check("day separators appear once per day", rows.filter((r) => r.type === "day").length === 2);
check("separator labels: yesterday then today", same(rows.filter((r) => r.type === "day").map((r) => r.label), ["Ontem", "Hoje"]));
const starts = rows.filter((r) => r.type === "message").map((r) => r.startsGroup);
check("three consecutive messages of one sender form one group", same(starts.slice(0, 3), [true, false, false]));
const spacedRows = c.buildTimeline([msg("early", "u1", at(24, 9, 24)), msg("near", "u1", at(24, 9, 26)), msg("late", "u1", at(24, 9, 46))], now, labels);
const spacedStarts = spacedRows.filter((r) => r.type === "message").map((r) => r.startsGroup);
check("same sender stays grouped after two minutes", same(spacedStarts.slice(0, 2), [true, false]));
check("same sender starts a new group after twenty minutes", spacedStarts[2] === true);
check("another sender starts a new group", starts[3] === true);
check("a new day starts a new group even for the same sender", starts[4] === true);
check("a reply starts its own group", starts[5] === true);
check("system lines are not grouped", c.buildTimeline([msg("s", undefined, at(24, 8), { system: true })], now, labels).some((r) => r.type === "system"));
check("a date that is not today or yesterday uses the full label", c.dayLabel(new Date(2026, 9, 1), now, labels) === new Date(2026, 9, 1).toISOString().slice(0, 10));
const merged = c.mergeMessages([msg("a", "u1", at(24, 9))], [msg("c", "u1", at(24, 11)), msg("b", "u1", at(24, 10)), msg("a", "u1", at(24, 9))]);
check("merge orders by time and drops duplicates", same(merged.map((m) => m.id), ["a", "b", "c"]));

// --- mentions
const people = [{ accountId: "1", handle: "Thorin_Iron" }, { accountId: "2", handle: "elysia" }];
const parts = c.splitMentions("oi @thorin_iron e @fantasma, mail a@elysia.com", people);
check("a real member becomes a mention", parts.some((p) => p.type === "mention" && p.accountId === "1"));
check("an unknown handle stays plain text", !parts.some((p) => p.type === "mention" && p.value === "@fantasma"));
check("an address that contains @ is not a mention", !parts.some((p) => p.type === "mention" && p.accountId === "2"));
check("parts rebuild the original text", parts.map((p) => p.value).join("") === "oi @thorin_iron e @fantasma, mail a@elysia.com");
check("mentioned ids are unique", same(c.mentionedAccountIds("@elysia @elysia @thorin_iron", people), ["2", "1"]));
check("mentioned ids respect the limit", c.mentionedAccountIds("@elysia @thorin_iron", people, 1).length === 1);

// --- links
check("finds links and strips trailing punctuation", same(c.extractUrls("veja https://a.example/x, e (https://b.example)."), ["https://a.example/x", "https://b.example"]));
check("keeps at most five", c.extractUrls(Array.from({ length: 9 }, (_, i) => `https://s${i}.example`).join(" ")).length === 5);
check("repeats count once", c.extractUrls("https://a.example https://a.example").length === 1);
check("ignores text without links", c.extractUrls("sem links aqui").length === 0);

// --- completion
check("@ with letters completes a mention", same(c.detectCompletion("oi @tho", 7), { kind: "mention", query: "tho", start: 3 }));
check("a bare @ opens the member list", c.detectCompletion("@", 1)?.kind === "mention");
check(":fi completes an emoji", c.detectCompletion("hey :fi", 7)?.kind === "emoji");
check("a single letter after : does not", c.detectCompletion("hey :f", 6) === undefined);
check("an e-mail address does not trigger", c.detectCompletion("a@b", 3) === undefined);
const done = c.applyCompletion("oi @tho tchau", 7, { kind: "mention", query: "tho", start: 3 }, "@thorin_iron ");
check("applying a completion replaces the typed part", done.value === "oi @thorin_iron  tchau" && done.caret === 16);

// --- emoji
const fi = c.searchEmoji("fi", 40);
check("search puts prefix matches before containing matches", fi.findIndex((e) => !e.code.startsWith("fi")) === -1 || fi.slice(0, fi.findIndex((e) => !e.code.startsWith("fi"))).every((e) => e.code.startsWith("fi")));
check("an exact code is found", c.searchEmoji("fire").some((e) => e.code === "fire"));
check("search also finds by containing text", c.searchEmoji("ball").some((e) => e.code === "crystal_ball"));
check("complete shortcodes expand", c.expandShortcodes("vamos :fire: e :nope:") === "vamos 🔥 e :nope:");

// --- search
check("scoped query is split", same(c.parseQuery("#geral reliquia"), { channel: "geral", term: "reliquia" }));
check("plain query has no channel", same(c.parseQuery("reliquia antiga"), { channel: undefined, term: "reliquia antiga" }));
check("a bare channel has an empty term", same(c.parseQuery("#geral"), { channel: "geral", term: "" }));
const ex = c.excerptAround("encontraram a Relíquia do templo", "reliquia", 8);
check("excerpt ignores case and accents", ex?.hit === "Relíquia");
check("excerpt reports clipping", ex?.clippedStart === true && ex?.clippedEnd === true);
check("no match gives no excerpt", c.excerptAround("nada", "reliquia") === undefined);

// --- permissions: who may delete a message
const chan = { created_by_account_id: "creator", my_permission: "write" };
const owned = { owner_account_id: "owner" };
const note = msg("m", "author", at(24, 9));
const roleWith = (flag) => [{ member_ids: ["mod"], capabilities: { can_delete_messages: flag } }];
check("the author may delete", c.canDeleteMessage(note, "author", chan, owned, []));
check("the channel creator may delete", c.canDeleteMessage(note, "creator", chan, owned, []));
check("the server owner may delete", c.canDeleteMessage(note, "owner", chan, owned, []));
check("a role with the permission may delete", c.canDeleteMessage(note, "mod", chan, owned, roleWith(true)));
check("a role without the permission may not", !c.canDeleteMessage(note, "mod", chan, owned, roleWith(false)));
check("anyone else may not", !c.canDeleteMessage(note, "stranger", chan, owned, []));
check("system lines cannot be deleted", !c.canDeleteMessage(msg("s", undefined, at(24, 9), { system: true }), "owner", chan, owned, []));
check("only write access can send", c.canWrite(chan) && !c.canWrite({ ...chan, my_permission: "read" }));

console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
