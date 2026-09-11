import {
  Show,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  type JSX,
} from "solid-js";
import type { Account } from "../api/client";
import AccountMenu from "../components/AccountMenu";
import IdentityAvatar from "../components/IdentityAvatar";
import { IconCameraOffFilled, IconCameraOnFilled } from "../components/icons/IconCamera";
import { IconDeafenedFilled, IconDeafenOff } from "../components/icons/IconDeafen";
import { IconMicOffFilled, IconMicOnFilled } from "../components/icons/IconMic";
import { IconPhoneHangupFilled } from "../components/icons/IconPhoneHangup";
import {
  IconScreenShare,
  IconScreenShareFilled,
} from "../components/icons/IconScreenShare";
import IconSettings from "../components/icons/IconSettings";
import { t } from "../i18n";
import { readViewMode, subscribeViewMode, type ViewMode } from "../preferences/uiPrefs";
import { useVoiceSession } from "../voice/VoiceSession";

/** Panel call-control glyph size — mic is the visual base (042 FR-005). */
const PANEL_CALL_ICON = 18;

/** 084: convert CSS length (ch/px/rem) using the handle’s font for `ch`. */
function cssLengthToPx(raw: string, fontEl: Element): number {
  const v = raw.trim();
  if (!v) return 0;
  if (v.endsWith("ch")) {
    const n = parseFloat(v);
    if (!Number.isFinite(n)) return 0;
    const probe = document.createElement("span");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText =
      "position:absolute;visibility:hidden;pointer-events:none;white-space:nowrap;font:inherit;";
    probe.textContent = "0";
    fontEl.appendChild(probe);
    const ch = probe.offsetWidth || 8;
    probe.remove();
    return n * ch;
  }
  if (v.endsWith("rem")) {
    const n = parseFloat(v);
    const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return Number.isFinite(n) ? n * root : 0;
  }
  if (v.endsWith("px")) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

type Props = {
  me: Account;
  onLogout: () => void;
  onAccountPatch?: (account: Account) => void;
};

export default function UserPanel(props: Props): JSX.Element {
  const voice = useVoiceSession();
  const [accountOpen, setAccountOpen] = createSignal(false);
  const [viewMode, setViewMode] = createSignal<ViewMode>(readViewMode());
  const [stacked, setStacked] = createSignal(false);

  let panelEl: HTMLDivElement | undefined;
  let handleEl: HTMLSpanElement | undefined;
  let callsEl: HTMLDivElement | undefined;
  let settingsEl: HTMLButtonElement | undefined;
  let identityEl: HTMLDivElement | undefined;

  onMount(() => {
    const off = subscribeViewMode(setViewMode);
    onCleanup(off);
  });

  const listenOnly = () => voice.permission() === "listen";
  /** 080: leave whenever live. */
  const showLeave = () => voice.live();
  /** Mic/cam disabled only for listen-only while permission known. */
  const micDisabled = () => listenOnly();
  const camDisabled = () => listenOnly();
  const screenDisabled = () => listenOnly();
  const showScreenShare = () => voice.live() && viewMode() === "grid";

  function openAccount() {
    setAccountOpen(true);
  }

  /**
   * 084: stack when a single-row layout would leave the handle below
   * `--user-panel-name-min`; unstack with hysteresis via `--user-panel-name-unstack`.
   */
  function measureCallsIntrinsic(calls: HTMLElement): number {
    const style = getComputedStyle(calls);
    const gap = parseFloat(style.columnGap || style.gap) || 2;
    let w = 0;
    let n = 0;
    for (const child of calls.children) {
      if (!(child instanceof HTMLElement)) continue;
      if (getComputedStyle(child).display === "none") continue;
      w += child.offsetWidth;
      n += 1;
    }
    if (n > 1) w += gap * (n - 1);
    return w;
  }

  function measureStack() {
    const panel = panelEl;
    const handle = handleEl;
    const calls = callsEl;
    const settings = settingsEl;
    const identity = identityEl;
    if (!panel || !handle || !calls || !settings || !identity) return;

    const style = getComputedStyle(panel);
    const minPx = cssLengthToPx(style.getPropertyValue("--user-panel-name-min"), handle);
    const unstackPx = cssLengthToPx(
      style.getPropertyValue("--user-panel-name-unstack"),
      handle,
    );
    const floor = minPx > 0 ? minPx : 48;
    const ceiling = unstackPx > floor ? unstackPx : floor + 12;

    const panelW = panel.clientWidth;
    const padX =
      (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
    const gap = parseFloat(style.columnGap || style.gap) || 8;

    // Intrinsic calls width — ignore full-bleed width when stacked.
    const callsW = measureCallsIntrinsic(calls);
    const settingsW = settings.offsetWidth;
    const avatarWrap = identity.querySelector(".user-panel-avatar-wrap");
    const avatarW = avatarWrap instanceof HTMLElement ? avatarWrap.offsetWidth : 32;
    const userPad = 12; // .user-panel-user horizontal padding approx
    const gaps = gap * 2; // identity↔calls, calls↔settings (single-row)

    const availableForName =
      panelW - padX - avatarW - userPad - callsW - settingsW - gaps;

    if (!stacked()) {
      if (availableForName < floor) setStacked(true);
    } else if (availableForName >= ceiling) {
      setStacked(false);
    }
  }

  onMount(() => {
    const panel = panelEl;
    if (!panel || typeof ResizeObserver === "undefined") {
      measureStack();
      return;
    }
    const ro = new ResizeObserver(() => {
      measureStack();
    });
    ro.observe(panel);
    if (callsEl) ro.observe(callsEl);
    measureStack();
    onCleanup(() => ro.disconnect());
  });

  // Remeasure when control set or handle text changes.
  createEffect(() => {
    void props.me.handle;
    void showLeave();
    void showScreenShare();
    void voice.live();
    queueMicrotask(() => measureStack());
  });

  return (
    <div
      class="user-panel"
      classList={{ "user-panel--stacked": stacked() }}
      ref={(el) => {
        panelEl = el;
      }}
    >
      <div
        class="user-panel-identity account-menu-anchor"
        ref={(el) => {
          identityEl = el;
        }}
      >
        <button
          type="button"
          class="user-panel-user"
          onClick={openAccount}
          aria-expanded={accountOpen()}
          aria-haspopup="menu"
          aria-label={`${t("account.menu")}: ${props.me.handle}`}
        >
          <span class="user-panel-avatar-wrap">
            <IdentityAvatar
              class="user-panel-avatar"
              accountId={props.me.id}
              handle={props.me.handle}
              hasAvatar={!!props.me.has_avatar}
            />
            <span
              class="user-panel-online"
              title={t("common.online")}
              aria-label={t("common.online")}
            />
          </span>
          <span class="user-panel-text">
            <span
              class="user-panel-handle"
              ref={(el) => {
                handleEl = el;
              }}
            >
              {props.me.handle}
            </span>
            <span class="user-panel-status">{t("common.online")}</span>
          </span>
        </button>
        <AccountMenu
          open={accountOpen()}
          onClose={() => setAccountOpen(false)}
          me={props.me}
          onLogout={props.onLogout}
          onAccountPatch={props.onAccountPatch}
        />
      </div>

      <div
        class="user-panel-calls"
        role="group"
        aria-label={t("shell.callControls")}
        ref={(el) => {
          callsEl = el;
        }}
      >
        <Show when={showLeave()}>
          <button
            type="button"
            class="btn btn-danger call-ctrl call-ctrl-icon user-panel-ctrl user-panel-leave"
            aria-label={t("shell.leaveCall")}
            title={t("shell.leaveCall")}
            onClick={() => void voice.hangup()}
          >
            <IconPhoneHangupFilled size={PANEL_CALL_ICON} />
          </button>
        </Show>

        <button
          type="button"
          class="btn btn-secondary call-ctrl call-ctrl-icon user-panel-ctrl"
          classList={{
            "is-speaking":
              voice.live() &&
              voice.micOn() &&
              voice.speakingAccountIds().has(props.me.id),
          }}
          disabled={micDisabled()}
          aria-label={voice.micOn() ? t("shell.micOn") : t("shell.micOff")}
          title={
            listenOnly()
              ? t("shell.noSpeakPermission")
              : voice.micOn()
                ? t("shell.micOn")
                : t("shell.micOff")
          }
          onClick={() => void voice.toggleMic()}
        >
          <Show when={voice.micOn()} fallback={<IconMicOffFilled size={PANEL_CALL_ICON} />}>
            <IconMicOnFilled size={PANEL_CALL_ICON} />
          </Show>
        </button>

        <button
          type="button"
          class="btn btn-secondary call-ctrl call-ctrl-icon user-panel-ctrl"
          aria-label={voice.deafened() ? t("shell.callSoundOff") : t("shell.deafen")}
          title={voice.deafened() ? t("shell.undeafen") : t("shell.deafen")}
          onClick={() => void voice.toggleDeafen()}
        >
          <Show when={voice.deafened()} fallback={<IconDeafenOff size={PANEL_CALL_ICON} />}>
            <IconDeafenedFilled size={PANEL_CALL_ICON} />
          </Show>
        </button>

        <button
          type="button"
          class="btn btn-secondary call-ctrl call-ctrl-icon user-panel-ctrl"
          classList={{ "is-on": voice.camOn() }}
          disabled={camDisabled()}
          aria-pressed={voice.camOn()}
          aria-label={voice.camOn() ? t("shell.camOn") : t("shell.camOff")}
          title={
            listenOnly()
              ? t("shell.noVideoPermission")
              : voice.camOn()
                ? t("shell.camOn")
                : t("shell.camOff")
          }
          onClick={() => void voice.toggleCam()}
        >
          <Show when={voice.camOn()} fallback={<IconCameraOffFilled size={PANEL_CALL_ICON} />}>
            <IconCameraOnFilled size={PANEL_CALL_ICON} />
          </Show>
        </button>

        <Show when={showScreenShare()}>
          <button
            type="button"
            class="btn btn-secondary call-ctrl call-ctrl-icon user-panel-ctrl"
            classList={{ "is-on": voice.screenOn() }}
            disabled={screenDisabled()}
            aria-pressed={voice.screenOn()}
            aria-label={voice.screenOn() ? t("shell.screenShareOn") : t("shell.screenShareOff")}
            title={
              listenOnly()
                ? t("shell.noVideoPermission")
                : voice.screenOn()
                  ? t("shell.screenShareOn")
                  : t("shell.screenShareOff")
            }
            onClick={() => void voice.toggleScreenShare()}
          >
            <Show
              when={voice.screenOn()}
              fallback={<IconScreenShare size={PANEL_CALL_ICON} />}
            >
              <IconScreenShareFilled size={PANEL_CALL_ICON} />
            </Show>
          </button>
        </Show>
      </div>

      <button
        type="button"
        class="user-panel-settings"
        aria-label={t("shell.accountSettings")}
        title={t("shell.accountSettings")}
        onClick={openAccount}
        ref={(el) => {
          settingsEl = el;
        }}
      >
        <IconSettings size={18} title={t("shell.accountSettingsShort")} />
      </button>
    </div>
  );
}
