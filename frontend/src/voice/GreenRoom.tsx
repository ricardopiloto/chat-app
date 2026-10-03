// The screen before entering a call ("green room"): a local look at camera and microphone, the device
// choices, who is already in, and the three ways in. Choices are the saved ones; the camera and
// microphone buttons here are what "Entrar" will use, so nobody is asked again on every join.
import { For, Show, createSignal, onMount } from "solid-js";
import { Button, Icon, Segmented } from "../components/ui";
import { avatarUrl, type Channel } from "../api";
import { publicDisplayLabel } from "../lib/displayName";
import { t } from "../i18n";
import { useShell } from "../shell/state";
import { E2eeChip } from "./E2ee";
import { createElapsed, useCall, type JoinMode } from "./callSession";
import { devices, playTestTone, prefs, refreshDevices, requestAccess, type BlurLevel } from "./devices";
import { createPreview } from "./preview";

export function GreenRoom(props: { channel: Channel }) {
  const shell = useShell();
  const call = useCall();
  const preview = createPreview();
  const [joining, setJoining] = createSignal<JoinMode | null>(null);

  // Listen-only people can only hear: no mic, no camera, one way in. The server already combines the
  // channel's rules with the person's role into `my_permission` (a member with no role speaks by
  // default), so that is the only thing to look at; a role check here would wrongly silence role-less guests.
  const canSpeak = () => shell.owner() || props.channel.my_permission === "speak";
  const people = () => shell.voiceRoster()[props.channel.id] ?? [];
  const since = () => {
    const at = shell.voiceCalls()[props.channel.id];
    return at ? Date.parse(at) : null;
  };
  const elapsed = createElapsed(since);

  onMount(() => {
    // Whether you may speak depends on role and channel access, which can change while the app is open.
    void shell.refreshChannels();
    void shell.refreshRoles();
    void refreshDevices();
    // Honour the saved choice: the preview opens what the person left switched on last time.
    if (canSpeak() && prefs.micOn()) preview.startMic();
    if (canSpeak() && prefs.camOn()) preview.startCam();
  });

  const flipCam = () => {
    prefs.setCamOn(!preview.camOn());
    preview.toggleCam();
  };
  const flipMic = () => {
    prefs.setMicOn(!preview.micOn());
    preview.toggleMic();
  };

  async function enter(mode: JoinMode) {
    setJoining(mode);
    const wantMic = mode === "listen" ? false : prefs.micOn();
    const wantCam = mode === "listen" ? false : mode === "test" ? true : prefs.camOn();
    // The call opens its own devices; release the preview first so the hardware is free for it.
    preview.stopAll();
    await call.join({ channel: props.channel, mode, mic: wantMic, cam: wantCam });
    setJoining(null);
  }

  const blurOptions = (): { value: BlurLevel; label: string }[] => [
    { value: "off", label: t("call.blur.off") },
    { value: "light", label: t("call.blur.light") },
    { value: "strong", label: t("call.blur.strong") },
  ];

  const chooseBlur = (level: BlurLevel) => {
    prefs.setBlur(level);
    preview.rerenderBlur();
  };
  const pick = async (apply: () => void) => {
    apply();
    await preview.reapply();
  };
  const level = () => Math.round(preview.level() * 100);
  const denied = () => preview.micProblem() === "denied" || preview.camProblem() === "denied";

  return (
    <div class="call-green">
      <header class="call-green-head">
        <span class="call-bar-icon" aria-hidden="true"><Icon name="headset_mic" class="text-[26px]" /></span>
        <div class="call-bar-title">
          <h1>{props.channel.name}</h1>
          <span class="call-bar-meta">
            <E2eeChip enabled={props.channel.e2ee_enabled} />
            <span>{people().length > 0 ? t("call.green.inCall", { n: people().length }) : t("call.green.empty")}</span>
            <Show when={since()}>
              <time class="mono-label">{elapsed()}</time>
            </Show>
          </span>
        </div>
        <span class="spacer" />
        <Button variant="secondary" onClick={() => shell.go(`/servers/${props.channel.server_id}`)}>{t("call.green.back")}</Button>
      </header>

      <div class="call-green-grid">
        <section class="call-green-main">
          <div class="call-preview">
            <Show when={preview.camOn()} fallback={<div class="call-preview-off"><Icon name="videocam_off" class="text-[40px]" /><span>{t(canSpeak() ? "call.green.cameraOff" : "call.green.listenOnlyPreview")}</span></div>}>
              <video ref={(el) => preview.bindVideo(el)} class="call-video" autoplay playsinline muted />
            </Show>
            <span class="call-chip preview-tag">{t("call.green.previewTag")}</span>
            <Show when={canSpeak()}>
              <div class="call-preview-blur">
                <Segmented label={t("call.blur.label")} value={prefs.blur()} options={blurOptions()} onChange={chooseBlur} />
              </div>
              <div class="call-preview-bar">
                <Icon name={preview.micOn() ? "mic" : "mic_off"} class="text-[18px]" />
                <span class="mono-label">{preview.micOn() ? t("call.green.micReady") : t("call.green.micOff")}</span>
                <span class="call-meter" role="meter" aria-label={t("call.green.level")} aria-valuemin="0" aria-valuemax="100" aria-valuenow={level()}>
                  <i style={{ width: `${level()}%` }} />
                </span>
              </div>
            </Show>
          </div>
          <Show when={preview.blurError()}>
            <p class="call-inline-error" role="alert">{t("call.blur.unsupported")}</p>
          </Show>
          <Show when={canSpeak()}>
            <div class="call-toggles">
              <button type="button" class="call-toggle" aria-pressed={preview.camOn()} onClick={flipCam}>
                <Icon name={preview.camOn() ? "videocam" : "videocam_off"} class="text-[20px]" />
                {preview.camOn() ? t("call.green.camOn") : t("call.green.camOff")}
              </button>
              <button type="button" class="call-toggle" aria-pressed={preview.micOn()} onClick={flipMic}>
                <Icon name={preview.micOn() ? "mic" : "mic_off"} class="text-[20px]" />
                {preview.micOn() ? t("call.green.micOnBtn") : t("call.green.micOffBtn")}
              </button>
              <span class="call-synced"><Icon name="tune" class="text-[16px]" />{t("call.green.synced")}</span>
            </div>
          </Show>
          <Show when={denied()}>
            <p class="call-inline-error" role="alert">{t("call.green.denied")}</p>
          </Show>

          <div class="call-actions">
            <Show when={canSpeak()}>
              <button type="button" class="call-action primary" disabled={joining() !== null} onClick={() => void enter("full")}>
                <Icon name="login" class="text-[28px]" />
                <span>{joining() === "full" ? t("call.green.joining") : t("call.green.join")}</span>
              </button>
              <button type="button" class="call-action" disabled={joining() !== null} onClick={() => void enter("test")}>
                <Icon name="monitor_heart" class="text-[28px]" />
                <span>{t("call.green.testVideo")}</span>
              </button>
            </Show>
            <button type="button" class="call-action" classList={{ primary: !canSpeak() }} disabled={joining() !== null} onClick={() => void enter("listen")}>
              <Icon name="hearing" class="text-[28px]" />
              <span>{t("call.green.listen")}</span>
            </button>
          </div>
          <Show when={call.problem()}>
            {(problem) => <p class="call-inline-error" role="alert">{t(`call.problem.${problem()}`)}</p>}
          </Show>
          <p class="call-green-note"><Icon name="info" class="text-[16px]" />{t("call.green.note")}</p>
        </section>

        <aside class="call-green-side">
          <section class="call-panel" aria-label={t("call.green.devices")}>
            <h2>{t("call.green.devices")}</h2>
            <Show when={canSpeak()}>
              <label class="field">
                <span class="mono-label">{t("call.green.micDevice")}</span>
                <select value={prefs.micId() ?? ""} onChange={(e) => void pick(() => prefs.setMic(e.currentTarget.value || undefined))}>
                  <option value="" selected={!prefs.micId()}>{t("call.devices.default")}</option>
                  <For each={devices.mics()}>{(d) => <option value={d.id} selected={prefs.micId() === d.id}>{d.label}</option>}</For>
                </select>
              </label>
            </Show>
            <Show when={devices.canPickOutput()}>
              <label class="field">
                <span class="mono-label">{t("call.green.outDevice")}</span>
                <select value={prefs.outId() ?? ""} onChange={(e) => prefs.setOut(e.currentTarget.value || undefined)}>
                  <option value="" selected={!prefs.outId()}>{t("call.devices.default")}</option>
                  <For each={devices.outputs()}>{(d) => <option value={d.id} selected={prefs.outId() === d.id}>{d.label}</option>}</For>
                </select>
              </label>
            </Show>
            <button type="button" class="call-toggle wide" onClick={() => void playTestTone(prefs.outId())}>
              <Icon name="volume_up" class="text-[18px]" />
              {t("call.green.testSound")}
            </button>
            <Show when={canSpeak()}>
              <label class="field">
                <span class="mono-label">{t("call.green.camDevice")}</span>
                <select value={prefs.camId() ?? ""} onChange={(e) => void pick(() => prefs.setCam(e.currentTarget.value || undefined))}>
                  <option value="" selected={!prefs.camId()}>{t("call.devices.default")}</option>
                  <For each={devices.cams()}>{(d) => <option value={d.id} selected={prefs.camId() === d.id}>{d.label}</option>}</For>
                </select>
              </label>
              <Show when={devices.mics().every((d) => !d.label) && devices.cams().every((d) => !d.label)}>
                <button type="button" class="call-toggle wide" onClick={() => void requestAccess()}>
                  <Icon name="key" class="text-[18px]" />
                  {t("call.devices.allow")}
                </button>
              </Show>
            </Show>
          </section>

          <section class="call-panel" aria-label={t("call.green.now")}>
            <h2>{t("call.green.now")}<span class="call-count">{t("call.green.session", { n: people().length })}</span></h2>
            <ul class="call-roster">
              <For each={people()}>
                {(person) => (
                  <li>
                    <span class="call-roster-avatar">
                      <Show when={person.has_avatar} fallback={publicDisplayLabel(person.handle, person.display_name).slice(0, 1).toUpperCase()}>
                        <img src={avatarUrl(person.account_id)} alt="" />
                      </Show>
                    </span>
                    <span class="call-roster-name">
                      <strong>{publicDisplayLabel(person.handle, person.display_name)}</strong>
                      <small>
                        {person.screen_on ? t("call.green.state.screen") : !person.mic_on && !person.cam_on ? t("call.green.state.listening") : person.mic_on ? t("call.green.state.talking") : t("call.green.state.muted")}
                      </small>
                    </span>
                    <Icon name={person.screen_on ? "present_to_all" : person.mic_on ? "mic" : "mic_off"} class="text-[18px]" />
                    <Show when={person.cam_on}><Icon name="videocam" class="text-[18px]" /></Show>
                  </li>
                )}
              </For>
              <Show when={people().length === 0}><li class="call-editor-hint">{t("call.green.empty")}</li></Show>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
