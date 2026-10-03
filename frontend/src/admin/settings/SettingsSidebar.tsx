import { For, Show } from "solid-js";
import { useShell } from "../../shell/state";
import { t } from "../../i18n";
import { Icon } from "../../components/ui";

type Entry = { id: string; label: string; icon: string; section: "overview" | "roles" | "members"; anchor?: string; ownerOnly?: boolean };

// Navigation of the settings area. It takes the place of the channel sidebar while settings are
// open; "Welcome" and "Delete server" are anchors inside the overview page.
export function SettingsSidebar() {
  const shell = useShell();
  const section = () => (shell.route().settings ?? "overview") as Entry["section"];

  const groups = (): { title: string; entries: Entry[] }[] => [
    {
      title: t("mgmt.settings.groupServer"),
      entries: [
        { id: "overview", label: t("mgmt.settings.overview"), icon: "tune", section: "overview", ownerOnly: true },
        { id: "welcome", label: t("mgmt.settings.welcome"), icon: "celebration", section: "overview", anchor: "mg-welcome", ownerOnly: true },
      ],
    },
    { title: t("mgmt.settings.groupRoles"), entries: [{ id: "roles", label: t("mgmt.settings.roles"), icon: "badge", section: "roles" }] },
    { title: t("mgmt.settings.groupPeople"), entries: [{ id: "members", label: t("mgmt.settings.members"), icon: "group", section: "members" }] },
    { title: t("mgmt.settings.groupDanger"), entries: [{ id: "danger", label: t("mgmt.settings.deleteServer"), icon: "delete_forever", section: "overview", anchor: "mg-danger", ownerOnly: true }] },
  ];

  const visible = (entry: Entry) => !entry.ownerOnly || shell.owner();
  const base = () => `/servers/${shell.serverId()}/settings`;

  function open(entry: Entry) {
    const jump = () => entry.anchor && document.getElementById(entry.anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (section() === entry.section) return jump();
    shell.go(entry.section === "overview" ? base() : `${base()}/${entry.section}`);
    window.setTimeout(jump, 60);
  }

  return (
    <nav class="mg-settings-nav" aria-label={t("mgmt.settings.title")}>
      <header>
        <Icon name="settings" />
        <h2>{t("mgmt.settings.title")}</h2>
        <button type="button" class="mg-icon-button" title={t("mgmt.settings.close")} aria-label={t("mgmt.settings.close")} onClick={() => void shell.leaveServerSettings(shell.serverId())}>
          <Icon name="close" />
        </button>
      </header>
      <p class="mg-nav-server">{shell.server()?.name}</p>
      <For each={groups()}>
        {(group) => (
          <Show when={group.entries.some(visible)}>
            <section>
              <h3>{group.title}</h3>
              <For each={group.entries.filter(visible)}>
                {(entry) => (
                  <button type="button" classList={{ active: !entry.anchor && section() === entry.section }} aria-current={!entry.anchor && section() === entry.section ? "page" : undefined} onClick={() => open(entry)}>
                    <Icon name={entry.icon} />
                    {entry.label}
                  </button>
                )}
              </For>
            </section>
          </Show>
        )}
      </For>
    </nav>
  );
}
