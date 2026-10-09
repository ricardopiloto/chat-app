import { For, Show } from "solid-js";
import { Icon, Logo } from "../components/ui";
import { servers as serversApi, useAuthedSrc } from "../api";
import { t } from "../i18n";
import { useShell } from "./state";

// One square per server: image or initials, a bar on the left for the active one, and a dot for
// unread content or a live call. Opening the creation dialog is the admin phase's job; the "+"
// only announces the intent.
export function ServerRail() {
  const shell = useShell();
  const base = "relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg font-display text-headline-sm transition-all duration-150";
  return (
    <nav class="flex w-[72px] shrink-0 flex-col items-center gap-3 overflow-y-auto bg-surface-container-lowest py-3" aria-label={t("shell.servers")}>
      <button type="button" title={t("shell.home")} aria-label={t("shell.home")} onClick={() => shell.go("/")} class={`${base} bg-surface-container text-primary hover:rounded-md`}>
        <Logo size={30} />
      </button>
      <span class="h-px w-8 bg-outline-variant" aria-hidden="true" />
      <For each={shell.servers.data ?? []}>
        {(server) => {
          const mark = useAuthedSrc(() => (server.has_image ? serversApi.imageUrl(server.id) : undefined));
          const active = () => shell.serverId() === server.id;
          const inCall = () => Object.values(shell.voiceState()[server.id] ?? {}).some(Boolean);
          const unread = () => shell.unreadServers().includes(server.id) || server.has_unread;
          return (
            <div class="relative">
              <span class="absolute -left-3 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-all" classList={{ "h-8": active(), "h-2": !active() && unread(), "h-0": !active() && !unread() }} aria-hidden="true" />
              <button
                type="button"
                title={server.name}
                aria-label={server.name}
                aria-current={active() ? "true" : undefined}
                onClick={() => shell.go(`/servers/${server.id}`)}
                class={`${base} hover:rounded-md`}
                classList={{ "bg-primary-container text-on-primary-container": active(), "bg-surface-container-high text-on-surface hover:bg-surface-container-highest": !active() }}
              >
                <Show when={mark()} fallback={server.name.slice(0, 2).toUpperCase()}>
                  <img src={mark()} alt="" class="h-full w-full object-cover" />
                </Show>
              </button>
              <Show when={unread()}>
                <span class="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-surface-container-lowest bg-primary" title={t("shell.unread")} />
              </Show>
              <Show when={inCall()}>
                <span class="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border-2 border-surface-container-lowest bg-secondary text-on-secondary" title={t("shell.liveCall")}>
                  <Icon name="volume_up" class="text-[10px]" filled />
                </span>
              </Show>
            </div>
          );
        }}
      </For>
      <button type="button" title={t("shell.createServer")} aria-label={t("shell.createServer")} onClick={() => document.dispatchEvent(new Event("mesa:create-server"))} class={`${base} border border-dashed border-outline-variant bg-transparent text-secondary hover:border-secondary hover:bg-surface-container`}>
        <Icon name="add" class="text-[26px]" />
      </button>
    </nav>
  );
}
