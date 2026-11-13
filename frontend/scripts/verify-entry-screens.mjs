import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const { entryScreen } = await import(process.env.ENTRY_SCREEN_MODULE ?? "../src/auth/entryScreen.ts");

const base = { native: false, baseUrl: null, phase: "anonymous", pathname: "/", search: "", hash: "", nativeEntry: "home" };
const cases = [
  [{ pathname: "/__foundation" }, "foundation"],
  [{ pathname: "/invite/abc" }, "invite"],
  [{ search: "?invite=abc" }, "auth"],
  [{ search: "?signin=1" }, "auth"],
  [{ pathname: "/register", hash: "#email_token=abc" }, "auth"],
  [{ pathname: "/recover" }, "recover"],
  [{ pathname: "/login" }, "auth"],
  [{ pathname: "/login", phase: "loading" }, "loading"],
  [{ initialSetup: true }, "auth"],
  [{}, "home-web"],
  [{ phase: "loading" }, "loading"],
  [{ phase: "locked" }, "unlock"],
  [{ phase: "ready" }, "app"],
  [{ phase: "ready", hash: "#/call-popout/abc" }, "call-popout"],
  [{ native: true, pathname: "/index.html", phase: "loading" }, "home-desktop"],
  [{ native: true, pathname: "/index.html", baseUrl: "https://example.test" }, "home-desktop"],
  [{ native: true, baseUrl: "https://example.test", nativeEntry: "login" }, "auth"],
  [{ native: true, baseUrl: "https://example.test", nativeEntry: "register" }, "auth"],
];
for (const [overrides, expected] of cases) assert.equal(entryScreen({ ...base, ...overrides }), expected, JSON.stringify(overrides));

const newScreens = ["src/auth/entryScreen.ts", "src/auth/nativeEntry.ts", "src/entry.css", "src/pages/WebPublicHome.tsx", "src/pages/MarketingHome.tsx", "src/marketing.css", "src/pages/ElectronHome.tsx"];
for (const file of newScreens) {
  let content;
  try { content = readFileSync(new URL(`../${file}`, import.meta.url), "utf8"); } catch { continue; }
  assert.doesNotMatch(content, /#[\da-fA-F]{3,8}\b|rgb\s*\(/, `Literal color in ${file}`);
}
const protectedFiles = ["frontend/src/tokens.css", "frontend/tailwind.config.ts", "frontend/src/components/ui.css", "frontend/src/components/ui"];
const diff = spawnSync("git", ["diff", "--name-only", "--", ...protectedFiles], { cwd: new URL("../..", import.meta.url), encoding: "utf8" });
assert.equal(diff.status, 0, "Could not inspect protected design-system files");
// Feature panels can add icon aliases without changing entry-screen tokens or UI controls.
const changedProtected = diff.stdout.trim().split("\n").filter((file) => file && file !== "frontend/src/components/ui/icon-map.ts");
assert.equal(changedProtected.length, 0, "Protected design-system files changed");
console.log(`${cases.length} entry cases, literal-color guard and protected-file diff passed`);
