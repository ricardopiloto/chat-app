import { Show, createSignal, type JSX } from "solid-js";
import { useParams } from "@solidjs/router";
import type { Account } from "../api/client";
import AccountMenu from "../components/AccountMenu";
import CameraBlurMenu from "../components/CameraBlurMenu";
import IdentityAvatar from "../components/IdentityAvatar";
import { IconCameraOffFilled, IconCameraOnFilled } from "../components/icons/IconCamera";
import { IconChevronDown, IconChevronDownBlur } from "../components/icons/IconChevron";
import { IconDeafenedFilled, IconDeafenOff } from "../components/icons/IconDeafen";
import { IconMicOffFilled, IconMicOnFilled } from "../components/icons/IconMic";
import { IconPhoneHangupFilled } from "../components/icons/IconPhoneHangup";
import IconSettings from "../components/icons/IconSettings";
import { readBlurMode, writeBlurMode, type CameraBlurMode } from "../blur/blurPreference";
import {
  applyBlurMode,
  supportsCameraBlur,
  BLUR_UNAVAILABLE,
} from "../video/backgroundBlur";
import {
  useVoiceSession,
  viewingActiveVoiceStage,
} from "../voice/VoiceSession";

/** Panel call-control glyph size — mic is the visual base (042 FR-005). */
const PANEL_CALL_ICON = 18;
const PANEL_BLUR_CHEVRON = 14;

type Props = {
  me: Account;
  onLogout: () => void;
  onAccountPatch?: (account: Account) => void;
};

export default function UserPanel(props: Props): JSX.Element {
  const voice = useVoiceSession();
  const params = useParams();
  const [accountOpen, setAccountOpen] = createSignal(false);
  const [blurMode, setBlurMode] = createSignal<CameraBlurMode>(readBlurMode());
  const [blurMenuOpen, setBlurMenuOpen] = createSignal(false);

  const onStage = () => viewingActiveVoiceStage(params.id, voice);
  /** 042/043: call group only when live and not on that call’s stage (never idle is-disabled). */
  const showCallGroup = () => voice.live() && !onStage();

  function openAccount() {
    setAccountOpen(true);
  }

  async function selectBlurMode(next: CameraBlurMode) {
    setBlurMenuOpen(false);
    if (next !== "off" && !supportsCameraBlur()) return;
    writeBlurMode(next);
    setBlurMode(next);
    const track = voice.localCamTrack();
    if (!track || !voice.live()) return;
    try {
      await applyBlurMode(track, next);
    } catch {
      /* panel path: ignore blur apply errors */
    }
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
          aria-label={`Conta: ${props.me.handle}`}
        >
          <span class="user-panel-avatar-wrap">
            <IdentityAvatar
              class="user-panel-avatar"
              accountId={props.me.id}
              handle={props.me.handle}
              hasAvatar={!!props.me.has_avatar}
            />
            <span class="user-panel-online" title="Online" aria-label="Online" />
          </span>
          <span class="user-panel-handle">{props.me.handle}</span>
        </button>
        <button
          type="button"
          class="user-panel-settings"
          aria-label="Definições da conta"
          title="Definições da conta"
          onClick={openAccount}
        >
          <IconSettings size={18} title="Definições" />
        </button>
        <AccountMenu
          open={accountOpen()}
          onClose={() => setAccountOpen(false)}
          me={props.me}
          onLogout={props.onLogout}
          onAccountPatch={props.onAccountPatch}
        />
      </div>

      <Show when={showCallGroup()}>
        <div class="user-panel-calls" role="group" aria-label="Controlos da chamada">
          <button
            type="button"
            class="btn btn-secondary call-ctrl call-ctrl-icon user-panel-ctrl"
            classList={{
              "is-speaking":
                voice.micOn() && voice.speakingAccountIds().has(props.me.id),
            }}
            aria-label={voice.micOn() ? "Microfone ligado" : "Microfone desligado"}
            title={voice.micOn() ? "Microfone ligado" : "Microfone desligado"}
            onClick={() => void voice.toggleMic()}
          >
            <Show when={voice.micOn()} fallback={<IconMicOffFilled size={PANEL_CALL_ICON} />}>
              <IconMicOnFilled size={PANEL_CALL_ICON} />
            </Show>
          </button>

          <button
            type="button"
            class="btn btn-secondary call-ctrl call-ctrl-icon user-panel-ctrl"
            aria-label={voice.deafened() ? "Som da chamada desligado" : "Ensurdecer"}
            title={voice.deafened() ? "Ouvir de novo" : "Ensurdecer"}
            onClick={() => void voice.toggleDeafen()}
          >
            <Show when={voice.deafened()} fallback={<IconDeafenOff size={PANEL_CALL_ICON} />}>
              <IconDeafenedFilled size={PANEL_CALL_ICON} />
            </Show>
          </button>

          <div class="call-ctrl-split camera-blur-anchor user-panel-cam-split">
            <button
              type="button"
              class="btn btn-secondary call-ctrl call-ctrl-icon user-panel-ctrl"
              aria-label={voice.camOn() ? "Câmera ligada" : "Câmera desligada"}
              title={voice.camOn() ? "Câmera ligada" : "Câmera desligada"}
              onClick={() => void voice.toggleCam()}
            >
              <Show when={voice.camOn()} fallback={<IconCameraOffFilled size={PANEL_CALL_ICON} />}>
                <IconCameraOnFilled size={PANEL_CALL_ICON} />
              </Show>
            </button>
            <button
              type="button"
              class="btn btn-secondary call-ctrl-chevron"
              data-blur={blurMode() === "off" ? "off" : "on"}
              aria-haspopup="menu"
              aria-expanded={blurMenuOpen()}
              aria-label={blurMode() === "off" ? "Fundo: sem blur" : "Fundo: blur ligado"}
              title={
                blurMode() === "off"
                  ? "Fundo: sem blur"
                  : supportsCameraBlur()
                    ? "Fundo: blur ligado"
                    : BLUR_UNAVAILABLE
              }
              onClick={() => setBlurMenuOpen(!blurMenuOpen())}
            >
              <Show when={blurMode() !== "off"} fallback={<IconChevronDown size={PANEL_BLUR_CHEVRON} />}>
                <IconChevronDownBlur size={PANEL_BLUR_CHEVRON} />
              </Show>
            </button>
            <CameraBlurMenu
              open={blurMenuOpen()}
              mode={blurMode()}
              onClose={() => setBlurMenuOpen(false)}
              onSelect={(m) => void selectBlurMode(m)}
            />
          </div>

          <button
            type="button"
            class="btn btn-danger call-ctrl call-ctrl-icon user-panel-ctrl user-panel-leave"
            aria-label="Sair da chamada"
            title="Sair da chamada"
            onClick={() => void voice.hangup()}
          >
            <IconPhoneHangupFilled size={PANEL_CALL_ICON} />
          </button>
        </div>
      </Show>
    </div>
  );
}
