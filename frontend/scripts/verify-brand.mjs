#!/usr/bin/env node
// Review visible brand text while preserving published storage, crypto and protocol contracts.
import { readFileSync, readdirSync } from "node:fs";
import { resolve, relative, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const inputs = ["frontend/src", "backend/src", "frontend/index.html", "README.md", "scripts", "infra"];
const historical = [/^docs\/archive\//, /^openspec\/changes\/archive\//, /^docs\/v2\//];
const omitted = new Set(["infra/.env"]);
const contractTokens = [
  /mesa-recovery-v1/g, /mesa-invite-seed-v1/g, /mesa:\/\//g, /mesa:[\w*-]+/g,
  /mesa\.(?:channelKey|instance|locale|theme|instance-admin-welcome|dev|soundPrefs|callPrefs|cameraBlur|call|pip|lastChannel|membersPanel)[\w.*:-]*/g,
  /mesa:/g, /x-mesa-media-type/gi, /__MESA_NATIVE__/g,
  /mesaNative/g, /MesaNativeBridge/g, /data-mesa-turnstile/g, /mesaTurnstile/g,
  /docs\/v2\/mesa_\*/g,
  /scripts\/install-mesa\.(?:sh|ps1)/g,
  /--mesa-title-bar/g,
];
const commonNouns = [
  /\bmesas? de RPG\b/g, /\bmesa física\b/g, /\buma mesa\b/g,
  /(?:nova|da|na|à|pela|outra|para a) mesa\b/g,
  /\bmesa \/ servidor\b/g, /\bservidor \/ mesa\b/g, /\bmesa reservada\b/g,
];
function files(path) {
  if (historical.some((pattern) => pattern.test(path)) || omitted.has(path)) return [];
  const full = join(root, path);
  const entries = readdirSync(full, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const child = `${path}/${entry.name}`;
    if (entry.isDirectory()) return files(child);
    return entry.isFile() && /\.(?:ts|tsx|rs|mjs|md|html|example|sh|ps1)$/.test(entry.name) ? [child] : [];
  });
}
const paths = inputs.flatMap((path) => path.includes(".") && !path.endsWith("/src") ? [path] : files(path));
const failures = [];
function isVisibleBrand(line, path) {
  let remainder = line;
  if (path === "scripts/install-mesa.sh" && /\/Applications\/Mesa\.app/.test(line)) return false;
  if (path === "backend/src/config.rs") remainder = remainder.replace(/"MESA_(?:PRODUCTION|ENV|RATE_LIMIT_DISABLED)"/g, "");
  if (path === "README.md" && /(?:transição do Mesa|instalação antiga do Mesa|dados antiga do Mesa|moving from Mesa to Parley)/i.test(line)) return false;
  for (const pattern of [...contractTokens, ...commonNouns]) remainder = remainder.replace(pattern, "");
  return /(?<![A-Za-z])mesa(?![A-Za-z])/i.test(remainder);
}
if (process.argv.includes("--self-test")) {
  const visibleBrand = [
    "Bem-vindo à Mesa", "Sua conta na Mesa foi criada", "Boas-vindas da Mesa",
    "Uma Mesa de RPG online", "Welcome to Mesa",
  ];
  const allowed = [
    "a mesa de RPG começa", "nova mesa", "mesa física",
    "mesa-recovery-v1", "mesa.channelKey.abc", "x-mesa-media-type",
  ];
  for (const sample of visibleBrand) {
    if (!isVisibleBrand(sample, "frontend/src/i18n/catalogs/en.ts")) throw new Error(`brand detector missed: ${sample}`);
  }
  for (const sample of allowed) {
    if (isVisibleBrand(sample, "frontend/src/i18n/catalogs/en.ts")) throw new Error(`brand detector rejected: ${sample}`);
  }
  console.log("Brand detector self-test passed.");
}
for (const path of paths) {
  if (omitted.has(path)) continue;
  const lines = readFileSync(join(root, path), "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (isVisibleBrand(line, path)) failures.push(`${path}:${index + 1}: ${line.trim()}`);
  });
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Brand check passed (${paths.length} files).`);
