#!/usr/bin/env node
// ORACLE GENERATOR — not part of the v2 implementation.
// Runs the crypto of the application that already exists (the code currently in src/crypto, which
// mirrors what accounts in production were created with) and records inputs and outputs as vectors.
// Run only to (re)generate docs/v2/contracts/vectors/crypto-vectors.json:
//   node scripts/contracts/gen-vectors.mjs
// Implementations under test never import this file; they are checked against the vectors.

import { build } from "esbuild";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const out = resolve(root, "../docs/v2/contracts/vectors/crypto-vectors.json");

const dir = mkdtempSync(join(tmpdir(), "oracle-"));
const entry = join(dir, "entry.ts");
writeFileSync(
  entry,
  `export * from ${JSON.stringify(resolve(root, "src/crypto/identity.ts"))};
   export * from ${JSON.stringify(resolve(root, "src/crypto/serverKey.ts"))};`,
);
const bundle = join(dir, "oracle.mjs");
await build({
  entryPoints: [entry],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: bundle,
  logLevel: "error",
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  nodePaths: [join(root, "node_modules")],
});
const oracle = await import(pathToFileURL(bundle).href);

const b64 = (u8) => Buffer.from(u8).toString("base64");
const enc = new TextEncoder();
const rnd = (n) => crypto.getRandomValues(new Uint8Array(n));

const vectors = { version: 1, identityVault: [], sealedBox: [], aesPacked: [], negative: {} };

for (const password of ["correct horse battery", "Sénha-com-acentos-ção ✓", "12345678"]) {
  const id = oracle.generateIdentity();
  const vault = await oracle.wrapIdentity(id, password);
  vectors.identityVault.push({
    password,
    vault,
    publicKey: b64(id.publicKey),
    secretKey: b64(id.secretKey),
  });
}

for (const len of [32, 1, 100]) {
  const recipient = oracle.generateIdentity();
  const plaintext = rnd(len);
  const sealed = oracle.seal(plaintext, recipient.publicKey);
  vectors.sealedBox.push({
    recipientPublicKey: b64(recipient.publicKey),
    recipientSecretKey: b64(recipient.secretKey),
    plaintext: b64(plaintext),
    sealed: b64(sealed),
  });
}

const key = oracle.generateServerKey();
for (const plain of [enc.encode("Olá, mesa! ✓ @vtest1"), enc.encode(""), rnd(1500)]) {
  const packed = await oracle.encryptBytes(key, plain);
  vectors.aesPacked.push({ key: b64(key), plaintext: b64(plain), packed: b64(packed) });
}
const message = "Segunda mensagem https://example.com";
vectors.message = {
  key: b64(key),
  text: message,
  ciphertext: await oracle.encryptMessage(key, message),
};

// Negative cases
const v0 = vectors.identityVault[0];
vectors.negative.wrongPassword = { vault: v0.vault, password: "not the password" };
const s0 = Buffer.from(vectors.sealedBox[0].sealed, "base64");
s0[40] ^= 0xff;
vectors.negative.tamperedSealed = {
  recipientPublicKey: vectors.sealedBox[0].recipientPublicKey,
  recipientSecretKey: vectors.sealedBox[0].recipientSecretKey,
  sealed: b64(s0),
};
const p0 = Buffer.from(vectors.aesPacked[0].packed, "base64");
p0[p0.length - 1] ^= 0x01;
vectors.negative.tamperedPacked = { key: vectors.aesPacked[0].key, packed: b64(p0) };

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(vectors, null, 2) + "\n");
console.log(`wrote ${out}`);
