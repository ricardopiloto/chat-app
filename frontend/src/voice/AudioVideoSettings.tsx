// Settings > Audio & Video: pick and test the devices a call will use. Choices persist on this device
// (see devices.ts) and are what the green room and every later call start from. The blur choice is the
// same store the call's own blur menu writes, so changing it here or there changes it everywhere.
import { For, Show, createSignal, onCleanup, onMount } from "solid-js";
import { Button, Card, Icon, MonoLabel, Segmented, Switch } from "../components/ui";
import { t } from "../i18n";
import { devices, playTestTone, prefs, refreshDevices, requestAccess, resolveDevice, type BlurLevel } from "./devices";
import { soundPrefs, preview as previewEffect } from "../sound/effects";
import { createPreview } from "./preview";
import { cameraBackgrounds } from "../api/endpoints/cameraBackgrounds";
import { backgroundList, loadBackgrounds, removeBackground, backgroundBlob } from "./cameraBackgrounds";

export function AudioVideoSettings() {
  const preview = createPreview();
  const [uploading, setUploading] = createSignal(false);
  const [backgroundError, setBackgroundError] = createSignal("");
  const [thumbnailUrls, setThumbnailUrls] = createSignal<Record<string, string>>({});
  onCleanup(() => Object.values(thumbnailUrls()).forEach((url) => URL.revokeObjectURL(url)));
  const activeBackground = (id: string) => { const effect = prefs.effect(); return effect.kind === "background" && effect.backgroundId === id; };
  const refreshBackgrounds = async () => {
    await loadBackgrounds();
    const next: Record<string, string> = {};
    for (const item of backgroundList()) next[item.id] = URL.createObjectURL(await backgroundBlob(item.id));
    const old = thumbnailUrls();
    setThumbnailUrls(next);
    Object.values(old).forEach((url) => URL.revokeObjectURL(url));
  };
  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBackgroundError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setBackgroundError(t("call.background.invalid")); return;
    }
    setUploading(true);
    try { await cameraBackgrounds.upload(file); await refreshBackgrounds(); }
    catch (error) { setBackgroundError(error instanceof Error ? error.message : t("call.background.failed")); }
    finally { setUploading(false); }
  };
  const labelled = () => devices.mics().some((d) => d.label.length > 0 && !/^Mic \d+$/.test(d.label)) || devices.cams().some((d) => d.label.length > 0 && !/^Cam \d+$/.test(d.label));
  const denied = () => preview.micProblem() === "denied" || preview.camProblem() === "denied" || devices.permission().audio === "denied" || devices.permission().video === "denied";
  const micMissing = () => resolveDevice("audioinput", prefs.micId()).missing;
  const camMissing = () => resolveDevice("videoinput", prefs.camId()).missing;
  const outMissing = () => resolveDevice("audiooutput", prefs.outId()).missing;
  const level = () => Math.round(preview.level() * 100);

  onMount(async () => {
    void refreshBackgrounds().catch(() => setBackgroundError(t("call.background.failed")));
    await refreshDevices();
    // Only open the hardware by itself when access was already granted; never trigger a prompt on page load.
    if (labelled()) {
      preview.startMic();
      preview.startCam();
    }
  });

  const pick = async (apply: () => void) => {
    apply();
    await preview.reapply();
  };
  const blurOptions = (): { value: BlurLevel; label: string }[] => [
    { value: "off", label: t("call.blur.off") },
    { value: "light", label: t("call.blur.light") },
    { value: "strong", label: t("call.blur.strong") },
  ];

  return (
    <section id="audio-video" class="flex flex-col gap-4">
      <Card icon="graphic_eq" label={t("call.settings.label")} title={t("call.settings.title")}>
        <p class="text-body-sm text-on-surface-variant">{t("call.settings.hint")}</p>

        <Show when={denied() || !labelled()}>
          <div class="call-av-help" role="note">
            <Icon name={denied() ? "lock" : "info"} class="text-[20px]" />
            <div>
              <strong>{denied() ? t("call.settings.deniedTitle") : t("call.settings.needTitle")}</strong>
              <p>{denied() ? t("call.settings.deniedBody") : t("call.settings.needBody")}</p>
              <Show when={!denied()}>
                <Button variant="primary" onClick={() => void requestAccess().then(() => { preview.startMic(); preview.startCam(); })}>{t("call.devices.allow")}</Button>
              </Show>
            </div>
          </div>
        </Show>

        <div class="call-av-grid">
          <section class="call-panel" aria-label={t("call.settings.input")}>
            <h3><Icon name="mic" class="text-[20px]" />{t("call.settings.input")}</h3>
            <label class="field">
              <MonoLabel>{t("call.green.micDevice")}</MonoLabel>
              <select value={prefs.micId() ?? ""} onChange={(e) => void pick(() => prefs.setMic(e.currentTarget.value || undefined))}>
                <option value="" selected={!prefs.micId()}>{t("call.devices.default")}</option>
                <For each={devices.mics()}>{(d) => <option value={d.id} selected={prefs.micId() === d.id}>{d.label}</option>}</For>
              </select>
            </label>
            <Show when={micMissing()}><p class="call-inline-error" role="status">{t("call.settings.missing")}</p></Show>
            <div class="call-av-meter">
              <MonoLabel>{t("call.settings.meter")}</MonoLabel>
              <span class="call-meter" role="meter" aria-label={t("call.green.level")} aria-valuemin="0" aria-valuemax="100" aria-valuenow={level()}><i style={{ width: `${level()}%` }} /></span>
            </div>
            <Button onClick={() => preview.toggleMic()}>
              <Icon name={preview.micOn() ? "mic_off" : "mic"} class="text-[18px]" />
              {preview.micOn() ? t("call.settings.stopTest") : t("call.settings.testMic")}
            </Button>
          </section>

          <section class="call-panel" aria-label={t("call.settings.output")}>
            <h3><Icon name="headphones" class="text-[20px]" />{t("call.settings.output")}</h3>
            <Show when={devices.canPickOutput()} fallback={<p class="text-body-sm text-on-surface-variant">{t("call.settings.noOutputPick")}</p>}>
              <label class="field">
                <MonoLabel>{t("call.green.outDevice")}</MonoLabel>
                <select value={prefs.outId() ?? ""} onChange={(e) => prefs.setOut(e.currentTarget.value || undefined)}>
                  <option value="" selected={!prefs.outId()}>{t("call.devices.default")}</option>
                  <For each={devices.outputs()}>{(d) => <option value={d.id} selected={prefs.outId() === d.id}>{d.label}</option>}</For>
                </select>
              </label>
              <Show when={outMissing()}><p class="call-inline-error" role="status">{t("call.settings.missing")}</p></Show>
            </Show>
            <Button onClick={() => void playTestTone(prefs.outId())}>
              <Icon name="volume_up" class="text-[18px]" />
              {t("call.green.testSound")}
            </Button>
          </section>
        </div>

        <section class="call-panel" aria-label={t("call.settings.camera")}>
          <h3><Icon name="videocam" class="text-[20px]" />{t("call.settings.camera")}</h3>
          <div class="call-av-camera">
            <div class="flex flex-col gap-3">
              <label class="field">
                <MonoLabel>{t("call.green.camDevice")}</MonoLabel>
                <select value={prefs.camId() ?? ""} onChange={(e) => void pick(() => prefs.setCam(e.currentTarget.value || undefined))}>
                  <option value="" selected={!prefs.camId()}>{t("call.devices.default")}</option>
                  <For each={devices.cams()}>{(d) => <option value={d.id} selected={prefs.camId() === d.id}>{d.label}</option>}</For>
                </select>
              </label>
              <Show when={camMissing()}><p class="call-inline-error" role="status">{t("call.settings.missing")}</p></Show>
              <div class="flex flex-col gap-2">
                <MonoLabel>{t("call.blur.label")}</MonoLabel>
                <Segmented label={t("call.blur.label")} value={(prefs.effect().kind === "blur" ? prefs.blur() : "") as BlurLevel} options={blurOptions()} onChange={(level) => { prefs.setBlur(level); preview.rerenderBlur(); }} />
                <Show when={preview.blurError()}><p class="call-inline-error" role="alert">{t("call.blur.unsupported")}</p></Show>
                <div class="flex flex-wrap gap-2">
                  <For each={backgroundList()}>{(item, index) => <div class="flex w-24 flex-col gap-1">
                    <button type="button" class="overflow-hidden rounded-md border-2 border-outline-variant p-0 focus-visible:outline-2 focus-visible:outline-primary" classList={{ "border-primary": activeBackground(item.id) }} aria-label={`${t("call.background.choose")} ${index() + 1}`} aria-pressed={activeBackground(item.id)} onClick={() => { prefs.setEffect({ kind: "background", backgroundId: item.id }); preview.rerenderBlur(); }}>
                      <img src={thumbnailUrls()[item.id]} alt="" class="h-16 w-full object-cover" />
                    </button>
                    <Button aria-label={`${t("call.background.remove")} ${index() + 1}`} onClick={() => void removeBackground(item.id).then(() => { preview.rerenderBlur(); void refreshBackgrounds(); }).catch((error) => setBackgroundError(error instanceof Error ? error.message : t("call.background.failed")))}><Icon name="delete" />{t("call.background.remove")}</Button>
                  </div>}</For>
                </div>
                <label class="ui-button primary cursor-pointer self-start" classList={{ "opacity-50": uploading() || backgroundList().length >= 10 }}><Icon name="upload" />{t("call.background.add")}
                  <input type="file" class="sr-only" accept="image/jpeg,image/png,image/webp" disabled={uploading() || backgroundList().length >= 10} onChange={(event) => { void upload(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
                </label>
                <Show when={uploading()}><p role="status">{t("call.background.uploading")}</p></Show>
                <Show when={backgroundError()}><p class="call-inline-error" role="alert">{backgroundError()}</p></Show>
              </div>
              <Button onClick={() => preview.toggleCam()}>
                <Icon name={preview.camOn() ? "videocam_off" : "videocam"} class="text-[18px]" />
                {preview.camOn() ? t("call.settings.stopTest") : t("call.settings.testCam")}
              </Button>
            </div>
            <div class="call-preview">
              <Show when={preview.camOn()} fallback={<div class="call-preview-off"><Icon name="videocam_off" class="text-[40px]" /><span>{t("call.green.cameraOff")}</span></div>}>
                <video ref={(el) => preview.bindVideo(el)} class="call-video" autoplay playsinline muted />
              </Show>
            </div>
          </div>
        </section>

        <section class="call-panel" aria-label={t("call.settings.sounds")}>
          <h3><Icon name="notifications_active" class="text-[20px]" />{t("call.settings.sounds")}</h3>
          <p class="text-body-sm text-on-surface-variant">{t("call.settings.soundsHint")}</p>
          <Switch label={t("call.settings.soundsOn")} checked={soundPrefs.enabled()} onChange={(e) => soundPrefs.setEnabled(e.currentTarget.checked)} />
          <div class="flex flex-wrap gap-2">
            <Button onClick={() => previewEffect("mention")}>
              <Icon name="volume_up" class="text-[18px]" />
              {t("call.settings.soundMention")}
            </Button>
            <Button onClick={() => previewEffect("callJoin")}>
              <Icon name="volume_up" class="text-[18px]" />
              {t("call.settings.soundJoin")}
            </Button>
          </div>
        </section>
      </Card>
    </section>
  );
}
