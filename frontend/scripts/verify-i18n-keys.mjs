#!/usr/bin/env node
// Compares the message keys the app really uses (t("…") in src) with both catalogs.
// Fails on: a used key missing from either language, or a key present in one language only.
// Dynamic keys (t(`a.${x}`), t(variable)) are listed so they can be reviewed by hand.
import { build } from "esbuild";
import { mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "verify-keys-"));
const entry = join(dir, "entry.ts");
const cat = (f) => JSON.stringify(resolve(root, "src/i18n/catalogs", f));
writeFileSync(entry, `import { merge } from ${JSON.stringify(resolve(root, "src/i18n/messages.ts"))};
import { en } from ${cat("en")}; import { ptBR } from ${cat("pt-BR")};
import { en as lEn } from ${cat("legacy/en")}; import { ptBR as lPt } from ${cat("legacy/pt-BR")};
import { chatEn } from ${cat("chat.en")}; import { chatPtBR } from ${cat("chat.pt-BR")};
import { mgmtEn } from ${cat("mgmt.en")}; import { mgmtPtBR } from ${cat("mgmt.pt-BR")};
import { settingsEn } from ${cat("settings.en")}; import { settingsPtBR } from ${cat("settings.pt-BR")};
import { voiceEn } from ${cat("voice.en")}; import { voicePtBR } from ${cat("voice.pt-BR")};
export const messages = { "pt-BR": merge(lPt, ptBR, mgmtPtBR, settingsPtBR, chatPtBR, voicePtBR), en: merge(lEn, en, mgmtEn, settingsEn, chatEn, voiceEn) };`);
await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", outfile: join(dir, "m.mjs"), logLevel: "error", nodePaths: [join(root, "node_modules")] });
const { messages } = await import(pathToFileURL(join(dir, "m.mjs")).href);

const files = [];
(function walk(d) { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) { if (n !== "catalogs") walk(p); } else if (/\.tsx?$/.test(n)) files.push(p); } })(join(root, "src"));

const used = new Map(); const dynamic = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/\bt\(\s*(["'`])([^"'`]*?)\1/g)) {
    if (m[1] === "`" && m[2].includes("${")) dynamic.push([f, m[2]]);
    else if (/^[\w-]+(\.[\w-]+)+$/.test(m[2])) (used.get(m[2]) ?? used.set(m[2], []).get(m[2])).push(f);
  }
  for (const m of src.matchAll(/\bt\(\s*([a-zA-Z_][\w.()]*)\s*[,)]/g)) dynamic.push([f, `t(${m[1]})`]);
  // literal keys passed around as data: "something.key"-shaped strings that exist in a catalog are counted as used
  for (const m of src.matchAll(/(["'])((?:[a-z][\w-]*)(?:\.[\w-]+)+)\1/g)) if (messages.en.has(m[2]) || messages["pt-BR"].has(m[2])) (used.get(m[2]) ?? used.set(m[2], []).get(m[2])).push(f);
}
let failed = 0;
for (const [key, where] of used) for (const lang of ["pt-BR", "en"]) if (!messages[lang].has(key)) { console.log(`MISSING ${lang}: ${key}  (${where[0].replace(root + "/", "")})`); failed++; }
for (const lang of ["pt-BR", "en"]) { const other = lang === "en" ? "pt-BR" : "en"; for (const k of messages[lang].keys()) if (!messages[other].has(k)) { console.log(`ONLY ${lang}: ${k}`); failed++; } }

// Dynamic key families: every member the code can build must exist in both languages.
const caps = ["can_view_channels", "can_manage_channels", "can_manage_roles", "can_create_invites", "can_remove_members", "can_mute_members", "can_send_messages", "can_delete_messages", "can_attach_files", "can_connect_voice", "can_speak_voice"];
const FAMILIES = {
  "mgmt.channel.level.": ["read", "write", "listen", "speak"],
  "mgmt.channel.": ["typeRole", "typeMember", "typeEveryone"],
  "mgmt.channel.inspect.": ["allowed", "denied", "ignored", "memberNote", "roleNote", "everyoneNote", "verdict", "rule"],
  "mgmt.roles.": [...caps, ...caps.map((c) => c + "_text"), "groupGeneral", "groupText", "groupVoice"],
  "mgmt.onboarding.": ["handle_checking", "handle_free", "handle_taken", "handle_unknown", ...[0, 1, 2, 3, 4].map((n) => "strength" + n)],
  "shell.": ["noChannels", "chooseChannel", "noServers", "noChannelsHint", "chooseChannelHint", "noServersHint"],
  "call.blur.": ["off", "light", "strong"],
  "call.problem.": ["denied", "noKey", "unavailable", "failed", "kicked"],
  "call.notice.": ["cameraFailed", "deviceMissing", "encryption", "micFailed"],
  "txt.emoji.group.": ["faces", "gestures", "nature", "objects", "play", "symbols"],
  "admin.": ["genericError"],
};
for (const [prefix, names] of Object.entries(FAMILIES)) for (const n of names) for (const lang of ["pt-BR", "en"]) if (!messages[lang].has(prefix + n)) { console.log(`MISSING ${lang}: ${prefix}${n} (dynamic family)`); failed++; }
const same = [...messages.en].filter(([k, v]) => messages["pt-BR"].get(k) === v && v.length > 12 && /\s/.test(v));
console.log(`\nused keys: ${used.size}; en: ${messages.en.size}; pt-BR: ${messages["pt-BR"].size}; dynamic call sites: ${dynamic.length}`);
if (process.argv.includes("--dynamic")) for (const [f, k] of dynamic) console.log(`  dynamic ${k}  ${f.replace(root + "/", "")}`);
if (process.argv.includes("--same")) for (const [k, v] of same) console.log(`  identical en/pt-BR: ${k} = ${v}`);
const unused = [...messages.en.keys()].filter((k) => !used.has(k));
console.log(`unused keys (informative): ${unused.length}`);
if (process.argv.includes("--unused")) unused.forEach((k) => console.log("  unused", k));
console.log(failed ? `${failed} problems` : "all passed");
process.exit(failed ? 1 : 0);
