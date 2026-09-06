import { For, Show, createSignal, onCleanup, onMount } from "solid-js";
import type { Account } from "../api/client";
import type { WsEnvelope } from "../api/ws";
import type { Identity } from "../crypto/identity";
import IconBell from "../components/icons/IconBell";
import IconMenu from "../components/icons/IconMenu";
import IconMoon from "../components/icons/IconMoon";
import IconSearch from "../components/icons/IconSearch";
import IconSun from "../components/icons/IconSun";
import SearchPanel from "../components/SearchPanel";
import { getActiveTextChannelName } from "../preferences/activeChannel";
import { hasAnyUnseen, unseenChannelIds } from "../preferences/notifications";
import { applyTheme, resolveTheme, writeTheme, type Theme } from "../theme/theme";
import { instanceLabel } from "./instanceLabel";
import { A } from "@solidjs/router";

type Props = {
  me: Account;
  identity: Identity;
  onMenuToggle?: () => void;
  showMenuToggle?: boolean;
  onWs?: (handler: (msg: WsEnvelope) => void) => () => void;
};

export default function TopBar(props: Props) {
  const [searchExpanded, setSearchExpanded] = createSignal(false);
  const [searchSeed, setSearchSeed] = createSignal<string | null>(null);
  const [searchSeedNonce, setSearchSeedNonce] = createSignal(0);
  const [notifOpen, setNotifOpen] = createSignal(false);
  const [theme, setTheme] = createSignal<Theme>(resolveTheme());

  function openSearch(seed: string | null) {
    setSearchSeed(seed);
    setSearchSeedNonce((n) => n + 1);
    setSearchExpanded(true);
  }

  function onFindShortcut(e: KeyboardEvent) {
    if (!(e.ctrlKey || e.metaKey)) return;
    if (e.key !== "f" && e.key !== "F") return;
    e.preventDefault();
    e.stopPropagation();
    const name = getActiveTextChannelName();
    openSearch(name ? `#${name} ` : null);
  }

  onMount(() => {
    window.addEventListener("keydown", onFindShortcut, true);
  });
  onCleanup(() => {
    window.removeEventListener("keydown", onFindShortcut, true);
  });

  function toggleTheme() {
    const next: Theme = theme() === "dark" ? "light" : "dark";
    writeTheme(next);
    applyTheme(next);
    setTheme(next);
  }

  return (
    <header class="topbar">
      <Show when={props.showMenuToggle}>
        <button
          type="button"
          class="menu-toggle"
          onClick={() => props.onMenuToggle?.()}
          aria-label="Canais"
        >
          <IconMenu title="Canais" size={20} />
        </button>
      </Show>
      <div class="topbar-brand">
        <span class="topbar-mark" aria-hidden="true" />
        <span class="topbar-name">Mesa</span>
      </div>
      <span class="topbar-instance">{instanceLabel()}</span>
      <div class="topbar-actions">
        <Show
          when={searchExpanded()}
          fallback={
            <button
              type="button"
              class="topbar-icon-btn"
              aria-label="Pesquisar"
              onClick={() => openSearch(null)}
            >
              <IconSearch title="Pesquisar" size={20} />
            </button>
          }
        >
          <SearchPanel
            expanded={true}
            onCollapse={() => {
              setSearchExpanded(false);
              setSearchSeed(null);
            }}
            identity={props.identity}
            meId={props.me.id}
            seedQuery={searchSeed()}
            seedNonce={searchSeedNonce()}
          />
        </Show>
        <div class="topbar-notif">
          <button
            type="button"
            class="topbar-icon-btn"
            aria-label="Notificações"
            aria-expanded={notifOpen()}
            onClick={() => setNotifOpen((v) => !v)}
          >
            <IconBell title="Notificações" size={20} />
            <Show when={hasAnyUnseen()}>
              <span class="topbar-notif-dot" aria-hidden="true" />
            </Show>
          </button>
          <Show when={notifOpen()}>
            <div class="topbar-notif-panel" role="menu">
              <Show
                when={hasAnyUnseen()}
                fallback={<p class="muted">Sem atividade nova nesta sessão.</p>}
              >
                <p class="muted" style={{ "margin-bottom": "8px" }}>
                  Canais com mensagens novas:
                </p>
                <ul class="topbar-notif-list">
                  <For each={unseenChannelIds()}>
                    {(id) => (
                      <li>
                        <A
                          href={`/channels/${id}`}
                          onClick={() => setNotifOpen(false)}
                        >
                          Canal {id.slice(0, 8)}…
                        </A>
                      </li>
                    )}
                  </For>
                </ul>
              </Show>
            </div>
          </Show>
        </div>
        <button
          type="button"
          class="topbar-icon-btn"
          aria-label={theme() === "dark" ? "Tema escuro" : "Tema claro"}
          title={theme() === "dark" ? "Tema escuro" : "Tema claro"}
          onClick={toggleTheme}
        >
          <Show when={theme() === "dark"} fallback={<IconSun title="Tema claro" size={20} />}>
            <IconMoon title="Tema escuro" size={20} />
          </Show>
        </button>
      </div>
    </header>
  );
}
