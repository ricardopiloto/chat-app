/**
 * Server role / capability gates for UI decisions.
 * Migrated surfaces: see specs/053-frontend-build-optimize/inventory.md C3.
 */
import type { Channel, RoleCapabilities, Server, ServerRole } from "../api/client";

/** Matches backend `NO_ROLE_POSITION`. */
const NO_ROLE_POSITION = -1;

export function roleGrants(
  role: ServerRole,
  key: keyof RoleCapabilities | "can_create_channels",
): boolean {
  if (key === "can_create_channels") {
    return !!(role.can_create_channels || role.capabilities?.can_manage_channels);
  }
  return !!role.capabilities?.[key];
}

export function memberHasCapability(
  roles: ServerRole[] | undefined | null,
  accountId: string,
  key: keyof RoleCapabilities | "can_create_channels",
): boolean {
  return (roles ?? []).some(
    (role) => role.member_ids.includes(accountId) && roleGrants(role, key),
  );
}

export function memberRolePosition(
  roles: ServerRole[] | undefined | null,
  accountId: string,
): number {
  const role = (roles ?? []).find((r) => r.member_ids.includes(accountId));
  return role?.position ?? NO_ROLE_POSITION;
}

/**
 * Unified channel manage gate (ACL / rename / delete UI):
 * owner ∪ creator ∪ (can_manage_channels ∧ actor_pos > creator_pos).
 */
export function canManageChannel(
  meId: string,
  server: Pick<Server, "owner_account_id"> | null | undefined,
  channel: Pick<Channel, "created_by_account_id">,
  roles: ServerRole[] | undefined | null,
): boolean {
  if (!server) return false;
  if (server.owner_account_id === meId) return true;
  if (channel.created_by_account_id === meId) return true;
  if (!memberHasCapability(roles, meId, "can_manage_channels")) return false;
  const actorPos = memberRolePosition(roles, meId);
  const creatorPos = memberRolePosition(roles, channel.created_by_account_id);
  return actorPos > creatorPos;
}
