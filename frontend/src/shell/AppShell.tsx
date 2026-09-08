import { Show, Suspense, createEffect, createSignal, lazy, onCleanup, type JSX } from "solid-js";
import { useLocation, useNavigate, useParams } from "@solidjs/router";
import { api, type Account, type Channel, type Server } from "../api/client";
import type { WsEnvelope } from "../api/ws";
import type { Identity } from "../crypto/identity";
import MembersPanel from "../components/MembersPanel";
import {
  readChannelsListExpanded,
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
  const [channelsListExpanded, setChannelsListExpanded] = createSignal(
    readChannelsListExpanded(),
  );
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
      // Same effect as «Ocultar canais»: peek behind Server Rail
      setChannelsExpanded(false);
    }
  }

  function setChannelsExpanded(expanded: boolean) {
    setChannelsListExpanded(expanded);
    writeChannelsListExpanded(expanded);
    broadcastChannelsListState(expanded);
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
    if (!channelsListExpanded()) parts.push("channels-collapsed");
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
          aria-label="Fechar menu"
          onClick={() => setDrawerOpen(false)}
        />
        <Sidebar
          me={props.me}
          identity={props.identity}
          selectedServerId={selectedServerId()}
          onSelectServer={(s: Server | null) => setSelectedServerId(s?.id ?? null)}
          onWs={props.onWs}
          channelsListExpanded={channelsListExpanded()}
          onToggleChannels={() => setChannelsExpanded(!channelsListExpanded())}
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

export function requestStageMode(stage: boolean) {
  window.dispatchEvent(new CustomEvent("mesa:stage-mode", { detail: { stage } }));
}

export function toggleStageMode() {
  window.dispatchEvent(new CustomEvent("mesa:stage-mode", { detail: { toggle: true } }));
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
