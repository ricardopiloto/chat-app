import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { homedir } from "node:os";

const cache = join(homedir(), ".npm/_npx");
let packagePath;
for (const name of await readdir(cache)) {
  const candidate = join(cache, name, "node_modules/playwright-core/index.mjs");
  if (existsSync(candidate)) { packagePath = candidate; break; }
}
if (!packagePath) throw new Error("Run npx --yes --package playwright-core playwright --version first");
const { chromium } = await import(pathToFileURL(packagePath).href);
const versions = (await readdir(join(homedir(), ".cache/ms-playwright"))).filter((name) => name.startsWith("chromium-")).sort().reverse();
const executablePath = versions.map((name) => join(homedir(), ".cache/ms-playwright", name, "chrome-linux64/chrome")).find(existsSync);
if (!executablePath) throw new Error("Chromium executable missing from ~/.cache/ms-playwright");
const browser = await chromium.launch({ executablePath, headless: true, args: ["--ignore-certificate-errors"] });
// Usage: node scripts/measure-controls.mjs [url ...]  (default: the dev server login). Dev servers use a
// self-signed certificate (basic-ssl), so certificate errors are ignored for this local check.
const urls = process.argv.slice(2).length ? process.argv.slice(2) : ["https://localhost:1421/login"];
let failed = false;
for (const url of urls) for (const width of [390, 768, 1280]) for (const theme of ["light", "dark"]) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, ignoreHTTPSErrors: true, colorScheme: theme, locale: "pt-BR" });
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForTimeout(1500);
  const groups = await page.locator(".entry-control").evaluateAll((nodes) => {
    const out = {};
    for (const node of nodes) {
      const box = node.getBoundingClientRect();
      if (!box.height) continue;
      const key = node.closest("form, [role='dialog'], dialog, section, header, main")?.tagName.toLowerCase() ?? "other";
      (out[key] ??= []).push({ control: (node.getAttribute("aria-label") || node.textContent?.trim() || node.className).slice(0, 28), height: Math.round(box.height * 100) / 100 });
    }
    return out;
  });
  console.log(`\n${url} ${width}px ${theme}`);
  for (const [group, items] of Object.entries(groups)) {
    const heights = items.map((item) => item.height);
    const spread = Math.round((Math.max(...heights) - Math.min(...heights)) * 100) / 100;
    const verdict = spread <= 1 ? "ok" : "DIFERENTE";
    if (spread > 1) failed = true;
    console.log(`  ${group}: ${verdict} (${spread}px) ${items.map((item) => `${item.control}=${item.height}`).join(" | ")}`);
  }
  await context.close();
}
await browser.close();
if (failed) process.exitCode = 1;
