import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readEmailTokenFragment, takeEmailTokenFragment, emailErrorKey } from "../src/auth/emailToken.ts";

const token = "a".repeat(64);
assert.equal(readEmailTokenFragment(`#email_token=${token}`), token);
assert.equal(readEmailTokenFragment(`#email_token=${token}&other=value`), token);
assert.equal(readEmailTokenFragment("#email_token=bad"), undefined);
assert.equal(readEmailTokenFragment(`?email_token=${token}`), undefined);
let replaced = "";
const history = { state: { existing: true }, replaceState: (_state, _title, path) => { replaced = path; } };
assert.deepEqual(takeEmailTokenFragment({ hash: `#email_token=${token}`, pathname: "/register", search: "?invite=abc" }, history), { present: true, token });
assert.equal(replaced, "/register?invite=abc");
replaced = "";
assert.deepEqual(takeEmailTokenFragment({ hash: "#unrelated", pathname: "/register", search: "" }, history), { present: false });
assert.equal(replaced, "");
for (const code of ["registration_closed", "terms_required", "email_invalid", "email_domain_blocked", "captcha_failed", "email_token_invalid", "email_taken"]) {
  assert.ok(emailErrorKey(code).startsWith("emailRegistration."), `${code} mapping`);
}
const auth = readFileSync(new URL("../src/pages/Auth.tsx", import.meta.url), "utf8");
assert.match(auth, /takeEmailTokenFragment\(window\.location, window\.history\)/);
assert.match(auth, /auth\.verifyEmail\(token\)/);
assert.match(auth, /emailToken: emailToken\(\)/);
console.log("email registration fragment and error mapping: ok");
