import { For, Show, createEffect, createSignal } from "solid-js";
import { errorText } from "../lib/errors";
import { createCopy } from "../lib/copy";
import { t } from "../i18n";
import { Badge, Button, Dialog, Icon, Radio, Switch } from "../components/ui";
import { channels as channelsApi, invites, servers, type Channel } from "../api";

type Step = "loading" | "channel" | "link";

// Invite creation in two steps: pick the welcome channel (skipped when the server already has one),
// then show the link to copy. Opening the dialog always starts a fresh run.
export function InviteDialog(props: { open: boolean; serverId: string; onClose: () => void }) {
  const [step, setStep] = createSignal<Step>("loading");
  const [textChannels, setTextChannels] = createSignal<Channel[]>([]);
  const [welcomeId, setWelcomeId] = createSignal("");
  const [history, setHistory] = createSignal(true);
  const [destination, setDestination] = createSignal("");
  const [url, setUrl] = createSignal("");
  const [error, setError] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  const { copied, copy } = createCopy();

  async function generate(welcomeChannelId?: string) {
    setBusy(true);
    setError("");
    try {
      const invite = await invites.create(props.serverId, {
        include_history: history(),
        ...(welcomeChannelId ? { welcome_channel_id: welcomeChannelId } : {}),
      });
      const target = textChannels().find((c) => c.id === (welcomeChannelId ?? invite.welcome_channel_id));
      setDestination(target?.name ?? textChannels().find((c) => c.name === "geral")?.name ?? "");
      setUrl(`${location.origin}/invite/${invite.code}`);
      setStep("link");
    } catch (failure) {
      setError(errorText(failure, "mgmt.error"));
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    setStep("loading");
    setError("");
    setUrl("");
    setHistory(true);
    try {
      const text = (await channelsApi.listForServer(props.serverId)).filter((c) => c.type === "text");
      setTextChannels(text);
      const preferred = text.find((c) => c.name === "geral") ?? text[0];
      setWelcomeId(preferred?.id ?? "");
      // The server already has somewhere to greet newcomers: #geral exists or a channel was configured.
      const configured = text.some((c) => c.name === "geral") || !!(await servers.welcome(props.serverId).catch(() => undefined))?.welcome_channel_id;
      if (configured) await generate();
      else setStep("channel");
    } catch (failure) {
      setError(errorText(failure, "mgmt.error"));
      setStep("channel");
    }
  }

  createEffect(() => {
    if (props.open) void start();
  });

  const stepNumber = () => (step() === "link" ? 2 : 1);

  return (
    <Dialog open={props.open} title={t("mgmt.invite.title")} onClose={props.onClose} accent wide eyebrow={t("mgmt.invite.eyebrow")} icon="person_add">
      <div class="mg-form">
        <ol class="mg-steps" aria-label={t("mgmt.invite.steps")}>
          <li classList={{ active: stepNumber() === 1, done: stepNumber() > 1 }} aria-current={stepNumber() === 1 ? "step" : undefined}>
            <b>01</b>{t("mgmt.invite.stepChannel")}
          </li>
          <Icon name="arrow_forward" />
          <li classList={{ active: stepNumber() === 2 }} aria-current={stepNumber() === 2 ? "step" : undefined}>
            <b>02</b>{t("mgmt.invite.stepLink")}
          </li>
        </ol>

        <Show when={step() === "loading"}>
          <p class="mg-muted">{t("mgmt.invite.loading")}</p>
        </Show>

        <Show when={step() === "channel"}>
          <section class="mg-card compact mg-tip">
            <Icon name="lightbulb" />
            <div>
              <h3>{t("mgmt.invite.initialTitle")}</h3>
              <p>{t("mgmt.invite.initialText")}</p>
            </div>
          </section>

          <fieldset class="mg-block mg-visibility">
            <legend class="mg-label">{t("mgmt.invite.channels")}</legend>
            <For each={textChannels()}>
              {(channel) => (
                <Radio name="welcome-channel" value={channel.id} checked={welcomeId() === channel.id} onChange={() => setWelcomeId(channel.id)}>
                  <span class="mg-option">
                    <Icon name="tag" />
                    <span class="mg-option-title">
                      <strong>{channel.name}</strong>
                      <Show when={channel.name === "geral"}><Badge tone="secure" mono>{t("mgmt.invite.mainChannel")}</Badge></Show>
                      <Badge tone="neutral" mono icon={channel.visibility === "private" ? "lock" : "public"}>
                        {t(channel.visibility === "private" ? "mgmt.createChannel.private" : "mgmt.createChannel.public")}
                      </Badge>
                    </span>
                    <small>{channel.name === "geral" ? t("mgmt.invite.mainChannelText") : t("mgmt.invite.otherChannelText")}</small>
                  </span>
                </Radio>
              )}
            </For>
          </fieldset>

          <section class="mg-card compact mg-history">
            <Icon name="history" />
            <div>
              <strong>{t("mgmt.invite.history")}</strong>
              <small>{t("mgmt.invite.historyText")}</small>
            </div>
            <Switch label={t("mgmt.invite.history")} checked={history()} onChange={(event) => setHistory(event.currentTarget.checked)} />
          </section>

          <Show when={error()}><p class="mg-error" role="alert">{error()}</p></Show>
          <footer class="mg-actions">
            <Button variant="icon" class="mg-cancel" onClick={props.onClose}>{t("mgmt.cancel")}</Button>
            <Button variant="primary" disabled={!welcomeId() || busy()} onClick={() => void generate(welcomeId())}>
              {t("mgmt.invite.advance")}<Icon name="arrow_forward" />
            </Button>
          </footer>
        </Show>

        <Show when={step() === "link"}>
          <Show when={destination()}>
            <p class="mg-destination"><Icon name="login" />{t("mgmt.invite.destination")}<b>#{destination()}</b></p>
          </Show>
          <p class="mg-lead">{t("mgmt.invite.ready")}</p>
          <div class="mg-block">
            <span class="mg-label">{t("mgmt.invite.address")}</span>
            <div class="mg-key-row mg-invite-link">
              <code data-testid="invite-url">{url()}</code>
              <button type="button" classList={{ copied: copied() }} onClick={() => void copy(url())}>
                <Icon name={copied() ? "check" : "content_copy"} />
                {copied() ? t("mgmt.invite.copied") : t("mgmt.copy")}
              </button>
            </div>
          </div>
          <section class="mg-card compact mg-tip">
            <Icon name="shield_lock" />
            <div>
              <h3>{t("mgmt.invite.custodyTitle")}</h3>
              <p>{t("mgmt.invite.custodyText")}</p>
            </div>
          </section>
          <footer class="mg-actions">
            <Button variant="icon" class="mg-cancel" disabled={busy()} onClick={() => void start()}>
              <Icon name="refresh" />{t("mgmt.invite.another")}
            </Button>
            <Button variant="primary" onClick={props.onClose}>{t("mgmt.invite.done")}<Icon name="done_all" /></Button>
          </footer>
        </Show>
      </div>
    </Dialog>
  );
}
