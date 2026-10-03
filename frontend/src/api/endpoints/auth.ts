import { MEDIA_TYPE_HEADER, http, request } from "../http";
import type { Account, IdentityVaultPayload, RegisterBody } from "../types";

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
  setDisplayName: (displayName: string | null) => http.patch<Account>("/api/auth/display-name", { display_name: displayName }),
  uploadAvatar: (image: Blob | Uint8Array, mediaType: string) =>
    request<Account>("/api/auth/avatar", { method: "PUT", bytes: image, headers: { [MEDIA_TYPE_HEADER]: mediaType } }),
  removeAvatar: () => http.delete("/api/auth/avatar"),
};

export const avatarUrl = (accountId: string): string => `/api/accounts/${accountId}/avatar`;
