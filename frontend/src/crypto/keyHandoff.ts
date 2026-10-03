// Distribution of a server's key: each member holds an envelope with the key sealed to their own
// public key. The owner creates the first key and seals it for everyone; any member who holds the
// key can answer a newcomer's request over the realtime channel.
import { api, type Server, type ServerMember } from "../api/client";
import type { WsEnvelope } from "../api/ws";
import { b64, fromB64, seal, unseal, type Identity } from "./identity";
import { generateServerKey, getServerKey, rememberServerKey } from "./serverKey";

const envelopesPath = (serverId: string) => `/api/servers/${serverId}/key-envelopes`;

/** Stores `key` sealed to `recipientPublicKey` as the envelope of `accountId`. */
function sendEnvelope(serverId: string, accountId: string, recipientPublicKey: Uint8Array, key: Uint8Array) {
  const body = { account_id: accountId, sealed_key: b64(seal(key, recipientPublicKey)) };
  return api(envelopesPath(serverId), { method: "POST", body: JSON.stringify(body) });
}

/** The creator's own envelope; also keeps the key in memory for the current session. */
export async function publishOwnEnvelope(serverId: string, accountId: string, identity: Identity, serverKey: Uint8Array) {
  await sendEnvelope(serverId, accountId, identity.publicKey, serverKey);
  rememberServerKey(serverId, serverKey);
}

/** Memory first, then the envelope stored for this account; undefined when neither yields a key. */
export async function loadServerKey(serverId: string, identity: Identity): Promise<Uint8Array | undefined> {
  const known = getServerKey(serverId);
  if (known) return known;
  let opened: Uint8Array | null = null;
  try {
    const mine = await api<{ sealed_key: string }>(`${envelopesPath(serverId)}/me`);
    opened = unseal(fromB64(mine.sealed_key), identity.publicKey, identity.secretKey);
  } catch {
    return undefined;
  }
  if (!opened) return undefined;
  rememberServerKey(serverId, opened);
  return opened;
}

/** Returns the key, creating and distributing it when this account owns a server that has none. */
export async function ensureServerKey(serverId: string, identity: Identity, accountId: string): Promise<Uint8Array | undefined> {
  const loaded = await loadServerKey(serverId, identity);
  if (loaded) return loaded;

  const owned = (await api<Server[]>("/api/servers")).some((s) => s.id === serverId && s.owner_account_id === accountId);
  if (!owned) return undefined;

  const fresh = generateServerKey();
  await publishOwnEnvelope(serverId, accountId, identity, fresh);
  const others = (await api<ServerMember[]>(`/api/servers/${serverId}/members`)).filter((m) => m.account_id !== accountId);
  await Promise.all(others.map((m) => sendEnvelope(serverId, m.account_id, fromB64(m.identity_pubkey), fresh)));
  return fresh;
}

/** Warms the key cache for every server of the account; a failure on one server does not stop the rest. */
export async function loadAllServerKeys(identity: Identity, accountId: string): Promise<void> {
  const mine = await api<Server[]>("/api/servers");
  const attempts = mine.map(({ id }) => ensureServerKey(id, identity, accountId));
  await Promise.allSettled(attempts);
}

/** Reacts to key_handoff events: answer a request when we hold the key, refresh when it is for us. */
export async function handleHandoffEvent(event: WsEnvelope, identity: Identity, myId: string) {
  const { server_id: serverId, payload } = event;
  if (!serverId) return;
  const subject = String(payload.account_id);

  switch (event.event) {
    case "key_handoff.requested": {
      const held = await loadServerKey(serverId, identity);
      if (held) await sendEnvelope(serverId, subject, fromB64(String(payload.identity_pubkey)), held);
      return;
    }
    case "key_handoff.completed":
      if (subject === myId) await loadServerKey(serverId, identity);
  }
}
