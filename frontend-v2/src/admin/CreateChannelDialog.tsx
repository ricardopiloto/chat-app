import { Show, createEffect, createSignal } from "solid-js";
import {
  createChannel,
  patchChannel,
  type Channel,
  type CreateChannelBody,
} from "../api/client";
import {
  channelKeyDisplay,
  generateChannelKey,
  rememberChannelKey,
  sealChannelKeyForSelf,
} from "../crypto/channelKey";
import type { Identity } from "../crypto/identity";
import { Button, Dialog, TextField } from "../components/ui";
import { t } from "../i18n";
import {
  normalizeChannelNameDraft,
  validateChannelName,
} from "../lib/channelName";
import { createCopy } from "../lib/copy";
import { errorText } from "../lib/errors";

type ChannelKind = "text" | "voice_video";

export function CreateChannelDialog(props: {
  open: boolean;
  serverId: string;
  initialType: ChannelKind;
  identity: Identity;
  onClose: () => void;
  onCreated: (channel: Channel) => void;
}) {
  const [kind, setKind] = createSignal<ChannelKind>("text");
  const [name, setName] = createSignal("");
  const [visibility, setVisibility] = createSignal<"public" | "private">(
    "public",
  );
  const [visibleToNew, setVisibleToNew] = createSignal(true);
  const [key, setKey] = createSignal<Uint8Array | null>(null);
  const [ack, setAck] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal("");
  const { copied, copy } = createCopy();
  createEffect(() => {
    if (!props.open) return;
    setKind(props.initialType);
    setName("");
    setVisibility("public");
    setVisibleToNew(true);
    setAck(false);
    setError("");
  });
  createEffect(() => {
    if (!props.open) return;
    setAck(false);
    setKey(kind() === "voice_video" ? generateChannelKey() : null);
  });
  const blocked = () => busy() || (kind() === "voice_video" && !ack());
  async function submit(event: Event) {
    event.preventDefault();
    if (blocked()) return;
    const checked = validateChannelName(
      name().trim()
        ? name()
        : kind() === "text"
          ? t("admin.channel.defaultText")
          : t("admin.channel.defaultVoice"),
    );
    if (!checked.ok) {
      setError(
        t(
          checked.reason === "empty"
            ? "admin.channel.nameEmpty"
            : "admin.channel.nameHyphens",
        ),
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body: CreateChannelBody = {
        name: checked.name,
        type: kind(),
        visibility: visibility(),
      };
      const voiceKey = key();
      if (kind() === "voice_video" && voiceKey) {
        body.custody_ack = true;
        body.channel_key_sealed = sealChannelKeyForSelf(
          voiceKey,
          props.identity,
        );
      }
      let channel = await createChannel(props.serverId, body);
      if (channel.visibility === "public" && !visibleToNew()) {
        channel = await patchChannel(channel.id, {
          visible_to_new_members: false,
        });
      }
      if (voiceKey) rememberChannelKey(channel.id, voiceKey);
      props.onCreated(channel);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={props.open}
      title={t("admin.channel.createTitle")}
      onClose={props.onClose}
    >
      <form class="admin-form" onSubmit={(e) => void submit(e)}>
        <div
          class="segmented"
          role="group"
          aria-label={t("admin.channel.type")}
        >
          <button
            type="button"
            classList={{ active: kind() === "text" }}
            aria-pressed={kind() === "text"}
            onClick={() => setKind("text")}
          >
            {t("admin.channel.text")}
          </button>
          <button
            type="button"
            classList={{ active: kind() === "voice_video" }}
            aria-pressed={kind() === "voice_video"}
            onClick={() => setKind("voice_video")}
          >
            {t("admin.channel.voice")}
          </button>
        </div>
        <TextField
          label={t("admin.name")}
          value={name()}
          placeholder={
            kind() === "text"
              ? t("admin.channel.defaultText")
              : t("admin.channel.defaultVoice")
          }
          onInput={(e) => {
            const next = normalizeChannelNameDraft(e.currentTarget.value);
            setName(next);
            e.currentTarget.value = next;
          }}
        />
        <fieldset class="admin-fieldset">
          <legend>{t("admin.channel.visibility")}</legend>
          <label class="choice">
            <input
              type="radio"
              name="create-visibility"
              checked={visibility() === "public"}
              onChange={() => setVisibility("public")}
            />
            <span>{t("admin.channel.public")}</span>
          </label>
          <label class="choice">
            <input
              type="radio"
              name="create-visibility"
              checked={visibility() === "private"}
              onChange={() => setVisibility("private")}
            />
            <span>{t("admin.channel.private")}</span>
          </label>
        </fieldset>
        <Show when={visibility() === "public"}>
          <label class="choice">
            <input
              type="checkbox"
              checked={visibleToNew()}
              onChange={(e) => setVisibleToNew(e.currentTarget.checked)}
            />
            <span>{t("admin.channel.visibleToNew")}</span>
          </label>
        </Show>
        <Show when={kind() === "voice_video" && key()}>
          {(value) => (
            <div class="custody-block">
              <p>{t("admin.channel.custodyHint")}</p>
              <div class="key-row">
                <code class="key-display">{channelKeyDisplay(value())}</code>
                <Button onClick={() => void copy(channelKeyDisplay(value()))}>
                  {copied() ? t("admin.copied") : t("admin.copy")}
                </Button>
              </div>
              <label class="choice">
                <input
                  type="checkbox"
                  checked={ack()}
                  onChange={(e) => setAck(e.currentTarget.checked)}
                />
                <span>{t("admin.custodyAck")}</span>
              </label>
            </div>
          )}
        </Show>
        <Show when={error()}>
          <p class="form-error" role="alert">
            {error()}
          </p>
        </Show>
        <div class="dialog-actions">
          <Button onClick={props.onClose}>{t("admin.cancel")}</Button>
          <Button variant="primary" type="submit" disabled={blocked()}>
            {t("admin.create")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
