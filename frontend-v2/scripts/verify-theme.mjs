#!/usr/bin/env node
// Checks the three-state theme in src/shell/theme.ts: persistence, applying a fixed mode, and that
// "system" follows the operating system's scheme while the app is open.
import { build } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "verify-theme-"));
await build({ entryPoints: [resolve(root, "src/shell/theme.ts")], bundle: true, platform: "node", format: "esm", outfile: join(dir, "theme.mjs"), logLevel: "error", nodePaths: [join(root, "node_modules")], conditions: ["browser"] });

// Browser stand-ins: storage, the document element, and a media query whose result can be flipped.
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => void store.set(k, String(v)) };
globalThis.document = { documentElement: { dataset: {} } };
const listeners = new Set();
const query = { matches: true, addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) };
globalThis.matchMedia = () => query;
const osChanges = (dark) => { query.matches = dark; listeners.forEach((fn) => fn()); };
const shown = () => document.documentElement.dataset.theme;

const theme = await import(pathToFileURL(join(dir, "theme.mjs")).href);
let failed = 0;
const check = (name, ok) => { console.log(`${ok ? "ok  " : "FAIL"}  ${name}`); if (!ok) failed++; };

check("no saved choice reads as system", theme.readTheme() === "system");
theme.setThemeMode("light");
check("light is applied at once", shown() === "light" && theme.themeMode() === "light");
check("the choice is remembered", store.get("mesa.theme") === "light" && theme.readTheme() === "light");
theme.setThemeMode("dark");
check("dark is applied at once", shown() === "dark");
theme.setThemeMode("system");
check("system follows the OS (dark now)", shown() === "dark");
const stop = theme.watchSystemTheme(theme.themeMode);
osChanges(false);
check("OS switches to light: the app follows without a reload", shown() === "light");
osChanges(true);
check("OS switches back to dark: the app follows", shown() === "dark");
theme.setThemeMode("light");
osChanges(true);
check("a fixed mode ignores OS changes", shown() === "light");
stop();
check("the watcher can be removed", listeners.size === 0);
console.log(failed ? `${failed} failed` : "all passed");
process.exit(failed ? 1 : 0);
