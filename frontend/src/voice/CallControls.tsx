// The call's controls, pinned in the user panel and only while a call is on: microphone, deafen,
// camera (with its blur menu), screen share and hang up. They never overlay
// the video.
import { For, Show, createSignal, onCleanup } from "solid-js";
import { Icon } from "../components/ui";
import { t } from "../i18n";
import { isNative } from "../api/instance";
import { useCall } from "./callSession";
import { prefs, type BlurLevel } from "./devices";
import { setCallView } from "./view";
import { backgroundBlob, backgroundList, loadBackgrounds } from "./cameraBackgrounds";

const LEVELS: BlurLevel[] = ["off", "light", "strong"];

export function CallControls() {
  const call = useCall();
  const [blurOpen, setBlurOpen] = createSignal(false);
  const [thumbnailUrls, setThumbnailUrls] = createSignal<Record<string, string>>({});
  let loadTicket = 0;
  const closeBackgrounds = () => {
    loadTicket++;
    Object.values(thumbnailUrls()).forEach((url) => URL.revokeObjectURL(url));
    setThumbnailUrls({});
    setBlurOpen(false);
  };
  onCleanup(closeBackgrounds);
  const openBackgrounds = async () => {
    if (blurOpen()) { closeBackgrounds(); return; }
    const ticket = ++loadTicket;
    setBlurOpen(true);
    try {
      await loadBackgrounds();
      const entries = await Promise.all(backgroundList().map(async (item) => {
        try { return [item.id, URL.createObjectURL(await backgroundBlob(item.id))] as const; }
        catch { return null; }
      }));
      const next: Record<string, string> = Object.fromEntries(entries.filter((entry) => entry !== null));
      if (ticket !== loadTicket) { Object.values(next).forEach((url) => URL.revokeObjectURL(url)); return; }
      setThumbnailUrls(next);
    } catch { /* blur choices remain available */ }
  };
  const activeBackground = (id: string) => { const effect = prefs.effect(); return effect.kind === "background" && effect.backgroundId === id; };
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
            <button type="button" class={`${toggle} small`} aria-haspopup="menu" aria-expanded={blurOpen()} title={t("call.blur.label")} aria-label={t("call.blur.label")} onClick={() => void openBackgrounds()}>
              <Icon name="blur_on" />
            </button>
          </Show>
          <Show when={blurOpen() && call.cam()}>
            <div class="call-menu" role="menu">
              {LEVELS.map((level) => (
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={prefs.effect().kind === "blur" && prefs.blur() === level}
                  onClick={() => {
                    void call.setBlur(level);
                    closeBackgrounds();
                  }}
                >
                  {t(`call.blur.${level}`)}
                  <Show when={prefs.effect().kind === "blur" && prefs.blur() === level}><Icon name="check" class="text-[16px]" /></Show>
                </button>
              ))}
              <For each={backgroundList()}>{(item, index) => <button type="button" role="menuitemradio" aria-label={`${t("call.background.choose")} ${index() + 1}`} aria-checked={activeBackground(item.id)} onClick={() => { void call.setEffect({ kind: "background", backgroundId: item.id }); closeBackgrounds(); }}>
                <Show when={thumbnailUrls()[item.id]} fallback={<span class="call-background-menu-thumb bg-surface-container-high" />}>
                  {(url) => <img src={url()} alt="" class="call-background-menu-thumb" />}
                </Show>
                <span>{t("call.background.choose")} {index() + 1}</span>
                <Show when={activeBackground(item.id)}><Icon name="check" class="text-[16px]" /></Show>
              </button>}</For>
              <Show when={call.blurError()}>
                <p class="call-inline-error" role="alert">{t("call.blur.unsupported")}</p>
              </Show>
            </div>
          </Show>
        </span>
        <Show when={!listenOnly()}>
          <button
            type="button"
            class={toggle}
            classList={{ on: call.screen() }}
            aria-pressed={call.screen()}
            title={call.screen() ? t("call.screenStop") : t("call.screenStart")}
            aria-label={call.screen() ? t("call.screenStop") : t("call.screenStart")}
            onClick={() => {
              const on = !call.screen();
              void call.setScreen(on).then((started) => { if (on && started) setCallView("grid"); });
            }}
          >
            <Icon name="call_screen_share" />
          </button>
        </Show>
        <Show when={isNative() && !call.popoutFor()}>
          <button
            type="button"
            class={toggle}
            title={t("call.popout.open")}
            aria-label={t("call.popout.open")}
            onClick={() => void call.openPopout()}
          >
            <Icon name="open_in_new" />
          </button>
        </Show>
        <button type="button" class={`${toggle} hangup`} title={t("call.hangup")} aria-label={t("call.hangup")} onClick={() => void call.leave()}>
          <Icon name="call_hangup" class="call-hangup-icon" />
        </button>
      </div>
    </Show>
  );
}
