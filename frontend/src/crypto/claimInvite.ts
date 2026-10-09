// After an invite accept, open the seed from the fragment and publish this member's own envelope.
// A failed check or a failed publish leaves the membership pending; online handoff still applies.
import { channels, messages } from "../api";
import { publishOwnEnvelope } from "./keyHandoff.ts";
import { fromB64, type Identity } from "./identity.ts";
import { openInviteSeed } from "./inviteSeed.ts";
import { decryptMessage } from "./serverKey.ts";

async function openedKeyMatchesHistory(serverId: string, key: Uint8Array): Promise<boolean> {
  const listed = await channels.listForServer(serverId);
  for (const channel of listed) {
    if (channel.type !== "text") continue;
    const page = await messages.list(channel.id);
    const cipher = page.find((message) => message.content_ciphertext)?.content_ciphertext;
    if (!cipher) continue;
    await decryptMessage(key, cipher);
    return true;
  }
  return true;
}

export async function claimInviteKey(input: {
  serverId: string;
  accountId: string;
  identity: Identity;
  keySeed?: string;
  secret: Uint8Array | null;
}): Promise<boolean> {
  if (!input.keySeed || !input.secret) return false;
  try {
    const serverKey = openInviteSeed(fromB64(input.keySeed), input.secret);
    if (!serverKey) return false;
    if (!(await openedKeyMatchesHistory(input.serverId, serverKey))) return false;
    await publishOwnEnvelope(input.serverId, input.accountId, input.identity, serverKey);
    return true;
  } catch {
    return false;
  }
}
