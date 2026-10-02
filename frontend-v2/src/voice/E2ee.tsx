// End-to-end encryption of a voice channel, as the call shows it: a chip that is always there, a
// banner that stays for as long as encryption is off (never a one-off toast), and the dialog that turns
// it back on. Turning it back on needs the channel key: the one already on this device, or one pasted.
import { Show, createEffect, createSignal } from "solid-js";
import { Badge, Button, Dialog, Icon, TextField } from "../components/ui";
import { voice as voiceApi, type Channel } from "../api";
import { forgetChannelKey, loadChannelKey, parseChannelKeyInput, rememberChannelKey, unsealChannelKey } from "../crypto/channelKey";
import { errorText } from "../lib/errors";
import { publicDisplayLabel } from "../lib/displayName";
import { getLocale, t } from "../i18n";
import { useShell } from "../shell/state";
import { useSession } from "../session/session";
import { e2eeChangeFor } from "./e2eeState";

export function E2eeChip(props: { enabled: boolean }) {
  return (
    <Badge tone={props.enabled ? "secure" : "danger"} mono icon={props.enabled ? "verified_user" : "lock_open"}>
      {props.enabled ? t("call.e2ee.on") : t("call.e2ee.off")}
    </Badge>
  );
}

export function E2eeOffBanner(props: { channel: Channel }) {
  const shell = useShell();
  const [reenabling, setReenabling] = createSignal(false);
  const change = () => e2eeChangeFor(props.channel.id);
  const who = () => {
    const id = change()?.actorId;
    const member = id ? shell.members.data?.find((m) => m.account_id === id) : undefined;
    return member ? publicDisplayLabel(member.handle, member.display_name) : null;
  };
  const when = () => {
    const at = change()?.at;
    return at ? new Date(at).toLocaleString(getLocale(), { dateStyle: "short", timeStyle: "short" }) : null;
  };
  // The backend only lets the server owner flip it, and only for channels that have a channel key.
  const canReenable = () => shell.owner() && props.channel.has_channel_key;

  return (
    <div class="call-e2ee-banner" role="status" aria-live="polite">
      <Icon name="lock_open" class="text-[20px]" />
      <div class="call-e2ee-text">
        <strong>{t("call.e2ee.offTitle")}</strong>
        <span>
          <Show when={who() && when()} fallback={t("call.e2ee.offUnknown")}>
            {t("call.e2ee.offBy", { who: who()!, when: when()! })}
          </Show>
        </span>
      </div>
      <Show when={canReenable()}>
        <Button variant="secondary" onClick={() => setReenabling(true)}>{t("call.e2ee.reenable")}</Button>
      </Show>
      <ReenableDialog channel={props.channel} open={reenabling()} onClose={() => setReenabling(false)} />
    </div>
  );
}

const sameBytes = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((byte, i) => byte === b[i]);

function ReenableDialog(props: { channel: Channel; open: boolean; onClose: () => void }) {
  const session = useSession();
  const [pasted, setPasted] = createSignal("");
  const [problem, setProblem] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  const [stored, setStored] = createSignal(loadChannelKey(props.channel.id));
  const onDevice = () => stored();
  // The key on this device can change while the banner stays mounted, so look again whenever the dialog opens.
  createEffect(() => {
    if (props.open) setStored(loadChannelKey(props.channel.id));
  });

  const close = () => {
    setPasted("");
    setProblem("");
    props.onClose();
  };

  async function confirm() {
    setProblem("");
    // With the key on this device there is nothing to type; otherwise it must be a well-formed key.
    const key = onDevice() ?? parseChannelKeyInput(pasted());
    if (!key) return setProblem(t("call.e2ee.keyInvalid"));
    setBusy(true);
    try {
      // The server keeps the key sealed to its custodian: a pasted key is only accepted when it is that key.
      const identity = session.identity();
      if (!identity) return setProblem(t("call.e2ee.keyWrong"));
      const { channel_key_sealed } = await voiceApi.channelKey(props.channel.id);
      const expected = unsealChannelKey(channel_key_sealed, identity);
      if (!expected || !sameBytes(expected, key)) {
        // A stale key left on this device would otherwise hide the field for pasting the right one.
        if (onDevice()) {
          forgetChannelKey(props.channel.id);
          setStored(null);
        }
        return setProblem(t("call.e2ee.keyWrong"));
      }
      await voiceApi.setE2ee(props.channel.id, true, "reenable");
      rememberChannelKey(props.channel.id, key);
      close();
    } catch (error) {
      setProblem(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={props.open} title={t("call.e2ee.reenableTitle")} icon="lock" accent onClose={close}>
      <p>{onDevice() ? t("call.e2ee.reenableHaveKey") : t("call.e2ee.reenableNeedKey")}</p>
      <Show when={!onDevice()}>
        <TextField label={t("call.e2ee.keyLabel")} value={pasted()} placeholder="base64" error={problem()} onInput={(e) => setPasted(e.currentTarget.value)} />
      </Show>
      <Show when={onDevice() && problem()}>
        <p class="field-error" role="alert">{problem()}</p>
      </Show>
      <footer class="dialog-actions call-dialog-actions">
        <Button variant="secondary" onClick={close}>{t("call.cancel")}</Button>
        <Button variant="primary" disabled={busy() || (!onDevice() && !pasted().trim())} onClick={() => void confirm()}>{t("call.e2ee.reenable")}</Button>
      </footer>
    </Dialog>
  );
}
