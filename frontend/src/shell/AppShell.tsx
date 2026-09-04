import { createEffect, createSignal, onCleanup, type JSX } from "solid-js";
import type { Account, Server } from "../api/client";
import type { WsEnvelope } from "../api/ws";
import type { Identity } from "../crypto/identity";
import { readStageMode, writeStageMode } from "../preferences/uiPrefs";
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

export default function AppShell(props: Props) {
  const [selectedServerId, setSelectedServerId] = createSignal<string | null>(null);
  const [stageMode, setStageMode] = createSignal(readStageMode());
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
    if (on) setDrawerOpen(false);
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
    const handler = () => setDrawerOpen(false);
    window.addEventListener("mesa:close-drawer", handler);
    onCleanup(() => window.removeEventListener("mesa:close-drawer", handler));
  });

  const shellClass = () => {
    const parts = ["shell"];
    if (stageMode()) parts.push("stage-mode");
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
        />
        <div class="shell-main">{props.children}</div>
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
