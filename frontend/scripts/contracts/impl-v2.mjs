// Adapter that runs the v2 implementation under the contract harness:
//   node scripts/contracts/run.mjs --impl scripts/contracts/impl-v2.mjs
// Identity vault and sealed box come from src/crypto/vault.ts. The AES message/attachment functions
// belong to the text-chat phase and are still taken from the reference implementation.
export { wrapVault, unlockVault, seal, unseal } from "../../src/crypto/vault.ts";
export { createInviteSeed, encodeSeedBlob, inviteUrl, openInviteSeed } from "../../src/crypto/inviteSeed.ts";
export {
  canonicalIdentityVaultJson,
  deriveRecovery,
  newRecoveryCode,
  recoveryPayloadHash,
  recoverySignMessage,
  signRecovery,
  signWithRecoveryCode,
  unwrapRecovery,
  verifyRecovery,
  wrapRecovery,
} from "../../src/crypto/recovery.ts";
export { encryptBytes, decryptBytes, encryptMessage, decryptMessage } from "./reference.mjs";
