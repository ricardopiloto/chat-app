import { api, type Server, type ServerMember } from "../api/client";
import type { WsEnvelope } from "../api/ws";
import { fromB64, seal, unseal, type Identity, b64 } from "./identity";
import { generateServerKey, getServerKey, rememberServerKey } from "./serverKey";

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
      .map((m) => {
        const sealed = seal(key, fromB64(m.identity_pubkey));
        return api(`/api/servers/${serverId}/key-envelopes`, {
          method: "POST",
          body: JSON.stringify({
            account_id: m.account_id,
            sealed_key: b64(sealed),
          }),
        });
      }),
  );
  return key;
}

export async function loadAllServerKeys(identity: Identity, accountId: string): Promise<void> {
  const servers = await api<Server[]>("/api/servers");
  await Promise.all(servers.map((s) => ensureServerKey(s.id, identity, accountId)));
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
