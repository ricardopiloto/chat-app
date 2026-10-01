import { Match, Switch, createEffect, onCleanup } from "solid-js";
import type { Server } from "../../api";
import { t } from "../../i18n";
import { useShell } from "../../shell/state";
import { Members } from "./Members";
import { Overview } from "./Overview";
import { Roles } from "./Roles";

// Main area of the settings. Overview (image, welcome, delete) is owner-only; roles and members
// follow the role capabilities. Escape leaves the settings.
export function SettingsPage(props: { server: Server }) {
  const shell = useShell();

  createEffect(() => {
    const leave = (event: KeyboardEvent) => event.key === "Escape" && !document.querySelector(".dialog") && shell.go(`/servers/${props.server.id}`);
    window.addEventListener("keydown", leave);
    onCleanup(() => window.removeEventListener("keydown", leave));
  });

  const section = () => shell.route().settings ?? "overview";
  return (
    <Switch>
      <Match when={section() === "overview" && shell.owner()}><Overview server={props.server} /></Match>
      <Match when={section() === "roles" && (shell.owner() || shell.can("can_manage_roles"))}><Roles server={props.server} /></Match>
      <Match when={section() === "members"}><Members server={props.server} /></Match>
      <Match when={true}><p class="mg-denied">{t("mgmt.settings.noAccess")}</p></Match>
    </Switch>
  );
}
