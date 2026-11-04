import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseRecoverFragment } from "../src/auth/recoverFragment.ts";

assert.equal(parseRecoverFragment("#handle=alice"), "alice");
assert.equal(parseRecoverFragment("#handle=A%20B"), "A B");
assert.equal(parseRecoverFragment("#other=alice"), undefined);
assert.equal(parseRecoverFragment("#handle="), undefined);
assert.equal(parseRecoverFragment("#handle=" + "a".repeat(257)), undefined);
const page = readFileSync(new URL("../src/pages/Recover.tsx", import.meta.url), "utf8");
assert.match(page, /parseRecoverFragment\(window\.location\.hash\)/);
assert.match(page, /setPath\("key"\)/);
assert.match(page, /setHandle\(linkedHandle\)/);
assert.match(page, /history\.replaceState\(window\.history\.state, "", window\.location\.pathname \+ window\.location\.search\)/);
console.log("email reset fragment: ok");
