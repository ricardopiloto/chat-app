// Unit checks for the invite seed link and the handoff gate. Run with:
//   node --experimental-strip-types scripts/invite-handoff.test.mjs
import assert from "node:assert/strict";
import { createHandoffGate } from "../src/crypto/handoffGate.ts";
import {
  SEED_TTL_SECONDS,
  createInviteSeed,
  encodeSeedBlob,
  inviteFragment,
  inviteUrl,
  parseInviteFragment,
} from "../src/crypto/inviteSeed.ts";
import { captureInviteFragment, ingestDeepLink, readInviteFragment, takeInviteFragment } from "../src/crypto/inviteLink.ts";

const serverKey = new Uint8Array(32).fill(4);
const seed = createInviteSeed(serverKey);
const url = inviteUrl("https://mesa.example", "abc", seed.secret);
const body = JSON.stringify({ key_seed: encodeSeedBlob(seed.blob), expires_in_seconds: SEED_TTL_SECONDS });
const secretText = inviteFragment(seed.secret).slice(2);
assert.equal(SEED_TTL_SECONDS, 86400);
assert.ok(url.includes("#k="));
assert.ok(!url.split("#")[0].includes(secretText));
assert.ok(!body.includes(secretText));
assert.ok(!body.includes("#"));
assert.deepEqual(parseInviteFragment(url.slice(url.indexOf("#"))), seed.secret);

const hash = url.slice(url.indexOf("#"));
captureInviteFragment(hash);
assert.deepEqual(readInviteFragment(), seed.secret);
ingestDeepLink(`https://mesa.example/invite/other${hash}`);
assert.deepEqual(takeInviteFragment(), seed.secret);
assert.equal(takeInviteFragment(), null);

const gate = createHandoffGate(4);
let inFlight = 0;
let maxInFlight = 0;
let sends = 0;
const ids = Array.from({ length: 10 }, (_, index) => `server:${index}`);
const results = await Promise.all(
  Array.from({ length: 20 }, (_, index) =>
    gate.run(ids[index % 10], async () => {
      sends += 1;
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 15));
      inFlight -= 1;
      return index % 10 === 0 ? "conflict" : "ok";
    }),
  ),
);
assert.equal(sends, 10);
assert.ok(maxInFlight <= 4, `in flight ${maxInFlight}`);
assert.equal(results.filter((result) => result === "ok").length, 10);
assert.equal(results.filter((result) => result === "duplicate").length, 10);

let attempts = 0;
const retry = createHandoffGate(4);
assert.equal(await retry.run("once", async () => {
  attempts += 1;
  return "error";
}), "error");
assert.equal(await retry.run("once", async () => {
  attempts += 1;
  return "ok";
}), "ok");
assert.equal(attempts, 2);
assert.equal(await retry.run("once", async () => "ok"), "duplicate");

console.log("invite-handoff: ok");
