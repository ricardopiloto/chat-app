import { For, Show, createEffect, createSignal } from "solid-js";
import {
  api,
  createInvite,
  fetchServerWelcome,
  type Channel,
} from "../api/client";
import { Button, Dialog } from "../components/ui";
import { t } from "../i18n";
import { createCopy } from "../lib/copy";
import { errorText } from "../lib/errors";

/** Two-step invite creation: pick a welcome channel when needed, then show the copyable URL. */
export function InviteDialog(props: {
  open: boolean;
  serverId: string;
  onClose: () => void;
}) {
  const [step, setStep] = createSignal<"loading" | "channel" | "url">(
    "loading",
  );
  const [channels, setChannels] = createSignal<Channel[]>([]);
  const [welcomeId, setWelcomeId] = createSignal("");
  const [url, setUrl] = createSignal("");
  const [error, setError] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  const { copied, copy } = createCopy();

  async function generate(welcomeChannelId?: string) {
    setBusy(true);
    setError("");
    try {
      const invite = await createInvite(
        props.serverId,
        welcomeChannelId ? { welcome_channel_id: welcomeChannelId } : {},
      );
      setUrl(`${location.origin}/invite/${invite.code}`);
      setStep("url");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function start() {
    setStep("loading");
    setError("");
    setUrl("");
    try {
      const list = await api<Channel[]>(
        `/api/servers/${props.serverId}/channels`,
      );
      const text = list.filter((c) => c.type === "text");
      setChannels(text);
      setWelcomeId(text[0]?.id ?? "");
      let hasWelcome = text.some((c) => c.name === "geral");
      if (!hasWelcome) {
        try {
          hasWelcome = !!(await fetchServerWelcome(props.serverId))
            .welcome_channel_id;
        } catch {
          /* not the owner: backend decides */
        }
      }
      if (hasWelcome) await generate();
      else setStep("channel");
    } catch (err) {
      setError(errorText(err));
      setStep("channel");
    }
  }
  createEffect(() => {
    if (props.open) void start();
  });
  return (
    <Dialog
      open={props.open}
      title={t("admin.invite.title")}
      onClose={props.onClose}
    >
      <div class="admin-form">
        <Show when={step() === "loading"}>
          <p class="muted">{t("admin.loading")}</p>
        </Show>
        <Show when={step() === "channel"}>
          <p>{t("admin.invite.chooseChannel")}</p>
          <label class="field">
            <span>{t("admin.invite.welcomeChannel")}</span>
            <select
              value={welcomeId()}
              onChange={(e) => setWelcomeId(e.currentTarget.value)}
            >
              <For each={channels()}>
                {(c) => (
                  <option value={c.id} selected={c.id === welcomeId()}>
                    #{c.name}
                  </option>
                )}
              </For>
            </select>
          </label>
          <div class="dialog-actions">
            <Button onClick={props.onClose}>{t("admin.cancel")}</Button>
            <Button
              variant="primary"
              disabled={!welcomeId() || busy()}
              onClick={() => void generate(welcomeId())}
            >
              {t("admin.invite.create")}
            </Button>
          </div>
        </Show>
        <Show when={step() === "url"}>
          <p>{t("admin.invite.ready")}</p>
          <div class="key-row">
            <input
              class="invite-url"
              readonly
              aria-label={t("admin.invite.url")}
              value={url()}
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button variant="primary" onClick={() => void copy(url())}>
              {copied() ? t("admin.copied") : t("admin.copy")}
            </Button>
          </div>
          <div class="dialog-actions">
            <Button onClick={props.onClose}>{t("admin.close")}</Button>
          </div>
        </Show>
        <Show when={error()}>
          <p class="form-error" role="alert">
            {error()}
          </p>
        </Show>
      </div>
    </Dialog>
  );
}
