import { Show, createSignal, type JSX } from "solid-js";
import type { Account } from "../api/client";
import AccountMenu from "../components/AccountMenu";
import IdentityAvatar from "../components/IdentityAvatar";
import { IconCameraOffFilled, IconCameraOnFilled } from "../components/icons/IconCamera";
import { IconDeafenedFilled, IconDeafenOff } from "../components/icons/IconDeafen";
import { IconMicOffFilled, IconMicOnFilled } from "../components/icons/IconMic";
import { IconPhoneHangupFilled } from "../components/icons/IconPhoneHangup";
import IconSettings from "../components/icons/IconSettings";
import { t } from "../i18n";
import { useVoiceSession } from "../voice/VoiceSession";

/** Panel call-control glyph size — mic is the visual base (042 FR-005). */
const PANEL_CALL_ICON = 18;

type Props = {
  me: Account;
  onLogout: () => void;
  onAccountPatch?: (account: Account) => void;
};

export default function UserPanel(props: Props): JSX.Element {
  const voice = useVoiceSession();
  const [accountOpen, setAccountOpen] = createSignal(false);

  const listenOnly = () => voice.permission() === "listen";
  /** 080: leave whenever live. */
  const showLeave = () => voice.live();
  /** Mic/cam disabled only for listen-only while permission known. */
  const micDisabled = () => listenOnly();
  const camDisabled = () => listenOnly();

  function openAccount() {
    setAccountOpen(true);
  }

  return (
    <div class="user-panel">
      <div class="user-panel-identity account-menu-anchor">
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
            <span class="user-panel-handle">{props.me.handle}</span>
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

      <div class="user-panel-calls" role="group" aria-label={t("shell.callControls")}>
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

        <button
          type="button"
          class="user-panel-settings"
          aria-label={t("shell.accountSettings")}
          title={t("shell.accountSettings")}
          onClick={openAccount}
        >
          <IconSettings size={18} title={t("shell.accountSettingsShort")} />
        </button>
      </div>
    </div>
  );
}
