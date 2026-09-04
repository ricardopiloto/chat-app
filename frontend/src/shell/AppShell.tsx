import { Show, createEffect, createSignal, onCleanup, type JSX } from "solid-js";
import type { Account, Server } from "../api/client";
import type { WsEnvelope } from "../api/ws";
import type { Identity } from "../crypto/identity";
import MembersPanel from "../components/MembersPanel";
import {
  readMembersPanelOpen,
  readStageChannelsExpanded,
  readStageMode,
  writeMembersPanelOpen,
  writeStageChannelsExpanded,
  writeStageMode,
} from "../preferences/uiPrefs";
import { bootTheme } from "../theme/theme";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

type Props = {
  me: Account;
  identity: Identity;
  onLogout: () => void;
  children: JSX.Element;
  onWs?: (handler: (msg: WsEnvelope) => void) => () => void;
  /** Optional external control of stage mode (voice chrome). */
  stageMode?: boolean;
  onStageModeChange?: (on: boolean) => void;
};

const NARROW = 900;

function broadcastMembersState(open: boolean) {
  window.dispatchEvent(new CustomEvent("mesa:members-panel-state", { detail: { open } }));
}

function broadcastStageChannelsState(expanded: boolean) {
  window.dispatchEvent(
    new CustomEvent("mesa:stage-channels-state", { detail: { expanded } }),
  );
}

export default function AppShell(props: Props) {
  const [selectedServerId, setSelectedServerId] = createSignal<string | null>(null);
  const [stageMode, setStageMode] = createSignal(readStageMode());
  const [stageChannelsExpanded, setStageChannelsExpanded] = createSignal(
    readStageChannelsExpanded(),
  );
  const [membersPanelOpen, setMembersPanelOpen] = createSignal(readMembersPanelOpen());
  const [drawerOpen, setDrawerOpen] = createSignal(false);
  const [narrow, setNarrow] = createSignal(
    typeof window !== "undefined" ? window.innerWidth < NARROW : false,
  );
  let appRef: HTMLDivElement | undefined;

  createEffect(() => {
    bootTheme(appRef ?? null);
  });

  createEffect(() => {
    const on = props.stageMode;
    if (typeof on === "boolean") setStageMode(on);
  });

  createEffect(() => {
    const onResize = () => {
      const isNarrow = window.innerWidth < NARROW;
      setNarrow(isNarrow);
      if (!isNarrow) setDrawerOpen(false);
    };
    window.addEventListener("resize", onResize);
    onCleanup(() => window.removeEventListener("resize", onResize));
  });

  function setStage(on: boolean) {
    setStageMode(on);
    writeStageMode(on);
    props.onStageModeChange?.(on);
    if (on) {
      setDrawerOpen(false);
      // Entering stage defaults to collapsed channel strip unless already expanded in prefs
    } else {
      // Leaving stage — chrome fully restored; keep expand preference for next stage entry
    }
  }

  function setStageChannels(expanded: boolean) {
    setStageChannelsExpanded(expanded);
    writeStageChannelsExpanded(expanded);
    broadcastStageChannelsState(expanded);
  }

  function setMembersOpen(open: boolean) {
    setMembersPanelOpen(open);
    writeMembersPanelOpen(open);
    broadcastMembersState(open);
  }

  function toggleMenu() {
    if (stageMode()) setStage(false);
    setDrawerOpen((o) => !o);
  }

  createEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ stage?: boolean; toggle?: boolean }>).detail;
      if (detail?.toggle) setStage(!stageMode());
      else if (typeof detail?.stage === "boolean") setStage(detail.stage);
    };
    window.addEventListener("mesa:stage-mode", handler);
    onCleanup(() => window.removeEventListener("mesa:stage-mode", handler));
  });

  createEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ expanded?: boolean; toggle?: boolean }>).detail;
      if (detail?.toggle) setStageChannels(!stageChannelsExpanded());
      else if (typeof detail?.expanded === "boolean") setStageChannels(detail.expanded);
    };
    window.addEventListener("mesa:stage-channels", handler);
    onCleanup(() => window.removeEventListener("mesa:stage-channels", handler));
  });

  createEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ open?: boolean; toggle?: boolean }>).detail;
      if (detail?.toggle) setMembersOpen(!membersPanelOpen());
      else if (typeof detail?.open === "boolean") setMembersOpen(detail.open);
    };
    window.addEventListener("mesa:members-panel", handler);
    onCleanup(() => window.removeEventListener("mesa:members-panel", handler));
  });

  createEffect(() => {
    const handler = () => setDrawerOpen(false);
    window.addEventListener("mesa:close-drawer", handler);
    onCleanup(() => window.removeEventListener("mesa:close-drawer", handler));
  });

  // Sync listeners on mount / when state changes from shell itself
  createEffect(() => {
    broadcastMembersState(membersPanelOpen());
  });
  createEffect(() => {
    broadcastStageChannelsState(stageChannelsExpanded());
  });

  const shellClass = () => {
    const parts = ["shell"];
    if (stageMode()) {
      parts.push("stage-mode");
      if (stageChannelsExpanded()) parts.push("stage-channels-expanded");
    }
    if (membersPanelOpen()) parts.push("members-open");
    if (narrow() && drawerOpen() && !stageMode()) parts.push("drawer-open");
    return parts.join(" ");
  };

  return (
    <div class="app" data-theme="dark" ref={(el) => (appRef = el)}>
      <TopBar
        handle={props.me.handle}
        onLogout={props.onLogout}
        showMenuToggle={narrow()}
        onMenuToggle={toggleMenu}
      />
      <div class={shellClass()}>
        <button
          type="button"
          class="shell-backdrop"
          aria-label="Fechar menu"
          onClick={() => setDrawerOpen(false)}
        />
        <Sidebar
          me={props.me}
          identity={props.identity}
          selectedServerId={selectedServerId()}
          onSelectServer={(s: Server | null) => setSelectedServerId(s?.id ?? null)}
          onWs={props.onWs}
          stageMode={stageMode()}
          stageChannelsExpanded={stageChannelsExpanded()}
          onToggleStageChannels={() => setStageChannels(!stageChannelsExpanded())}
        />
        <div class="shell-main">{props.children}</div>
        <Show when={membersPanelOpen()}>
          <MembersPanel serverId={selectedServerId()} />
        </Show>
      </div>
    </div>
  );
}

export function requestStageMode(stage: boolean) {
  window.dispatchEvent(new CustomEvent("mesa:stage-mode", { detail: { stage } }));
}

export function toggleStageMode() {
  window.dispatchEvent(new CustomEvent("mesa:stage-mode", { detail: { toggle: true } }));
}

export function requestMembersPanel(open: boolean) {
  window.dispatchEvent(new CustomEvent("mesa:members-panel", { detail: { open } }));
}

export function toggleMembersPanel() {
  window.dispatchEvent(new CustomEvent("mesa:members-panel", { detail: { toggle: true } }));
}

export function toggleStageChannels() {
  window.dispatchEvent(new CustomEvent("mesa:stage-channels", { detail: { toggle: true } }));
}
