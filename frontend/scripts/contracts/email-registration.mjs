import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const auth = readFileSync(new URL("../../src/api/endpoints/auth.ts", import.meta.url), "utf8");
const types = readFileSync(new URL("../../src/api/types.ts", import.meta.url), "utf8");
const session = readFileSync(new URL("../../src/session/session.tsx", import.meta.url), "utf8");
for (const endpoint of ["/api/auth/register/config", "/api/auth/email/request", "/api/auth/email/verify"]) {
  assert.ok(auth.includes(endpoint), `${endpoint} missing`);
}
assert.match(types, /email_token\?: string/);
assert.match(session, /email_token: emailToken/);
console.log("email registration API contracts: ok");
