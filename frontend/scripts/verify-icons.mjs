#!/usr/bin/env node
// Every icon name used in the app has an entry in icon-map.ts.
import { build } from "esbuild";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, out);
    else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) out.push(path);
  }
  return out;
}

const used = new Set();
const quoted = (text) => [...text.matchAll(/"([a-z][a-z0-9_]*)"/g)].map((match) => match[1]);
for (const path of walk(src)) {
  const text = readFileSync(path, "utf8");
  for (const match of text.matchAll(/<Icon\s+name="([a-z][a-z0-9_]*)"/g)) used.add(match[1]);
  for (const match of text.matchAll(/\b(?:icon|glyph)\s*(?::|=)\s*"([a-z][a-z0-9_]*)"/g)) used.add(match[1]);
  for (const match of text.matchAll(/name=\{([^{}]*)\}/g)) {
    const expr = match[1].replace(/[!=]==\s*"[a-z0-9_]+"/g, "");
    for (const name of quoted(expr)) used.add(name);
  }
  for (const ident of text.matchAll(/name=\{([A-Z_][A-Z0-9_]*)/g)) {
    const block = text.match(new RegExp(`const ${ident[1]}[^=]*=\\s*\\{([\\s\\S]*?)\\}`));
    if (block) for (const name of quoted(block[1])) used.add(name);
  }
}

const dir = mkdtempSync(join(tmpdir(), "verify-icons-"));
await build({
  stdin: {
    contents: `export { iconMap } from "./src/components/ui/icon-map.ts";\n`,
    resolveDir: root,
    sourcefile: "verify-icons-entry.ts",
    loader: "ts",
  },
  bundle: true,
  platform: "browser",
  format: "esm",
  outfile: join(dir, "m.mjs"),
  logLevel: "error",
});

const { iconMap } = await import(pathToFileURL(join(dir, "m.mjs")).href);
const missing = [...used].filter((name) => typeof iconMap[name] !== "function").sort();
let failed = 0;
const check = (name, cond) => {
  console.log(`${cond ? "ok  " : "FAIL"}  ${name}`);
  if (!cond) failed++;
};

check(`${used.size} icon names in use`, used.size > 0);
check("every used name is in the map", missing.length === 0);
if (missing.length) console.error("missing:", missing.join(", "));

if (failed) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
console.log("icon map checks passed");
