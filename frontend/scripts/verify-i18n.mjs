#!/usr/bin/env node
// Checks the i18n engine in src/i18n: language negotiation, runtime switching and fallbacks.
import { build } from "esbuild";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "verify-i18n-"));
const entry = join(dir, "entry.ts");
writeFileSync(entry, `export * from ${JSON.stringify(resolve(root, "src/i18n/index.ts"))};
export * from ${JSON.stringify(resolve(root, "src/i18n/negotiate.ts"))};
export * from ${JSON.stringify(resolve(root, "src/i18n/messages.ts"))};`);
await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", outfile: join(dir, "i18n.mjs"), logLevel: "error", nodePaths: [join(root, "node_modules")], conditions: ["browser"] });

// A tiny in-memory localStorage so persistence can be observed.
const data = new Map();
globalThis.localStorage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, String(v)) };
const i18n = await import(pathToFileURL(join(dir, "i18n.mjs")).href);

let failed = 0;
const check = (name, cond) => { console.log(`${cond ? "ok  " : "FAIL"}  ${name}`); if (!cond) failed++; };

check("en-US negotiates to en", i18n.negotiateLocale(["en-US", "pt-BR"]) === "en");
check("pt-PT negotiates to pt-BR", i18n.negotiateLocale(["pt-PT"]) === "pt-BR");
check("unsupported language falls back to pt-BR", i18n.negotiateLocale(["fr-FR", "de"]) === "pt-BR");
check("first supported preference wins", i18n.negotiateLocale(["fr", "en", "pt"]) === "en");
check("empty preferences fall back to pt-BR", i18n.negotiateLocale([]) === "pt-BR");

const flat = i18n.merge({ a: { b: "um" }, c: "x" }, { a: { b: "dois" } });
check("merge: later catalog wins", flat.get("a.b") === "dois" && flat.get("c") === "x");
check("interpolate replaces known placeholders", i18n.interpolate("Olá {name}, {n}", { name: "Ana", n: 3 }) === "Olá Ana, 3");
check("interpolate keeps unknown placeholders visible", i18n.interpolate("Olá {name}", {}) === "Olá {name}");

i18n.setLocale("pt-BR");
const pt = i18n.t("shell.signOut");
i18n.setLocale("en");
const en = i18n.t("shell.signOut");
check("switching language changes the text without reload", pt !== en && en.length > 0 && pt !== "shell.signOut");
check("language choice is persisted", data.get("mesa.locale") === "en");
check("getLocale reflects the active language", i18n.getLocale() === "en");
i18n.setLocale("xx");
check("unsupported language is ignored", i18n.getLocale() === "en" && data.get("mesa.locale") === "en");
check("unknown key falls back to the key itself, without throwing", i18n.t("does.not.exist") === "does.not.exist");
check("placeholders are applied through t()", i18n.t("does.not.{x}", { x: "y" }) === "does.not.y");

console.log(failed ? `${failed} failed` : "all passed");
process.exit(failed ? 1 : 0);
