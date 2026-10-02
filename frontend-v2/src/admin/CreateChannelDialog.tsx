import { Show, batch, createEffect, createSignal } from "solid-js";
import { KeyCustody } from "./KeyCustody";
import { errorText } from "../lib/errors";
import { CHANNEL_NAME_MAX, normalizeChannelNameDraft, validateChannelName } from "../lib/channelName";
import { t } from "../i18n";
import type { Identity } from "../crypto/identity";
import { channelKeyDisplay, generateChannelKey, rememberChannelKey, sealChannelKeyForSelf } from "../crypto/channelKey";
import { Button, Dialog, Icon, Radio, Segmented } from "../components/ui";
import { channels, type Channel, type ChannelKind, type ChannelVisibility } from "../api";

// "Create channel": text or voice, public or private, and — for voice only — the key custody step.
export function CreateChannelDialog(props: {
  open: boolean;
  serverId: string;
  initialType: ChannelKind;
  identity: Identity;
  onClose: () => void;
  onCreated: (channel: Channel) => void;
}) {
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal("");
  const [acknowledged, setAcknowledged] = createSignal(false);
  const [key, setKey] = createSignal(generateChannelKey());
  const [name, setName] = createSignal("");
  const [kind, setKind] = createSignal<ChannelKind>("text");
  const [listed, setListed] = createSignal(true);
  const [visibility, setVisibility] = createSignal<ChannelVisibility>("public");

  // Every time the dialog opens it starts from a blank form with a fresh key.
  createEffect(() => {
    if (!props.open) return;
    batch(() => {
      setKind(props.initialType);
      setKey(generateChannelKey());
      for (const clear of [() => setName(""), () => setError(""), () => setAcknowledged(false), () => setBusy(false)]) clear();
      setListed(true);
      setVisibility("public");
    });
  });

  const check = () => validateChannelName(name());
  const nameProblem = () => {
    const result = check();
    if (result.ok || name() === "") return "";
    return t(result.reason === "empty" ? "mgmt.createChannel.nameEmpty" : "mgmt.createChannel.nameHyphens");
  };
  const voice = () => kind() === "voice_video";
  const ready = () => check().ok && (!voice() || acknowledged()) && !busy();

  async function submit(event: Event) {
    event.preventDefault();
    const result = check();
    if (!result.ok || !ready()) return;
    setBusy(true);
    setError("");
    try {
      let created = await channels.create(props.serverId, {
        name: result.name,
        type: kind(),
        visibility: visibility(),
        ...(voice() ? { custody_ack: true, channel_key_sealed: sealChannelKeyForSelf(key(), props.identity) } : {}),
      });
      if (voice()) rememberChannelKey(created.id, key());
      // The listing flag is not part of the create call; it is set right after when it differs from the default.
      if (visibility() === "public" && listed() !== created.visible_to_new_members) {
        created = await channels.update(created.id, { visible_to_new_members: listed() });
      }
      props.onCreated(created);
    } catch (failure) {
      setError(errorText(failure, "mgmt.error"));
      setBusy(false);
    }
  }

  return (
    <Dialog open={props.open} title={t("mgmt.createChannel.title")} icon="add_circle" accent wide onClose={props.onClose}>
      <form class="mg-form" onSubmit={submit}>
        <p class="mg-lead">{t("mgmt.createChannel.lead")}</p>

        <div class="mg-block">
          <span class="mg-label">{t("mgmt.createChannel.kind")}</span>
          <Segmented
            fill
            label={t("mgmt.createChannel.kind")}
            value={kind()}
            onChange={setKind}
            options={[
              { value: "text", icon: "tag", label: t("mgmt.createChannel.text") },
              { value: "voice_video", icon: "headset_mic", label: t("mgmt.createChannel.voice") },
            ]}
          />
        </div>

        <label class="mg-block mg-channel-name">
          <span class="mg-label">{t("mgmt.createChannel.name")}</span>
          <span class="mg-input-row" classList={{ invalid: !!nameProblem() }}>
            <span class="mg-input-icon"><Icon name={voice() ? "mic" : "tag"} /></span>
            <input
              value={name()}
              maxLength={CHANNEL_NAME_MAX}
              placeholder={t("mgmt.createChannel.namePlaceholder")}
              aria-invalid={!!nameProblem()}
              onInput={(event) => {
                const normalized = normalizeChannelNameDraft(event.currentTarget.value);
                event.currentTarget.value = normalized;
                setName(normalized);
              }}
              data-autofocus
            />
            <Show when={check().ok}><Icon name="check_circle" class="mg-valid" /></Show>
          </span>
          <small classList={{ "mg-error": !!nameProblem() }}>{nameProblem() || t("mgmt.createChannel.nameHint")}</small>
        </label>

        <fieldset class="mg-block mg-visibility">
          <legend class="mg-label">{t("mgmt.createChannel.visibility")}</legend>
          <Radio name="visibility" value="public" checked={visibility() === "public"} onChange={() => setVisibility("public")}>
            <span class="mg-option"><Icon name="public" /><strong>{t("mgmt.createChannel.public")}</strong><small>{t("mgmt.createChannel.publicText")}</small></span>
          </Radio>
          <Radio name="visibility" value="private" checked={visibility() === "private"} onChange={() => setVisibility("private")}>
            <span class="mg-option"><Icon name="lock" /><strong>{t("mgmt.createChannel.private")}</strong><small>{t("mgmt.createChannel.privateText")}</small></span>
          </Radio>
          <label class="choice mg-listed" classList={{ off: visibility() === "private" }}>
            <input type="checkbox" checked={listed()} disabled={visibility() === "private"} onChange={(event) => setListed(event.currentTarget.checked)} />
            <span>{t("mgmt.createChannel.listed")}</span>
          </label>
        </fieldset>

        <Show when={voice()}>
          <KeyCustody
            icon="shield_lock"
            title={t("mgmt.createChannel.custodyTitle")}
            text={t("mgmt.createChannel.custodyText")}
            value={channelKeyDisplay(key())}
            copyLabel={t("mgmt.copy")}
            acknowledged={acknowledged()}
            onAcknowledge={setAcknowledged}
            acknowledgement={t("mgmt.createChannel.custody")}
          />
        </Show>

        <Show when={error()}>
          <p class="mg-error" role="alert">{error()}</p>
        </Show>
        <footer class="mg-actions">
          <Button variant="icon" class="mg-cancel" onClick={props.onClose}>{t("mgmt.cancel")}</Button>
          <Button variant="primary" type="submit" disabled={!ready()}>{t("mgmt.createChannel.submit")}</Button>
        </footer>
      </form>
    </Dialog>
  );
}
