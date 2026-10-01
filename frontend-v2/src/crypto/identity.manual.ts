import { generateIdentity, IdentityUnlockError, unlockIdentityVault, wrapIdentity } from "./identity";

/**
 * Manual browser check of the identity vault. With Vite running, from the browser console:
 *   const { runIdentityRoundTripManualCheck } = await import('/src/crypto/identity.manual.ts');
 *   await runIdentityRoundTripManualCheck();
 * Cross-version compatibility is covered by the contract vectors (`npm run test:contracts`), which
 * were produced by the previous application, and by the live check recorded in verification.md.
 */
export async function runIdentityRoundTripManualCheck(): Promise<string> {
  const password = "round-trip-password";
  const original = generateIdentity();
  const vault = await wrapIdentity(original, password);
  const reopened = await unlockIdentityVault(JSON.parse(JSON.stringify(vault)), password);
  if (reopened.secretKey.join() !== original.secretKey.join()) throw new Error("round trip changed the secret key");

  const refusal = await unlockIdentityVault(vault, "another password").then(
    () => null,
    (error: unknown) => error,
  );
  if (!(refusal instanceof IdentityUnlockError) || refusal.reason !== "bad_password") {
    throw new Error("a wrong password must raise IdentityUnlockError(bad_password)");
  }
  return "ok: round trip keeps the secret key; wrong password raises bad_password";
}
