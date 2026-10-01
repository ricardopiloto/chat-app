import { Show, createEffect, createSignal } from "solid-js";
import { api, type Channel, type CreateServerResult } from "../api/client";
import {
  channelKeyDisplay,
  generateChannelKey,
  rememberChannelKey,
  sealChannelKeyForSelf,
} from "../crypto/channelKey";
import type { Identity } from "../crypto/identity";
import { publishOwnEnvelope } from "../crypto/keyHandoff";
import { generateServerKey } from "../crypto/serverKey";
import { Button, Dialog, TextField } from "../components/ui";
import { t } from "../i18n";
import { createCopy } from "../lib/copy";
import { errorText } from "../lib/errors";

export function CreateServerDialog(props: {
  open: boolean;
  accountId: string;
  identity: Identity;
  onClose: () => void;
  onCreated: (serverId: string) => void;
}) {
  const [name, setName] = createSignal("");
  const [key, setKey] = createSignal<Uint8Array | null>(null);
  const [ack, setAck] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal("");
  const { copied, copy } = createCopy();
  createEffect(() => {
    if (!props.open) return;
    setName("");
    setKey(generateChannelKey());
    setAck(false);
    setError("");
  });
  async function submit(event: Event) {
    event.preventDefault();
    const voiceKey = key();
    if (!voiceKey || !ack() || busy()) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<CreateServerResult>("/api/servers", {
        method: "POST",
        body: JSON.stringify({
          name: name().trim() || t("admin.server.defaultName"),
          custody_ack: true,
          channel_key_sealed: sealChannelKeyForSelf(voiceKey, props.identity),
        }),
      });
      await publishOwnEnvelope(
        result.id,
        props.accountId,
        props.identity,
        generateServerKey(),
      );
      let voiceId = result.channels?.find((c) => c.type === "voice_video")?.id;
      if (!voiceId) {
        const list = await api<Channel[]>(`/api/servers/${result.id}/channels`);
        voiceId = list.find((c) => c.type === "voice_video")?.id;
      }
      if (voiceId) rememberChannelKey(voiceId, voiceKey);
      props.onCreated(result.id);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={props.open}
      title={t("admin.server.createTitle")}
      onClose={props.onClose}
    >
      <form class="admin-form" onSubmit={(e) => void submit(e)}>
        <TextField
          label={t("admin.name")}
          value={name()}
          placeholder={t("admin.server.defaultName")}
          onInput={(e) => setName(e.currentTarget.value)}
        />
        <Show when={key()}>
          {(value) => (
            <div class="custody-block">
              <p>{t("admin.server.custodyHint")}</p>
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
          <Button variant="primary" type="submit" disabled={!ack() || busy()}>
            {t("admin.create")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
