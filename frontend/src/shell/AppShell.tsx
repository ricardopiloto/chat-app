import { Show, createEffect, onCleanup } from "solid-js";
import { t } from "../i18n";
import { useSession } from "../session/session";
import { CallProvider } from "../voice/callSession";
import { Content } from "./Content";
import { Hosts } from "./Hosts";
import { MembersPanel } from "./MembersPanel";
import { ServerRail } from "./ServerRail";
import { SettingsSidebar } from "../admin/settings/SettingsSidebar";
import { useSoundEffects } from "../sound/triggers";
import { Sidebar } from "./Sidebar";
import { createShellState, ShellProvider, useShell } from "./state";
import { Topbar } from "./Topbar";

// Layout: top bar over [navigation | main | members]. Navigation (rail + sidebar) sits beside the
// content from 768px up; below that it is a drawer over the content with a backdrop that closes it.
function Frame() {
  const shell = useShell();
  useSoundEffects();

  createEffect(() => {
    if (!shell.drawerOpen()) return;
    const escape = (event: KeyboardEvent) => event.key === "Escape" && shell.setDrawerOpen(false);
    window.addEventListener("keydown", escape);
    onCleanup(() => window.removeEventListener("keydown", escape));
  });

  return (
    <div class="app-shell flex h-dvh flex-col overflow-hidden bg-background text-on-surface">
      <Topbar />
      <Show when={shell.delivery() !== "connected"}>
        <p class="bg-surface-container-high px-4 py-1.5 text-center text-body-sm text-on-surface-variant" role="status">
          {t("shell.reconnecting")}
        </p>
      </Show>
      <div class="relative flex min-h-0 flex-1">
        <Show when={shell.drawerOpen()}>
          <button type="button" class="fixed inset-0 z-20 tablet:hidden" style={{ "background-color": "color-mix(in srgb, var(--background) 70%, transparent)" }} aria-label={t("shell.closeNavigation")} onClick={() => shell.setDrawerOpen(false)} />
        </Show>
        <div
          class="z-30 flex h-full shrink-0 transition-transform duration-200 mobile:fixed mobile:bottom-0 mobile:left-0 mobile:top-14"
          classList={{ "mobile:-translate-x-full": !shell.drawerOpen(), "mobile:shadow-floating": shell.drawerOpen() }}
          inert={shell.narrow() && !shell.drawerOpen()}
        >
          <ServerRail />
          <Show when={shell.route().page !== "account"}>
            <Show when={shell.route().settings && shell.server()} fallback={<Sidebar />}>
              <SettingsSidebar />
            </Show>
          </Show>
        </div>
        <Content />
        <Show when={shell.membersOpen()}>
          <MembersPanel />
        </Show>
      </div>
      <Hosts />
    </div>
  );
}

export function AppShell() {
  const session = useSession();
  const shell = createShellState({ account: () => session.account()!, identity: () => session.identity()! });
  return (
    <CallProvider subscribe={shell.subscribe}>
      <ShellProvider value={shell}>
        <Frame />
      </ShellProvider>
    </CallProvider>
  );
}
