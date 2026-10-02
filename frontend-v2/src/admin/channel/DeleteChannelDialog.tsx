import { Show, createEffect, createSignal } from "solid-js";
import { errorText } from "../../lib/errors";
import { t } from "../../i18n";
import { Button, Dialog, Icon } from "../../components/ui";
import { ApiError, channels, type Channel } from "../../api";

// Deleting a channel is permanent, so the button only works once its exact name has been typed.
// The backend refuses to delete the last text or voice channel of a server (409); that is explained.
export function DeleteChannelDialog(props: {
  open: boolean;
  channel: Channel;
  onClose: () => void;
  onDeleted: (channelId: string) => void;
}) {
  const [typed, setTyped] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal("");

  createEffect(() => {
    if (!props.open) return;
    setTyped("");
    setError("");
    setBusy(false);
  });

  const matches = () => typed() === props.channel.name;

  async function remove(event: Event) {
    event.preventDefault();
    if (!matches() || busy()) return;
    setBusy(true);
    setError("");
    try {
      await channels.remove(props.channel.id);
      props.onDeleted(props.channel.id);
    } catch (failure) {
      const lastOfType = failure instanceof ApiError && (failure.status === 409 || failure.code === "last_channel_of_type");
      setError(lastOfType ? t("mgmt.channel.delete.lastOfType") : errorText(failure, "mgmt.error"));
      setBusy(false);
    }
  }

  return (
    <Dialog open={props.open} title={t("mgmt.channel.delete.title")} onClose={props.onClose} accent wide eyebrow={t("mgmt.channel.delete.eyebrow")} icon="delete_forever">
      <form class="mg-form mg-delete" onSubmit={remove}>
        <p class="mg-lead">{t("mgmt.channel.delete.lead")}</p>
        <div class="mg-card compact mg-delete-card">
          <Icon name={props.channel.type === "text" ? "tag" : "volume_up"} />
          <strong>{props.channel.name}</strong>
          <Show when={props.channel.visibility === "private"}><Icon name="lock" /></Show>
        </div>
        <section class="mg-card compact danger mg-tip">
          <Icon name="warning" />
          <div><h3>{t("mgmt.channel.delete.warnTitle")}</h3><p>{t("mgmt.channel.delete.warn")}</p></div>
        </section>
        <label class="mg-block">
          <span class="mg-label">{t("mgmt.channel.delete.confirmLabel")}</span>
          <span class="mg-input-row" classList={{ invalid: typed() !== "" && !matches() }}>
            <input value={typed()} placeholder={props.channel.name} autocomplete="off" spellcheck={false} onInput={(event) => setTyped(event.currentTarget.value)} data-autofocus />
            <Show when={matches()}><span class="mg-valid mg-match"><Icon name="check_circle" />{t("mgmt.channel.delete.match")}</span></Show>
          </span>
        </label>
        <Show when={error()}><p class="mg-error" role="alert">{error()}</p></Show>
        <footer class="mg-actions">
          <Button variant="icon" class="mg-cancel" onClick={props.onClose}>{t("mgmt.channel.delete.cancel")}</Button>
          <Button variant="danger" type="submit" disabled={!matches() || busy()}>
            <Icon name="delete_forever" />{busy() ? t("mgmt.channel.delete.busy") : t("mgmt.channel.delete.submit")}
          </Button>
        </footer>
      </form>
    </Dialog>
  );
}
