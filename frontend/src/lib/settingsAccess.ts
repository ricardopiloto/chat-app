/**
 * Server settings nav visibility (056-server-settings-shell).
 */
import type { ServerRole } from "../api/client";
import { memberHasCapability } from "./capabilities";

export type SettingsItemId = "members" | "roles" | "image" | "delete";

export type SettingsNavItem = {
  id: SettingsItemId;
  label: string;
  href: string;
};

export type SettingsNavGroup = {
  id: string;
  label: string;
  items: SettingsNavItem[];
};

export function isSettingsPath(pathname: string): boolean {
  return /\/servers\/[^/]+\/settings(\/|$)/.test(pathname);
}

export function settingsServerIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/servers\/([^/]+)\/settings/);
  return m?.[1] ?? null;
}

export function canAccessPeopleSettings(
  isOwner: boolean,
  roles: ServerRole[] | undefined | null,
  accountId: string,
): boolean {
  return isOwner || memberHasCapability(roles, accountId, "can_manage_roles");
}

/** Build filtered grouped nav for a server. */
export function buildSettingsNav(
  serverId: string,
  isOwner: boolean,
  roles: ServerRole[] | undefined | null,
  accountId: string,
): SettingsNavGroup[] {
  const people = canAccessPeopleSettings(isOwner, roles, accountId);
  const groups: SettingsNavGroup[] = [];

  if (people) {
    groups.push({
      id: "people",
      label: "Pessoas",
      items: [
        {
          id: "members",
          label: "Membros",
          href: `/servers/${serverId}/settings/members`,
        },
      ],
    });
    groups.push({
      id: "roles",
      label: "Funções",
      items: [
        {
          id: "roles",
          label: "Perfis",
          href: `/servers/${serverId}/settings/roles`,
        },
      ],
    });
  }

  if (isOwner) {
    groups.push({
      id: "server",
      label: "Servidor",
      items: [
        {
          id: "image",
          label: "Imagem do servidor",
          href: `/servers/${serverId}/settings/image`,
        },
        {
          id: "delete",
          label: "Apagar servidor",
          href: `/servers/${serverId}/settings/delete`,
        },
      ],
    });
  }

  return groups;
}

export function hasAnySettingsAccess(
  isOwner: boolean,
  roles: ServerRole[] | undefined | null,
  accountId: string,
): boolean {
  return buildSettingsNav("x", isOwner, roles, accountId).some((g) => g.items.length > 0);
}
