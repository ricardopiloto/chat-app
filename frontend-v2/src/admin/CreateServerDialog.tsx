import { Show, batch, createEffect, createSignal } from "solid-js";
import { KeyCustody } from "./KeyCustody";
import { errorText } from "../lib/errors";
import { t } from "../i18n";
import { publishOwnEnvelope } from "../crypto/keyHandoff";
import type { Identity } from "../crypto/identity";
import { channelKeyDisplay, generateChannelKey, rememberChannelKey, sealChannelKeyForSelf } from "../crypto/channelKey";
import { Button, Dialog, Icon } from "../components/ui";
import { channels, servers } from "../api";
import { MAX_IMAGE_BYTES, PROFILE_IMAGE_MEDIA_TYPES } from "../api/limits";

const NAME_MAX = 32;

// "Create server": a name, an optional image, and the master key the owner must take custody of
// before anything is created. The same key protects the first voice channel the server starts with.
export function CreateServerDialog(props: {
  open: boolean;
  accountId: string;
  identity: Identity;
  onClose: () => void;
  onCreated: (serverId: string) => void;
}) {
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal("");
  const [image, setImage] = createSignal<File | null>(null);
  const [preview, setPreview] = createSignal<string>();
  const [key, setKey] = createSignal(generateChannelKey());
  const [name, setName] = createSignal("");
  const [acknowledged, setAcknowledged] = createSignal(false);

  // Opening the dialog always yields a blank form and a newly generated key.
  createEffect(() => {
    if (!props.open) return;
    batch(() => {
      setKey(generateChannelKey());
      setImage(null);
      setName("");
      setAcknowledged(false);
      setBusy(false);
      setError("");
    });
  });
  createEffect(() => {
    const file = image();
    if (!file) return setPreview(undefined);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  });

  const valid = () => name().trim().length > 0 && name().length <= NAME_MAX;

  function pickImage(file: File | undefined) {
    if (!file) return;
    if (!PROFILE_IMAGE_MEDIA_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES) {
      setError(t("mgmt.createServer.imageError"));
      return;
    }
    setError("");
    setImage(file);
  }

  /** The new server starts with a text and a voice channel; the voice one was sealed with our key. */
  async function rememberVoiceKeys(serverId: string) {
    const created = await channels.listForServer(serverId);
    created.filter((c) => c.type === "voice_video").forEach((c) => rememberChannelKey(c.id, key()));
  }

  async function submit(event: Event) {
    event.preventDefault();
    if (busy() || !acknowledged() || !valid()) return;
    setError("");
    setBusy(true);
    try {
      const sealed = sealChannelKeyForSelf(key(), props.identity);
      const { id } = await servers.create({ name: name().trim(), custody_ack: true, channel_key_sealed: sealed });
      await publishOwnEnvelope(id, props.accountId, props.identity, key());
      await rememberVoiceKeys(id);
      const picked = image();
      if (picked) {
        // A rejected image must not undo the server that was just created.
        try {
          await servers.setImage(id, picked, picked.type);
        } catch {
          /* the owner can set the image later from Overview */
        }
      }
      props.onCreated(id);
    } catch (failure) {
      setBusy(false);
      setError(errorText(failure, "mgmt.error"));
    }
  }

  return (
    <Dialog open={props.open} title={t("mgmt.createServer.title")} onClose={props.onClose} accent wide eyebrow={t("mgmt.createServer.eyebrow")} icon="add_circle">
      <form class="mg-form" onSubmit={submit}>
        <p class="mg-lead">{t("mgmt.createServer.lead", { text: "#geral" })}</p>

        <div class="mg-identity">
          <div class="mg-sigil-field">
            <span class="mg-label">{t("mgmt.createServer.sigil")}</span>
            <label class="mg-sigil" title={t("mgmt.createServer.sigilEdit")}>
              <Show when={preview()} fallback={<Icon name="shield_person" />}>
                {(src) => <img src={src()} alt="" />}
              </Show>
              <span><Icon name="photo_camera" />{t("mgmt.createServer.sigilEdit")}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => pickImage(event.currentTarget.files?.[0])} />
            </label>
          </div>
          <label class="mg-name">
            <span class="mg-label">
              {t("mgmt.createServer.name")}
              <output>{name().length} / {NAME_MAX}</output>
            </span>
            <input
              value={name()}
              maxLength={NAME_MAX}
              placeholder={t("mgmt.createServer.namePlaceholder")}
              onInput={(event) => setName(event.currentTarget.value)}
              data-autofocus
            />
            <small>{t("mgmt.createServer.nameHint")}</small>
          </label>
        </div>

        <KeyCustody
          icon="lock"
          title={t("mgmt.createServer.keyTitle")}
          text={t("mgmt.createServer.keyText")}
          value={channelKeyDisplay(key())}
          copyLabel={t("mgmt.key.copyKey")}
          acknowledged={acknowledged()}
          onAcknowledge={setAcknowledged}
          acknowledgement={t("mgmt.createServer.custody")}
          detail={t("mgmt.createServer.custodyText")}
        />

        <Show when={error()}>
          <p class="mg-error" role="alert">{error()}</p>
        </Show>
        <footer class="mg-actions">
          <Button variant="icon" class="mg-cancel" onClick={props.onClose}>{t("mgmt.cancel")}</Button>
          <Button variant="primary" type="submit" disabled={!valid() || !acknowledged() || busy()}>
            {t("mgmt.createServer.submit")}<Icon name="arrow_forward" />
          </Button>
        </footer>
        <p class="mg-note"><Icon name="auto_awesome" />{t("mgmt.createServer.defaults", { text: "#geral", voice: "mesa" })}</p>
      </form>
    </Dialog>
  );
}
