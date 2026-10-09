import { absoluteResource } from "../instance";
import { MEDIA_TYPE_HEADER, http, request } from "../http";
import type { Account, IdentityVaultPayload, RegisterBody } from "../types";
import type { RecoveryVault } from "../../crypto/recovery";

export const auth = {
  register: (body: RegisterBody) => http.post<Account>("/api/auth/register", body),
  login: (handle: string, password: string) => http.post<Account>("/api/auth/login", { handle, password }),
  logout: () => http.post<void>("/api/auth/logout"),
  /** The backend answers 204 (no body) when there is no session, so the result is `undefined` then. */
  me: () => http.get<Account | undefined>("/api/auth/me"),
  /** Stores the password-wrapped identity (the backend never sees the secret key). */
  saveVault: (vault: IdentityVaultPayload) => http.put<void>("/api/auth/identity-vault", vault),
  /** Replaces the account identity (recovery): new public key plus its vault. */
  replaceIdentity: (identityPubkey: string, vault: IdentityVaultPayload) =>
    http.put<Account>("/api/auth/identity", { identity_pubkey: identityPubkey, identity_vault: vault }),
  recoverWithCode: (body: { handle: string; code: string; password: string; identity_pubkey: string; identity_vault: IdentityVaultPayload }) =>
    http.post<Account>("/api/auth/recovery/code/redeem", body),
  changePassword: (currentPassword: string, newPassword: string, vault: IdentityVaultPayload) =>
    http.put<void>("/api/auth/password", { current_password: currentPassword, new_password: newPassword, identity_vault: vault }),
  recoveryChallenge: (handle: string) => http.post<{ challenge_id: string; nonce: string }>("/api/auth/recovery/key/challenge", { handle }),
  recoveryStart: (body: { handle: string; challenge_id: string; nonce: string; signature: string }) =>
    http.post<{ recovery_vault: RecoveryVault; ticket: string }>("/api/auth/recovery/key/start", body),
  recoveryRedeem: (body: { handle: string; ticket: string; signature: string; password: string; identity_vault: IdentityVaultPayload }) =>
    http.post<Account>("/api/auth/recovery/key/redeem", body),
  putRecoveryKey: (currentPassword: string, vault: RecoveryVault, verifierPublicKey: string) =>
    http.put<Account>("/api/auth/recovery-key", {
      current_password: currentPassword,
      recovery_vault: vault,
      recovery_verifier_pubkey: verifierPublicKey,
    }),
  setDisplayName: (displayName: string | null) => http.patch<Account>("/api/auth/display-name", { display_name: displayName }),
  uploadAvatar: (image: Blob | Uint8Array, mediaType: string) =>
    request<Account>("/api/auth/avatar", { method: "PUT", bytes: image, headers: { [MEDIA_TYPE_HEADER]: mediaType } }),
  removeAvatar: () => http.delete("/api/auth/avatar"),
};

export const avatarUrl = (accountId: string): string => absoluteResource(`/api/accounts/${accountId}/avatar`);
