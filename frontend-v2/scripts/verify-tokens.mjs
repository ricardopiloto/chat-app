#!/usr/bin/env node
// Verifies the design tokens in src/tokens.css and tailwind.config.ts against the product mockups:
//  - dark colours equal the palette every mockup declares in its own Tailwind config
//  - the light theme defines every token the dark theme defines
//  - Tailwind registers each colour token as a CSS variable, and the type scale matches the mockups
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docs = resolve(root, "../docs/v2");
const css = readFileSync(join(root, "src/tokens.css"), "utf8");
const tailwind = readFileSync(join(root, "tailwind.config.ts"), "utf8");

const block = (selector) => {
  const start = css.indexOf(selector);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i);
  }
  return "";
};
const vars = (text) => new Map([...text.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().toLowerCase()]));
const dark = vars(block(':root, [data-theme="dark"]'));
const light = vars(block('[data-theme="light"]'));

let failed = 0;
const check = (name, ok, detail = "") => { console.log(`${ok ? "ok  " : "FAIL"}  ${name}${detail ? "  " + detail : ""}`); if (!ok) failed++; };

// 1. mockup palettes
const mockups = readdirSync(docs).filter((d) => existsSync(join(docs, d, "code.html")));
let withPalette = 0;
const mismatches = new Map();
for (const dir of mockups) {
  const html = readFileSync(join(docs, dir, "code.html"), "utf8");
  const m = html.match(/"colors":\s*\{([^}]*)\}/);
  if (!m) continue;
  withPalette++;
  for (const [, name, value] of m[1].matchAll(/"([\w-]+)":\s*"(#[0-9a-fA-F]{3,8})"/g)) {
    const ours = dark.get(name);
    if (ours !== value.toLowerCase()) (mismatches.get(name) ?? mismatches.set(name, new Set()).get(name)).add(`${dir}: ${value} vs ${ours}`);
  }
}
check(`dark palette equals the palette declared by the mockups (${withPalette} mockups with a palette)`, mismatches.size === 0 && withPalette >= 20,
  mismatches.size ? JSON.stringify([...mismatches].slice(0, 3).map(([k, v]) => [k, [...v][0]])) : "");

// 2. light theme complete
const colourTokens = [...dark.keys()].filter((k) => dark.get(k).startsWith("#"));
const missingLight = colourTokens.filter((k) => !light.has(k));
check(`light theme defines all ${colourTokens.length} colour tokens`, missingLight.length === 0, missingLight.join(", "));
const sameAsDark = colourTokens.filter((k) => light.get(k) === dark.get(k));
console.log(`note  ${sameAsDark.length} tokens keep the same value in both themes (kept on purpose): ${sameAsDark.join(", ")}`);

// 3. tailwind registers every colour token through its CSS variable
const registered = new Set([...tailwind.matchAll(/"([\w-]+)"/g)].map((m) => m[1]));
const unregistered = colourTokens.filter((k) => !registered.has(k));
check("Tailwind registers every colour token", unregistered.length === 0, unregistered.join(", "));
check("Tailwind colours resolve through CSS variables", /var\(--\$\{token\}\)/.test(tailwind));

// 4. type scale, radius, spacing against the mockups' Tailwind config
const firstHtml = readFileSync(join(docs, "mesa_shell_da_aplica_o_chat_de_texto/code.html"), "utf8");
const sizes = [...firstHtml.matchAll(/"([\w-]+)":\s*\[\s*"(\d+px)",\s*\{\s*"lineHeight":\s*"(\d+px)"/g)];
const badSizes = sizes.filter(([, name, size, line]) => !new RegExp(`"${name}":\\s*\\["${size}",\\s*\\{\\s*lineHeight:\\s*"${line}"`).test(tailwind));
check(`type scale matches the mockups (${sizes.length} styles)`, sizes.length > 8 && badSizes.length === 0, badSizes.map((s) => s[1]).join(", "));
const spacing = [...firstHtml.matchAll(/"(space-[a-z]+|gutter|margin|gutter-desktop|margin-desktop)":\s*"([\d.]+rem)"/g)];
const badSpacing = spacing.filter(([, name, value]) => !new RegExp(`"?${name}"?:\\s*"${value}"`).test(tailwind));
check(`spacing scale matches the mockups (${spacing.length} steps)`, spacing.length >= 8 && badSpacing.length === 0, badSpacing.map((s) => s[1]).join(", "));
check("breakpoints: mobile < 768, tablet 768-1024, desktop 1025+", /mobile:\s*\{\s*max:\s*"767px"/.test(tailwind) && /tablet:\s*"768px"/.test(tailwind) && /desktop:\s*"1025px"/.test(tailwind));
check("fonts: Plus Jakarta Sans, Inter, JetBrains Mono", ["Plus Jakarta Sans", "Inter", "JetBrains Mono"].every((f) => tailwind.includes(f)) && ["Plus Jakarta Sans", "Inter", "JetBrains Mono"].every((f) => readFileSync(join(root, "index.html"), "utf8").includes(f.replace(/ /g, "+"))));
check("elevation tokens exist in both themes", ["shadow-floating", "shadow-stage"].every((k) => dark.has(k) && light.has(k)));
check("radius scale exists (sm, DEFAULT, md, lg, xl, full)", ["sm", "DEFAULT", "md", "lg", "xl", "full"].every((k) => new RegExp(`${k}:\\s*"`).test(tailwind)));

console.log(failed ? `${failed} failed` : "all passed");
process.exit(failed ? 1 : 0);
