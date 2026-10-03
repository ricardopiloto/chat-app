// Permission checks for the people in a server, derived from the roles the server returned.
import type { Channel, RoleCapabilities, Server, ServerRole } from "../api";

type WithOwner = Pick<Server, "owner_account_id"> | null | undefined;
type WithCreator = Pick<Channel, "created_by_account_id">;

type Roles = readonly ServerRole[] | null | undefined;
type Capability = keyof RoleCapabilities;

export function isOwner(server: WithOwner, accountId: string): boolean {
  return server?.owner_account_id === accountId;
}

function rolesOf(roles: Roles, accountId: string): ServerRole[] {
  return (roles ?? []).filter((role) => role.member_ids.includes(accountId));
}

export function memberHasCapability(roles: Roles, accountId: string, capability: Capability): boolean {
  return rolesOf(roles, accountId).some((role) => role.capabilities?.[capability]);
}

// Someone with no role ranks below every role, so a role of any position outranks them.
const NO_RANK = -1;
function rank(roles: Roles, accountId: string): number {
  const [held] = rolesOf(roles, accountId);
  return held ? held.position : NO_RANK;
}

export function canManageChannel(meId: string, server: WithOwner, channel: WithCreator, roles: Roles): boolean {
  const creator = channel.created_by_account_id;
  if (!server) return false;
  if (isOwner(server, meId) || meId === creator) return true;
  return memberHasCapability(roles, meId, "can_manage_channels") && rank(roles, meId) > rank(roles, creator);
}
