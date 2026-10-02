import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { errorText } from "../../lib/errors";
import { publicDisplayLabel } from "../../lib/displayName";
import { t } from "../../i18n";
import { Avatar, Badge, Button, Dialog, Icon } from "../../components/ui";
import { avatarUrl, mutes, type Member, type Mute } from "../../api";

// The durations the application has always offered; "custom" takes any whole number of minutes.
export const MUTE_PRESETS = [5, 10, 15, 30] as const;

export function remainingLabel(endsAt: string, now = Date.now()): string {
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return t("mgmt.channel.mute.expired");
  const minutes = Math.ceil(ms / 60_000);
  if (minutes < 60) return t("mgmt.channel.mute.remainingMins", { n: minutes });
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? t("mgmt.channel.mute.remainingHoursMins", { h, m }) : t("mgmt.channel.mute.remainingHours", { h });
}

// One component for the whole life of a mute: a member that is not muted gets the duration picker,
// a muted member gets the time left and the way to lift it before the end.
export function MuteMemberDialog(props: {
  open: boolean;
  channelId: string;
  member: Member | null;
  mute: Mute | undefined;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [minutes, setMinutes] = createSignal<number>(MUTE_PRESETS[0]);
  const [custom, setCustom] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal("");
  const [now, setNow] = createSignal(Date.now());

  createEffect(() => {
    if (!props.open) return;
    setMinutes(MUTE_PRESETS[0]);
    setCustom("");
    setError("");
    setBusy(false);
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    onCleanup(() => window.clearInterval(timer));
  });

  const muted = () => (props.mute && new Date(props.mute.ends_at).getTime() > now() ? props.mute : undefined);
  const chosen = () => (custom() !== "" ? Math.floor(Number(custom())) : minutes());
  const valid = () => Number.isFinite(chosen()) && chosen() >= 1;
  const expires = () => new Date(now() + chosen() * 60_000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const name = () => (props.member ? publicDisplayLabel(props.member.handle, props.member.display_name) : "");

  async function run(action: () => Promise<unknown>) {
    if (busy()) return;
    setBusy(true);
    setError("");
    try {
      await action();
      props.onChanged();
      props.onClose();
    } catch (failure) {
      setError(errorText(failure, "mgmt.error"));
      setBusy(false);
    }
  }

  return (
    <Dialog open={props.open} title={t("mgmt.channel.mute.title")} onClose={props.onClose} accent wide eyebrow={t("mgmt.channel.mute.badge")} icon="volume_off">
      <Show when={props.member}>
        {(member) => (
          <div class="mg-form">
            <p class="mg-lead">{t("mgmt.channel.mute.lead")}</p>
            <div class="mg-card compact mg-mute-person">
              <Avatar name={name()} src={member().has_avatar ? avatarUrl(member().account_id) : undefined} size="lg" />
              <div>
                <strong>{name()}</strong>
                <small>@{member().handle}</small>
              </div>
              <Show when={muted()}>{(active) => <Badge tone="danger" mono icon="timer">{t("mgmt.channel.mute.activeNow", { remaining: remainingLabel(active().ends_at, now()) })}</Badge>}</Show>
            </div>

            <Show when={!muted()}>
              <div class="mg-block" role="group" aria-label={t("mgmt.channel.mute.duration")}>
                <span class="mg-label">{t("mgmt.channel.mute.duration")}<output>{valid() ? t("mgmt.channel.mute.expires", { time: expires() }) : ""}</output></span>
                <div class="mg-durations">
                  <For each={MUTE_PRESETS}>
                    {(preset) => (
                      <button type="button" aria-pressed={custom() === "" && minutes() === preset} classList={{ on: custom() === "" && minutes() === preset }} onClick={() => { setMinutes(preset); setCustom(""); }}>
                        {t("mgmt.channel.mute.minutes", { n: preset })}
                      </button>
                    )}
                  </For>
                  <input type="number" min="1" inputmode="numeric" aria-label={t("mgmt.channel.mute.customLabel")} placeholder={t("mgmt.channel.mute.custom")} value={custom()} onInput={(event) => setCustom(event.currentTarget.value)} />
                </div>
              </div>
              <section class="mg-card compact mg-tip">
                <Icon name="verified_user" />
                <div><h3>{t("mgmt.channel.mute.effects")}</h3><p>{t("mgmt.channel.mute.effectText")}</p></div>
              </section>
            </Show>

            <Show when={error()}><p class="mg-error" role="alert">{error()}</p></Show>
            <footer class="mg-actions">
              <Button variant="icon" class="mg-cancel" onClick={props.onClose}>{t("mgmt.cancel")}</Button>
              <Show
                when={muted()}
                fallback={
                  <Button variant="primary" disabled={!valid() || busy()} onClick={() => void run(() => mutes.set(props.channelId, member().account_id, chosen()))}>
                    <Icon name="timer" />{busy() ? t("mgmt.channel.mute.applying") : t("mgmt.channel.mute.confirm", { n: valid() ? chosen() : 0 })}
                  </Button>
                }
              >
                <Button variant="primary" disabled={busy()} onClick={() => void run(() => mutes.clear(props.channelId, member().account_id))}>
                  <Icon name="volume_up" />{t("mgmt.channel.mute.unmute")}
                </Button>
              </Show>
            </footer>
          </div>
        )}
      </Show>
    </Dialog>
  );
}
