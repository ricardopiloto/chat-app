import { For, Show } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import type { SettingsNavGroup } from "../lib/settingsAccess";

type Props = {
  groups: SettingsNavGroup[];
};

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
    <nav class="settings-nav" aria-label="Configurações do servidor">
      <For each={props.groups}>
        {(group) => (
          <Show when={group.items.length > 0}>
            <div class="settings-nav-group">
              <div class="settings-nav-group-label">{group.label}</div>
              <ul class="settings-nav-list">
                <For each={group.items}>
                  {(item) => (
                    <li>
                      <A
                        href={item.href}
                        class={`settings-nav-item${isActive(item.href) ? " active" : ""}${item.id === "delete" ? " danger" : ""}`}
                      >
                        {item.label}
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
