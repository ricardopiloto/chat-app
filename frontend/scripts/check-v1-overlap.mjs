#!/usr/bin/env node
// Measures how much of each frontend-v2 source file also appears in the v1 frontend.
// Method: strip comments, tokenize, take every run of N consecutive tokens (a "shingle"),
// and report the share of a v2 file's shingles that occur anywhere in frontend/src.
// Gate (frontend-v2-foundation D7): UI files <= 15%, logic files <= 30%.
//
// Usage: node scripts/check-v1-overlap.mjs [--dir <v2 src>] [--v1 <v1 src>] [--json] [paths...]
//   paths: optional files/dirs inside frontend-v2/src to restrict the check to.
// Exit code 1 when any file exceeds its limit and has no entry in scripts/v1-overlap-exceptions.json.
// An exception is either a string (the reason) or { "reason": "...", "maxRun": N }. With maxRun the
// exception only holds while no shared run of consecutive tokens is longer than N: shared framework
// idioms (imports, signals, closing tags) form short runs, copied logic forms long ones.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  const [, value] = args.splice(i, 2);
  return value;
};
const asJson = args.includes("--json");
if (asJson) args.splice(args.indexOf("--json"), 1);
const v2Dir = resolve(flag("--dir", join(here, "../src")));
const v1Dir = resolve(flag("--v1", join(here, "../../frontend/src")));
const only = args.map((p) => resolve(p));

const SHINGLE = 6;
const longestRun = (toks, known) => {
  let best = 0;
  let run = 0;
  for (let i = 0; i + SHINGLE <= toks.length; i++) {
    if (known.has(toks.slice(i, i + SHINGLE).join("\u0001"))) run = run ? run + 1 : SHINGLE;
    else run = 0;
    best = Math.max(best, run);
  }
  return best;
};
const MIN_TOKENS = 80;
const LIMIT = { ui: 0.15, logic: 0.3 };
const SOURCE = /\.(tsx?|css)$/;
const UI = /\.(tsx|css)$/;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (SOURCE.test(name)) out.push(full);
  }
  return out;
}

function tokens(file) {
  const text = readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
  return text.match(/[A-Za-z_$][\w$]*|\d+|[^\sA-Za-z_$\d]/g) ?? [];
}

function shingles(toks) {
  const out = new Set();
  for (let i = 0; i + SHINGLE <= toks.length; i++) out.add(toks.slice(i, i + SHINGLE).join("\u0001"));
  return out;
}

if (!existsSync(v1Dir)) {
  console.error(`v1 source not found at ${v1Dir}`);
  process.exit(2);
}

const v1 = new Set();
for (const file of walk(v1Dir)) for (const s of shingles(tokens(file))) v1.add(s);

const exceptionsFile = join(here, "v1-overlap-exceptions.json");
const exceptions = existsSync(exceptionsFile) ? JSON.parse(readFileSync(exceptionsFile, "utf8")) : {};

const rows = [];
for (const file of walk(v2Dir)) {
  if (only.length && !only.some((p) => file === p || file.startsWith(p + "/"))) continue;
  const toks = tokens(file);
  if (toks.length < MIN_TOKENS) continue;
  const mine = shingles(toks);
  let shared = 0;
  for (const s of mine) if (v1.has(s)) shared++;
  const ratio = mine.size ? shared / mine.size : 0;
  const kind = UI.test(file) ? "ui" : "logic";
  const rel = relative(v2Dir, file);
  const entry = exceptions[rel];
  const reason = typeof entry === "string" ? entry : entry?.reason;
  const run = ratio > LIMIT[kind] ? longestRun(toks, v1) : 0;
  const excused = entry !== undefined && (typeof entry === "string" || run <= entry.maxRun);
  rows.push({ file: rel, kind, tokens: toks.length, overlap: ratio, limit: LIMIT[kind], over: ratio > LIMIT[kind], excused, reason, run });
}
rows.sort((a, b) => b.overlap - a.overlap);

const failing = rows.filter((r) => r.over && !r.excused);
if (asJson) {
  console.log(JSON.stringify({ files: rows, failing: failing.length }, null, 2));
} else {
  for (const r of rows) {
    const mark = r.over ? (r.excused ? "EXCUSED" : "FAIL   ") : "ok     ";
    console.log(`${mark} ${(r.overlap * 100).toFixed(0).padStart(3)}% (max ${(r.limit * 100).toFixed(0)}%)  ${String(r.tokens).padStart(6)} tok  ${r.kind.padEnd(5)} ${r.file}${r.over && r.run ? `  longest shared run ${r.run}` : ""}${r.excused ? `  -- ${r.reason}` : ""}`);
  }
  const total = rows.reduce((n, r) => n + r.tokens, 0);
  const weighted = rows.reduce((n, r) => n + r.overlap * r.tokens, 0) / Math.max(1, total);
  console.log(`\n${rows.length} files, weighted overlap ${(weighted * 100).toFixed(0)}%, ${failing.length} failing`);
}
process.exit(failing.length ? 1 : 0);
