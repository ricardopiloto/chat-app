import type {
  Channel,
  RoleCapabilities,
  Server,
  ServerRole,
} from "../api/client";

const NO_ROLE_POSITION = -1;

export function roleGrants(
  role: ServerRole,
  key: keyof RoleCapabilities,
): boolean {
  return !!role.capabilities?.[key];
}

export function memberHasCapability(
  roles: ServerRole[] | undefined | null,
  accountId: string,
  key: keyof RoleCapabilities,
): boolean {
  return (roles ?? []).some(
    (role) => role.member_ids.includes(accountId) && roleGrants(role, key),
  );
}

export function memberRolePosition(
  roles: ServerRole[] | undefined | null,
  accountId: string,
): number {
  return (
    (roles ?? []).find((r) => r.member_ids.includes(accountId))?.position ??
    NO_ROLE_POSITION
  );
}

export function isOwner(
  server: Pick<Server, "owner_account_id"> | null | undefined,
  meId: string,
): boolean {
  return !!server && server.owner_account_id === meId;
}

/** Owner, creator, or (can_manage_channels and a higher role than the creator). */
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
  return (
    memberRolePosition(roles, meId) >
    memberRolePosition(roles, channel.created_by_account_id)
  );
}
