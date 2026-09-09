import { For, Show } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { t } from "../i18n";
import type { SettingsNavGroup, SettingsNavItem } from "../lib/settingsAccess";

type Props = {
  groups: SettingsNavGroup[];
};

function groupLabel(group: SettingsNavGroup): string {
  if (group.id === "people") return t("settings.people");
  if (group.id === "roles") return t("settings.rolesGroup");
  if (group.id === "server") return t("settings.serverGroup");
  return group.label;
}

function itemLabel(item: SettingsNavItem): string {
  if (item.id === "members") return t("settings.members");
  if (item.id === "roles") return t("settings.roles");
  if (item.id === "image") return t("settings.serverImage");
  if (item.id === "delete") return t("settings.deleteServer");
  return item.label;
}

export default function SettingsNav(props: Props) {
  const location = useLocation();

  function isActive(href: string): boolean {
    const path = location.pathname;
    if (path === href) return true;
    // Highlight Perfis when on nested permissions
    if (href.endsWith("/settings/roles") && path.includes("/settings/roles/")) return true;
    return false;
  }

  return (
    <nav class="settings-nav" aria-label={t("settings.navAria")}>
      <For each={props.groups}>
        {(group) => (
          <Show when={group.items.length > 0}>
            <div class="settings-nav-group">
              <div class="settings-nav-group-label">{groupLabel(group)}</div>
              <ul class="settings-nav-list">
                <For each={group.items}>
                  {(item) => (
                    <li>
                      <A
                        href={item.href}
                        class={`settings-nav-item${isActive(item.href) ? " active" : ""}${item.id === "delete" ? " danger" : ""}`}
                      >
                        {itemLabel(item)}
                      </A>
                    </li>
                  )}
                </For>
              </ul>
            </div>
          </Show>
        )}
      </For>
    </nav>
  );
}
