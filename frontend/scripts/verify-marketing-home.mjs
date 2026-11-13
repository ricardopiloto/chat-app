import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { homeMode } from "../src/auth/homeMode.ts";
import { entryScreen } from "../src/auth/entryScreen.ts";

assert.equal(homeMode("marketing"), "marketing");
for (const marker of [undefined, "", "other"]) assert.equal(homeMode(marker), "public");
const base = { native: false, baseUrl: "web", phase: "anonymous", pathname: "/", search: "", hash: "", initialSetup: false, nativeEntry: "home" };
assert.equal(entryScreen(base), "home-web");
for (const [pathname, search, expected] of [["/invite/abc", "", "invite"], ["/login", "", "auth"], ["/register", "", "auth"], ["/recover", "", "recover"], ["/", "?invite=abc", "auth"]]) {
  assert.equal(entryScreen({ ...base, pathname, search }), expected);
}
const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const home = readFileSync(new URL("../home.html", import.meta.url), "utf8");
assert.match(home, /<html[^>]*data-home="marketing"/);
assert.doesNotMatch(index, /data-home=/);
assert.match(home, /<noscript>.*<\/noscript>/s);
assert.doesNotMatch(index, /<noscript>/);
const normalize = (html) => html.replace(/<head>[\s\S]*?<\/head>/, "<head></head>").replace(' data-home="marketing"', "").replace(/<noscript>[\s\S]*?<\/noscript>/, "");
assert.equal(normalize(home), normalize(index));
const source = readFileSync(new URL("../src/index.tsx", import.meta.url), "utf8");
assert.match(source, /homeMode\(document\.documentElement\.dataset\.home\)/);
assert.match(source, /marketingHome \? <MarketingHome \/> : <WebPublicHome \/>/);
console.log("marketing home selection and HTML parity passed");
