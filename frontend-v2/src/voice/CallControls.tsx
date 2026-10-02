// The call's controls, pinned in the user panel and only while a call is on: microphone, deafen,
// camera (with its blur menu), screen share (only in the grid view) and hang up. They never overlay
// the video.
import { Show, createSignal } from "solid-js";
import { Icon } from "../components/ui";
import { t } from "../i18n";
import { useCall } from "./callSession";
import { prefs, type BlurLevel } from "./devices";
import { callView } from "./view";

const LEVELS: BlurLevel[] = ["off", "light", "strong"];

export function CallControls() {
  const call = useCall();
  const [blurOpen, setBlurOpen] = createSignal(false);
  const listenOnly = () => !call.canSpeak();
  const toggle = "call-control";

  return (
    <Show when={call.live()}>
      <div class="call-controls" role="group" aria-label={t("call.controls")}>
        <button
          type="button"
          class={toggle}
          classList={{ off: !call.mic() }}
          aria-pressed={call.mic()}
          disabled={listenOnly()}
          title={listenOnly() ? t("call.listenOnlyWhy") : call.mic() ? t("call.mute") : t("call.unmute")}
          aria-label={listenOnly() ? t("call.listenOnlyWhy") : call.mic() ? t("call.mute") : t("call.unmute")}
          onClick={() => void call.setMic(!call.mic())}
        >
          <Icon name={call.mic() ? "mic" : "mic_off"} />
        </button>
        <button
          type="button"
          class={toggle}
          classList={{ off: call.deafened() }}
          aria-pressed={call.deafened()}
          title={call.deafened() ? t("call.undeafen") : t("call.deafen")}
          aria-label={call.deafened() ? t("call.undeafen") : t("call.deafen")}
          onClick={call.toggleDeafened}
        >
          <Icon name={call.deafened() ? "headset_off" : "headset_mic"} />
        </button>
        <span class="call-control-group">
          <button
            type="button"
            class={toggle}
            classList={{ off: !call.cam() }}
            aria-pressed={call.cam()}
            disabled={listenOnly()}
            title={listenOnly() ? t("call.listenOnlyWhy") : call.cam() ? t("call.camOff") : t("call.camOn")}
            aria-label={listenOnly() ? t("call.listenOnlyWhy") : call.cam() ? t("call.camOff") : t("call.camOn")}
            onClick={() => void call.setCam(!call.cam())}
          >
            <Icon name={call.cam() ? "videocam" : "videocam_off"} />
          </button>
          <Show when={call.cam()}>
            <button type="button" class={`${toggle} small`} aria-haspopup="menu" aria-expanded={blurOpen()} title={t("call.blur.label")} aria-label={t("call.blur.label")} onClick={() => setBlurOpen(!blurOpen())}>
              <Icon name="blur_on" />
            </button>
          </Show>
          <Show when={blurOpen() && call.cam()}>
            <div class="call-menu" role="menu">
              {LEVELS.map((level) => (
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={prefs.blur() === level}
                  onClick={() => {
                    void call.setBlur(level);
                    setBlurOpen(false);
                  }}
                >
                  {t(`call.blur.${level}`)}
                  <Show when={prefs.blur() === level}><Icon name="check" class="text-[16px]" /></Show>
                </button>
              ))}
              <Show when={call.blurError()}>
                <p class="call-inline-error" role="alert">{t("call.blur.unsupported")}</p>
              </Show>
            </div>
          </Show>
        </span>
        <Show when={callView() === "grid" && !listenOnly()}>
          <button
            type="button"
            class={toggle}
            classList={{ on: call.screen() }}
            aria-pressed={call.screen()}
            title={call.screen() ? t("call.screenStop") : t("call.screenStart")}
            aria-label={call.screen() ? t("call.screenStop") : t("call.screenStart")}
            onClick={() => void call.setScreen(!call.screen())}
          >
            <Icon name={call.screen() ? "stop_screen_share" : "screen_share"} />
          </button>
        </Show>
        <button type="button" class={`${toggle} hangup`} title={t("call.hangup")} aria-label={t("call.hangup")} onClick={() => void call.leave()}>
          <Icon name="call_end" />
        </button>
      </div>
    </Show>
  );
}
