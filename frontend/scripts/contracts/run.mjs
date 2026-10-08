#!/usr/bin/env node
// Contract test harness: runs an implementation against docs/v2/contracts/vectors/crypto-vectors.json.
// Usage: node scripts/contracts/run.mjs [--impl <module>] [--vectors <file>]
// The module must export: unlockVault, wrapVault, seal, unseal, encryptBytes, decryptBytes, encryptMessage, decryptMessage
// (see reference.mjs). Runs in Node, no browser needed. Exit code 1 on any failure.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import nacl from "tweetnacl";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const implPath = resolve(opt("--impl", join(here, "reference.mjs")));
const vectorsPath = resolve(opt("--vectors", join(here, "../../../docs/v2/contracts/vectors/crypto-vectors.json")));
const impl = await import(pathToFileURL(implPath).href);
const vectors = JSON.parse(readFileSync(vectorsPath, "utf8"));

const bytes = (b64) => Uint8Array.from(Buffer.from(b64, "base64"));
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

let passed = 0;
const failures = [];
const pending = [];
function check(name, fn) {
  pending.push(
    (async () => {
      try {
        await fn();
        passed++;
      } catch (err) {
        failures.push(`${name}: ${err.message}`);
      }
    })(),
  );
}
const expect = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const rejects = async (fn) => {
  try {
    await fn();
  } catch {
    return true;
  }
  return false;
};

vectors.identityVault.forEach((v, i) =>
  check(`identityVault[${i}] read`, async () => {
    const id = await impl.unlockVault(v.vault, v.password);
    expect(same(id.secretKey, bytes(v.secretKey)), "secret key differs");
    expect(same(id.publicKey, bytes(v.publicKey)), "public key differs");
    expect(v.vault.v === 1 && v.vault.salt.length === 16 && v.vault.iv.length === 12 && v.vault.wrapped.length === 48, "vault shape");
  }),
);
vectors.identityVault.forEach((v, i) =>
  check(`identityVault[${i}] write round-trip`, async () => {
    const id = { publicKey: bytes(v.publicKey), secretKey: bytes(v.secretKey) };
    const vault = await impl.wrapVault(id, v.password);
    expect(vault.v === 1 && vault.salt.length === 16 && vault.iv.length === 12 && vault.wrapped.length === 48, "written vault shape");
    expect(same((await impl.unlockVault(vault, v.password)).secretKey, id.secretKey), "round-trip secret key differs");
  }),
);
vectors.sealedBox.forEach((v, i) => {
  check(`sealedBox[${i}] read`, () => {
    const opened = impl.unseal(bytes(v.sealed), bytes(v.recipientPublicKey), bytes(v.recipientSecretKey));
    expect(opened && same(opened, bytes(v.plaintext)), "plaintext differs");
  });
  check(`sealedBox[${i}] write round-trip`, () => {
    const pk = bytes(v.recipientPublicKey);
    const sealed = impl.seal(bytes(v.plaintext), pk);
    expect(sealed.length === 32 + bytes(v.plaintext).length + 16, "sealed length");
    const opened = impl.unseal(sealed, pk, bytes(v.recipientSecretKey));
    expect(opened && same(opened, bytes(v.plaintext)), "round-trip differs");
  });
});
vectors.aesPacked.forEach((v, i) => {
  check(`aesPacked[${i}] read`, async () => {
    expect(same(await impl.decryptBytes(bytes(v.key), bytes(v.packed)), bytes(v.plaintext)), "plaintext differs");
  });
  check(`aesPacked[${i}] write round-trip`, async () => {
    const packed = await impl.encryptBytes(bytes(v.key), bytes(v.plaintext));
    expect(packed.length === 12 + bytes(v.plaintext).length + 16, "packed length");
    expect(same(await impl.decryptBytes(bytes(v.key), packed), bytes(v.plaintext)), "round-trip differs");
  });
});
check("message read", async () => {
  expect((await impl.decryptMessage(bytes(vectors.message.key), vectors.message.ciphertext)) === vectors.message.text, "text differs");
});
check("message write round-trip", async () => {
  const ct = await impl.encryptMessage(bytes(vectors.message.key), vectors.message.text);
  expect((await impl.decryptMessage(bytes(vectors.message.key), ct)) === vectors.message.text, "round-trip differs");
});

const n = vectors.negative;
check("negative: wrong password rejected", async () => {
  expect(await rejects(() => impl.unlockVault(n.wrongPassword.vault, n.wrongPassword.password)), "wrong password was accepted");
});
check("negative: tampered sealed box rejected", () => {
  const opened = impl.unseal(bytes(n.tamperedSealed.sealed), bytes(n.tamperedSealed.recipientPublicKey), bytes(n.tamperedSealed.recipientSecretKey));
  expect(opened === null, "tampered sealed box was accepted");
});
check("negative: tampered AES packet rejected", async () => {
  expect(await rejects(() => impl.decryptBytes(bytes(n.tamperedPacked.key), bytes(n.tamperedPacked.packed))), "tampered packet was accepted");
});
check("sanity: harness library is the expected NaCl", () => {
  expect(nacl.box.keyPair().publicKey.length === 32, "nacl");
});

if (impl.wrapRecovery && impl.deriveRecovery && impl.signRecovery && impl.verifyRecovery) {
  const handle = "Alice";
  const code = "0123-4567-89AB-CDEF-GHJK-MNPQ-RS";
  const identity = nacl.box.keyPair();
  check("recovery: round-trip and wrong code", async () => {
    const material = await impl.wrapRecovery(identity, code, handle);
    const opened = await impl.unwrapRecovery(material.vault, code, handle);
    expect(same(opened.secretKey, identity.secretKey), "recovered secret differs");
    expect(await rejects(() => impl.unwrapRecovery(material.vault, "0123456789ABCDEFGHJKMNPQRT", handle)), "wrong code was accepted");
  });
  check("recovery: wrap and sign domains differ", async () => {
    const material = await impl.wrapRecovery(identity, code, handle);
    const master = new Uint8Array(32).fill(9);
    const derived = impl.deriveRecovery(master);
    expect(!same(derived.wrapKey, derived.signSeed), "domains collided");
    expect(material.verifierPublicKey.length === 32, "verifier length");
  });
  check("recovery: signature is bound to operation, handle and payload", async () => {
    const left = new Uint8Array(16).fill(1);
    const right = new Uint8Array(32).fill(2);
    const message = impl.recoverySignMessage("start", handle, left, right);
    const signature = await impl.signWithRecoveryCode(code, handle, message);
    const material = await impl.wrapRecovery(identity, code, handle);
    expect(impl.verifyRecovery(message, signature, material.verifierPublicKey), "signature rejected");
    const other = impl.recoverySignMessage("redeem", handle, left, right);
    expect(!impl.verifyRecovery(other, signature, material.verifierPublicKey), "operation was not bound");
    const otherHandle = impl.recoverySignMessage("start", "bob", left, right);
    expect(!impl.verifyRecovery(otherHandle, signature, material.verifierPublicKey), "handle was not bound");
  });
  if (vectors.recovery) {
    const vector = vectors.recovery;
    check("recovery: published vector", async () => {
      const signature = await impl.signWithRecoveryCode(vector.code, vector.handle, bytes(vector.message));
      expect(same(signature, bytes(vector.signature)), "signature differs from the vector");
      expect(impl.canonicalIdentityVaultJson(vector.vault) === vector.canonicalVault, "canonical vault differs");
      const hash = await impl.recoveryPayloadHash(vector.password, vector.canonicalVault);
      expect(same(hash, bytes(vector.payloadHash)), "payload hash differs");
    });
  }
}

await Promise.all(pending);
if (passed + failures.length === 0) {
  console.log("FAIL  no checks ran");
  process.exit(1);
}
for (const f of failures) console.log(`FAIL  ${f}`);
console.log(`${passed} passed, ${failures.length} failed  (${implPath.split("/").slice(-2).join("/")})`);
process.exit(failures.length ? 1 : 0);
