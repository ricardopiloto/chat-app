import { api, type Server, type ServerMember } from "../api/client";
import type { WsEnvelope } from "../api/ws";
import { b64, fromB64, seal, unseal, type Identity } from "./identity";
import {
  generateServerKey,
  getServerKey,
  rememberServerKey,
} from "./serverKey";

/** Publishes the server key sealed for one account. */
async function postEnvelope(
  serverId: string,
  accountId: string,
  sealed: Uint8Array,
) {
  await api(`/api/servers/${serverId}/key-envelopes`, {
    method: "POST",
    body: JSON.stringify({ account_id: accountId, sealed_key: b64(sealed) }),
  });
}

/** Publishes the server key sealed for the creator, so messages can be decrypted later. */
export async function publishOwnEnvelope(
  serverId: string,
  accountId: string,
  identity: Identity,
  serverKey: Uint8Array,
) {
  await postEnvelope(serverId, accountId, seal(serverKey, identity.publicKey));
  rememberServerKey(serverId, serverKey);
}

export async function loadServerKey(
  serverId: string,
  identity: Identity,
): Promise<Uint8Array | undefined> {
  const cached = getServerKey(serverId);
  if (cached) return cached;
  try {
    const env = await api<{ sealed_key: string }>(
      `/api/servers/${serverId}/key-envelopes/me`,
    );
    const opened = unseal(
      fromB64(env.sealed_key),
      identity.publicKey,
      identity.secretKey,
    );
    if (opened) {
      rememberServerKey(serverId, opened);
      return opened;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

/** Loads the server key; the owner generates and distributes one when none exists yet. */
export async function ensureServerKey(
  serverId: string,
  identity: Identity,
  accountId: string,
): Promise<Uint8Array | undefined> {
  const existing = await loadServerKey(serverId, identity);
  if (existing) return existing;
  const servers = await api<Server[]>("/api/servers");
  const server = servers.find((s) => s.id === serverId);
  if (!server || server.owner_account_id !== accountId) return undefined;
  const key = generateServerKey();
  await publishOwnEnvelope(serverId, accountId, identity, key);
  const members = await api<ServerMember[]>(`/api/servers/${serverId}/members`);
  await Promise.all(
    members
      .filter((m) => m.account_id !== accountId)
      .map((m) =>
        postEnvelope(
          serverId,
          m.account_id,
          seal(key, fromB64(m.identity_pubkey)),
        ),
      ),
  );
  return key;
}

export async function loadAllServerKeys(
  identity: Identity,
  accountId: string,
): Promise<void> {
  const servers = await api<Server[]>("/api/servers");
  await Promise.all(
    servers.map((s) =>
      ensureServerKey(s.id, identity, accountId).catch(() => undefined),
    ),
  );
}

/** Answers other members' key requests and picks up a key handed to this account. */
export async function handleHandoffEvent(
  msg: WsEnvelope,
  identity: Identity,
  myId: string,
) {
  if (!msg.server_id) return;
  if (msg.event === "key_handoff.requested") {
    const key = await loadServerKey(msg.server_id, identity);
    if (!key) return;
    await postEnvelope(
      msg.server_id,
      String(msg.payload.account_id),
      seal(key, fromB64(String(msg.payload.identity_pubkey))),
    );
  }
  if (
    msg.event === "key_handoff.completed" &&
    String(msg.payload.account_id) === myId
  ) {
    await loadServerKey(msg.server_id, identity);
  }
}
