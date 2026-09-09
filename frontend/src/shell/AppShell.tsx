import { Show, Suspense, createEffect, createSignal, lazy, onCleanup, type JSX } from "solid-js";
import { useLocation, useNavigate, useParams } from "@solidjs/router";
import { api, type Account, type Channel, type Server } from "../api/client";
import type { WsEnvelope } from "../api/ws";
import type { Identity } from "../crypto/identity";
import MembersPanel from "../components/MembersPanel";
import {
  readMembersPanelOpen,
  readStageMode,
  writeChannelsListExpanded,
  writeMembersPanelOpen,
  writeStageMode,
} from "../preferences/uiPrefs";
import {
  channelHref,
  resolveChannelForServer,
} from "../preferences/lastChannelByServer";
import { isSettingsPath } from "../lib/settingsAccess";
import { t } from "../i18n";
import { bootTheme } from "../theme/theme";
import ToastHost from "../components/ToastHost";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useVoiceSession } from "../voice/VoiceSession";

const FloatingVoicePip = lazy(() => import("./FloatingVoicePip"));

type Props = {
  me: Account;
  identity: Identity;
  onLogout: () => void;
  onAccountPatch?: (account: Account) => void;
  children: JSX.Element;
  onWs?: (handler: (msg: WsEnvelope) => void) => () => void;
  /** Optional external control of stage mode (voice chrome). */
  stageMode?: boolean;
  onStageModeChange?: (on: boolean) => void;
};

const NARROW = 900;

/** Server id implied by the current route (empty pane or ?server=). */
function serverIdFromRoute(
  params: { serverId?: string },
  search: string,
): string | null {
  const emptyId = params.serverId;
  if (typeof emptyId === "string" && emptyId.length > 0) return emptyId;
  const q = new URLSearchParams(search).get("server");
  return q && q.length > 0 ? q : null;
}

function broadcastMembersState(open: boolean) {
  window.dispatchEvent(new CustomEvent("mesa:members-panel-state", { detail: { open } }));
}

function broadcastChannelsListState(expanded: boolean) {
  window.dispatchEvent(
    new CustomEvent("mesa:stage-channels-state", { detail: { expanded } }),
  );
}

export default function AppShell(props: Props) {
  const params = useParams<{ id?: string; serverId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const voice = useVoiceSession();
  // Init from URL so remount on /servers/:id or /channels/:id?server= keeps rail in sync (041 US4).
  const [selectedServerId, setSelectedServerId] = createSignal<string | null>(
    serverIdFromRoute(params, location.search),
  );
  const [stageMode, setStageMode] = createSignal(readStageMode());
  /** 078: channels list always expanded (collapse deferred). */
  const [channelsListExpanded, setChannelsListExpanded] = createSignal(true);
  const [membersPanelOpen, setMembersPanelOpen] = createSignal(readMembersPanelOpen());
  const [focusMemberId, setFocusMemberId] = createSignal<string | null>(null);
  const [drawerOpen, setDrawerOpen] = createSignal(false);
  const [narrow, setNarrow] = createSignal(
    typeof window !== "undefined" ? window.innerWidth < NARROW : false,
  );
  let appRef: HTMLDivElement | undefined;

  createEffect(() => {
    bootTheme(appRef ?? null);
  });

  // Keep rail selection aligned with URL (channel ?server= or /servers/:id).
  createEffect(() => {
    const id = serverIdFromRoute(params, location.search);
    if (id) setSelectedServerId(id);
  });

  createEffect(() => {
    const on = props.stageMode;
    if (typeof on === "boolean") {
      // 081: ignore attempts to turn stage on
      setStage(false);
    }
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

  function setStage(_on: boolean) {
    // 081: never enable stage mode
    setStageMode(false);
    writeStageMode(false);
    props.onStageModeChange?.(false);
  }

  /** 078: collapse deferred — only force expanded; ignore collapse requests. */
  function setChannelsExpanded(expanded: boolean) {
    if (!expanded) {
      setChannelsListExpanded(true);
      writeChannelsListExpanded(true);
      broadcastChannelsListState(true);
      return;
    }
    setChannelsListExpanded(true);
    writeChannelsListExpanded(true);
    broadcastChannelsListState(true);
  }

  function setMembersOpen(open: boolean) {
    setMembersPanelOpen(open);
    writeMembersPanelOpen(open);
    broadcastMembersState(open);
  }

  function toggleMenu() {
    if (stageMode()) {
      window.dispatchEvent(new CustomEvent("mesa:stage-mode", { detail: { stage: false } }));
    }
    setDrawerOpen((o) => !o);
  }

  createEffect(() => {
    const handler = (_e: Event) => {
      // 081: stage mode retired — force off on any request/toggle
      setStage(false);
    };
    window.addEventListener("mesa:stage-mode", handler);
    onCleanup(() => window.removeEventListener("mesa:stage-mode", handler));
  });

  createEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ expanded?: boolean; toggle?: boolean }>).detail;
      if (detail?.toggle) setChannelsExpanded(!channelsListExpanded());
      else if (typeof detail?.expanded === "boolean") setChannelsExpanded(detail.expanded);
    };
    window.addEventListener("mesa:stage-channels", handler);
    onCleanup(() => window.removeEventListener("mesa:stage-channels", handler));
  });

  createEffect(() => {
    const handler = (e: Event) => {
      const detail = (
        e as CustomEvent<{ open?: boolean; toggle?: boolean; focusAccountId?: string }>
      ).detail;
      if (typeof detail?.focusAccountId === "string" && detail.focusAccountId.length > 0) {
        setFocusMemberId(detail.focusAccountId);
      }
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
    broadcastChannelsListState(channelsListExpanded());
  });

  const shellClass = () => {
    const parts = ["shell"];
    if (stageMode()) parts.push("stage-mode");
    // 078: never apply channels-collapsed
    if (membersPanelOpen()) parts.push("members-open");
    if (narrow() && drawerOpen() && !stageMode()) parts.push("drawer-open");
    return parts.join(" ");
  };

  const showVoicePip = () => {
    if (!voice.live() || !voice.channelId()) return false;
    return params.id !== voice.channelId();
  };

  const settingsMode = () => isSettingsPath(location.pathname);

  async function exitSettings() {
    const sid = selectedServerId() ?? params.serverId;
    if (!sid) {
      navigate("/");
      return;
    }
    try {
      const list = await api<Channel[]>(`/api/servers/${sid}/channels`);
      const target = resolveChannelForServer(sid, list);
      if (target) {
        navigate(channelHref(target, sid));
        return;
      }
    } catch {
      /* fall through */
    }
    navigate(`/servers/${sid}`);
  }

  return (
    <div class="app" ref={(el) => (appRef = el)}>
      <TopBar
        me={props.me}
        identity={props.identity}
        showMenuToggle={narrow()}
        onMenuToggle={toggleMenu}
        onWs={props.onWs}
        settingsMode={settingsMode()}
        onExitSettings={() => void exitSettings()}
      />
      <ToastHost />
      <div class={shellClass()}>
        <button
          type="button"
          class="shell-backdrop"
          aria-label={t("shell.closeMenu")}
          onClick={() => setDrawerOpen(false)}
        />
        <Sidebar
          me={props.me}
          identity={props.identity}
          selectedServerId={selectedServerId()}
          onSelectServer={(s: Server | null) => setSelectedServerId(s?.id ?? null)}
          onWs={props.onWs}
          channelsListExpanded={true}
          onToggleChannels={() => setChannelsExpanded(true)}
          onExpandChannels={() => setChannelsExpanded(true)}
          onLogout={props.onLogout}
          onAccountPatch={props.onAccountPatch}
          settingsMode={settingsMode()}
        />
        <div class="shell-main">
          {props.children}
          <Show when={showVoicePip()}>
            <Suspense fallback={null}>
              <FloatingVoicePip />
            </Suspense>
          </Show>
        </div>
        <Show when={membersPanelOpen() && !settingsMode()}>
          <MembersPanel
            serverId={selectedServerId()}
            channelId={typeof params.id === "string" && params.id.length > 0 ? params.id : null}
            meId={props.me.id}
            onWs={props.onWs}
            focusAccountId={focusMemberId()}
            onFocusConsumed={() => setFocusMemberId(null)}
          />
        </Show>
      </div>
    </div>
  );
}

export function requestStageMode(_stage: boolean) {
  // 081: always request off
  window.dispatchEvent(new CustomEvent("mesa:stage-mode", { detail: { stage: false } }));
}

export function toggleStageMode() {
  // 081: no-op product behavior — keep off
  window.dispatchEvent(new CustomEvent("mesa:stage-mode", { detail: { stage: false } }));
}

export function requestMembersPanel(open: boolean) {
  window.dispatchEvent(new CustomEvent("mesa:members-panel", { detail: { open } }));
}

export function openMembersPanel(opts?: { accountId?: string }) {
  window.dispatchEvent(
    new CustomEvent("mesa:members-panel", {
      detail: {
        open: true,
        focusAccountId: opts?.accountId,
      },
    }),
  );
}

export function toggleMembersPanel() {
  window.dispatchEvent(new CustomEvent("mesa:members-panel", { detail: { toggle: true } }));
}

export function toggleStageChannels() {
  window.dispatchEvent(new CustomEvent("mesa:stage-channels", { detail: { toggle: true } }));
}
