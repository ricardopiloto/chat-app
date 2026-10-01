import { Show, createSignal, onCleanup } from "solid-js";
import { Icon } from "../components/ui";
import { t } from "../i18n";
import { readViewMode, subscribeViewMode, type ViewMode } from "../preferences/viewMode";
import CameraBlurMenu from "./CameraBlurMenu";
import { useVoiceSession } from "./VoiceSession";

/** Call controls rendered only in the user panel, only while a call is live. */
export default function CallControls() {
  const voice = useVoiceSession();
  const [viewMode, setViewMode] = createSignal<ViewMode>(readViewMode());
  onCleanup(subscribeViewMode(setViewMode));
  const listenOnly = () => voice.permission() === "listen";
  const shareAvailable = () => !listenOnly() && viewMode() === "grid";

  return (
    <Show when={voice.live()}>
      <div class="call-controls" role="group" aria-label={t("voice.callControls")}>
        <div class="call-status">
          <Icon name="graphic_eq" />
          <span>{t("voice.callStatus", { name: voice.channelName() ?? "" })}</span>
        </div>
        <div class="call-buttons">
          <button
            type="button"
            class="call-ctl"
            classList={{ off: !voice.micOn() }}
            disabled={listenOnly()}
            aria-pressed={voice.micOn()}
            aria-label={voice.micOn() ? t("voice.callMic") : t("voice.callUnmic")}
            title={listenOnly() ? t("voice.micListenOnly") : voice.micOn() ? t("voice.callMic") : t("voice.callUnmic")}
            onClick={() => void voice.toggleMic()}
          >
            <Icon name={voice.micOn() ? "mic" : "mic_off"} />
          </button>
          <button
            type="button"
            class="call-ctl"
            classList={{ off: voice.deafened() }}
            aria-pressed={voice.deafened()}
            aria-label={voice.deafened() ? t("voice.callUndeafen") : t("voice.callDeafen")}
            title={voice.deafened() ? t("voice.callUndeafen") : t("voice.callDeafen")}
            onClick={() => void voice.toggleDeafen()}
          >
            <Icon name={voice.deafened() ? "headset_off" : "headphones"} />
          </button>
          <button
            type="button"
            class="call-ctl"
            classList={{ off: !voice.camOn() }}
            disabled={listenOnly()}
            aria-pressed={voice.camOn()}
            aria-label={voice.camOn() ? t("voice.callCamOff") : t("voice.callCamOn")}
            title={listenOnly() ? t("voice.camListenOnly") : voice.camOn() ? t("voice.callCamOff") : t("voice.callCamOn")}
            onClick={() => void voice.toggleCam()}
          >
            <Icon name={voice.camOn() ? "videocam" : "videocam_off"} />
          </button>
          <Show when={!listenOnly()}>
            <CameraBlurMenu />
          </Show>
          <Show when={shareAvailable()}>
            <button
              type="button"
              class="call-ctl"
              classList={{ on: voice.screenOn() }}
              aria-pressed={voice.screenOn()}
              aria-label={voice.screenOn() ? t("voice.callShareStop") : t("voice.callShareStart")}
              title={voice.screenOn() ? t("voice.callShareStop") : t("voice.callShareStart")}
              onClick={() => void voice.toggleScreenShare()}
            >
              <Icon name={voice.screenOn() ? "stop_screen_share" : "screen_share"} />
            </button>
          </Show>
          <button
            type="button"
            class="call-ctl call-ctl--hangup"
            aria-label={t("voice.leaveCall")}
            title={t("voice.leaveCall")}
            onClick={() => void voice.hangup()}
          >
            <Icon name="call_end" />
          </button>
        </div>
      </div>
    </Show>
  );
}
