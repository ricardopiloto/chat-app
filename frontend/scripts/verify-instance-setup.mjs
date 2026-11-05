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
assert.match(authSource, /if \(isNative\(\) && !currentInstance\(\)\.baseUrl\) return/);
assert.match(authSource, /readInstanceStatus\(\)/);
assert.doesNotMatch(authSource, /instance\.status\(\)/);
assert.doesNotMatch(authSource, /createEffect/);
assert.match(authSource, /onCleanup\(\(\) => \{ cancelled = true; \}\)/);
const owner = readFileSync(new URL("../src/auth/instanceStatus.ts", import.meta.url), "utf8");
assert.match(owner, /AbortSignal\.timeout\(3000\)/);
assert.match(owner, /const query = request/);
assert.match(owner, /pending = query/);
assert.match(owner, /Date\.now\(\) - cached\.at < MAX_AGE_MS/);
console.log("instance setup variant and shared status owner: passed");
