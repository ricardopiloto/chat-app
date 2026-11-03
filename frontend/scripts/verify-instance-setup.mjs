import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inviteForVariant, modeForSetupVariant, resolveSetupVariant } from "../src/auth/setupVariant.ts";

assert.equal(resolveSetupVariant({ initial_setup: true }), "setup");
assert.equal(resolveSetupVariant({ initial_setup: false }), "normal");
assert.equal(inviteForVariant(resolveSetupVariant({ initial_setup: true }), " invited "), "");
assert.equal(inviteForVariant(resolveSetupVariant({ initial_setup: false }), " invited "), "invited");
assert.equal(resolveSetupVariant({ initial_setup: true }, undefined, 403), "normal");
assert.equal(resolveSetupVariant(undefined, new Error("network")), "normal");
assert.equal(resolveSetupVariant(undefined, { status: 429 }), "normal");
assert.equal(modeForSetupVariant("setup", "login"), "register");
assert.equal(modeForSetupVariant("setup", "register"), "register");
assert.equal(modeForSetupVariant("normal", "login"), "login");
assert.equal(modeForSetupVariant("normal", "register"), "register");

const authSource = readFileSync(new URL("../src/pages/Auth.tsx", import.meta.url), "utf8");
assert.match(authSource, /onMount\(\(\) => \{\s*if \(isNative\(\) && !currentInstance\(\)\.baseUrl\) return;/);
assert.equal((authSource.match(/instance\.status\(\)/g) ?? []).length, 1);
assert.doesNotMatch(authSource, /createEffect/);
const setupQuery = authSource.match(/onMount\(\(\) => \{([\s\S]*?)\n  \}\);/)?.[1];
assert.ok(setupQuery);
assert.doesNotMatch(setupQuery, /mode\(\)/);
assert.match(authSource, /onCleanup\(\(\) => \{ cancelled = true; \}\)/);
console.log("instance setup variant: 17 passed");
