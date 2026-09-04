import { api } from "../api/client";
import type { WsEnvelope } from "../api/ws";
import { fromB64, seal, unseal, type Identity, b64 } from "./identity";
import { getServerKey, rememberServerKey } from "./serverKey";

export async function publishOwnEnvelope(
  serverId: string,
  accountId: string,
  identity: Identity,
  serverKey: Uint8Array,
) {
  const sealed = seal(serverKey, identity.publicKey);
  await api(`/api/servers/${serverId}/key-envelopes`, {
    method: "POST",
    body: JSON.stringify({
      account_id: accountId,
      sealed_key: b64(sealed),
    }),
  });
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
    const opened = unseal(fromB64(env.sealed_key), identity.publicKey, identity.secretKey);
    if (opened) {
      rememberServerKey(serverId, opened);
      return opened;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export async function loadAllServerKeys(identity: Identity): Promise<void> {
  const servers = await api<{ id: string }[]>("/api/servers");
  await Promise.all(servers.map((s) => loadServerKey(s.id, identity)));
}

export async function handleHandoffEvent(msg: WsEnvelope, identity: Identity, myId: string) {
  if (msg.event === "key_handoff.requested") {
    const key = await loadServerKey(msg.server_id, identity);
    if (!key) return;
    const accountId = String(msg.payload.account_id);
    const pk = fromB64(String(msg.payload.identity_pubkey));
    const sealed = seal(key, pk);
    await api(`/api/servers/${msg.server_id}/key-envelopes`, {
      method: "POST",
      body: JSON.stringify({ account_id: accountId, sealed_key: b64(sealed) }),
    });
  }
  if (msg.event === "key_handoff.completed") {
    if (String(msg.payload.account_id) !== myId) return;
    await loadServerKey(msg.server_id, identity);
  }
}
