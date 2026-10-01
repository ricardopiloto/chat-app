import { generateIdentity, IdentityUnlockError, unlockIdentityVault, wrapIdentity, type IdentityVault } from "./identity";
import * as v1Identity from "../../../frontend/src/crypto/identity";

/**
 * Manual browser check. From the browser console after starting Vite, run:
 *   const { runIdentityRoundTripManualCheck } = await import('/src/crypto/identity.manual.ts');
 *   await runIdentityRoundTripManualCheck();
 *   const { runV1VaultCompatibilityManualCheck } = await import('/src/crypto/identity.manual.ts');
 *   await runV1VaultCompatibilityManualCheck();
 */
export async function runIdentityRoundTripManualCheck(): Promise<void> {
  const id = generateIdentity();
  const vault = await wrapIdentity(id, "Mesa-roundtrip-password-1");
  const opened = await unlockIdentityVault(vault, "Mesa-roundtrip-password-1");
  if (opened.secretKey.length !== id.secretKey.length || opened.secretKey.some((byte, index) => byte !== id.secretKey[index])) {
    throw new Error("Identity round-trip produced a different secret key");
  }
  try {
    await unlockIdentityVault(vault, "incorrect-password");
    throw new Error("Incorrect password unexpectedly unlocked the identity");
  } catch (error) {
    if (!(error instanceof IdentityUnlockError) || error.reason !== "bad_password") throw error;
  }
}

/** Cross-version format check using the production v1 crypto implementation. */
export async function runV1VaultCompatibilityManualCheck(): Promise<void> {
  const id = v1Identity.generateIdentity();
  const password = "Mesa-v1-compatibility-password-1";
  const legacyVault = await v1Identity.wrapIdentity(id, password);
  const persistedVault = JSON.parse(JSON.stringify(legacyVault)) as IdentityVault;
  const opened = await unlockIdentityVault(persistedVault, password);
  if (opened.secretKey.length !== id.secretKey.length || opened.secretKey.some((byte, index) => byte !== id.secretKey[index])) {
    throw new Error("The v2 implementation could not open a vault created by v1");
  }
}
