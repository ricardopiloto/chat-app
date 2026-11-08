import { Show, createResource, createSignal, onCleanup } from "solid-js";
import { channels, webhooks, avatarUrl, useAuthedSrc, ApiError, type Channel, type ChannelWebhookSecret } from "../../api";
import { MAX_IMAGE_BYTES, PROFILE_IMAGE_MEDIA_TYPES } from "../../api/limits";
import { inviteLinkOrigin } from "../../api/instance";
import { Avatar, Badge, Button, Checkbox, Icon } from "../../components/ui";
import { t } from "../../i18n";
import { createCopy } from "../../lib/copy";
import { errorText } from "../../lib/errors";

export function WebhookPanel(props: { channel: Channel; onClose: () => void; onChanged: (channel: Channel) => void }) {
  const [webhook, { refetch, mutate }] = createResource(() => props.channel.id, webhooks.get);
  const [consent, setConsent] = createSignal(false);
  const [name, setName] = createSignal("");
  const [editName, setEditName] = createSignal("");
  const [secret, setSecret] = createSignal<ChannelWebhookSecret | null>(null);
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal("");
  const [armed, setArmed] = createSignal(false);
  const [revision, setRevision] = createSignal(0);
  const avatarSrc = useAuthedSrc(() => webhook()?.has_avatar ? `${avatarUrl(webhook()!.account_id)}?v=${revision()}` : undefined);
  let disarm: number | undefined;
  onCleanup(() => window.clearTimeout(disarm));
  const { copied, copy } = createCopy();

  const url = () => {
    const value = secret();
    const origin = inviteLinkOrigin();
    return value && origin ? `${origin}/api/webhooks/${value.webhook.id}/${value.token}` : "";
  };
  async function updateChannel() {
    try { props.onChanged(await channels.get(props.channel.id)); } catch { /* list refreshes on navigation */ }
  }
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try { await action(); } catch (failure) { setError(errorText(failure)); } finally { setBusy(false); }
  }
  async function activate() {
    if (!consent()) return;
    setBusy(true);
    setError("");
    try {
      const result = await webhooks.createOrReactivate(props.channel.id, {
        consent_cleartext: consent(),
        ...(name().trim() ? { display_name: name().trim() } : {}),
      });
      setSecret(result);
      setConsent(false);
      setName("");
      await updateChannel();
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 409 && failure.code === "webhook_already_active") {
        await refetch();
      } else setError(errorText(failure));
    } finally { setBusy(false); }
  }
  function dismissSecret() {
    setSecret(null);
    void refetch();
  }
  async function pickPhoto(file: File | undefined) {
    const current = webhook();
    if (!file || !current) return;
    if (!PROFILE_IMAGE_MEDIA_TYPES.has(file.type)) return setError(t("mgmt.channel.webhook.photoType"));
    if (file.size > MAX_IMAGE_BYTES) return setError(t("mgmt.channel.webhook.photoSize"));
    await run(async () => {
      mutate(await webhooks.uploadAvatar(props.channel.id, current.id, file, file.type));
      setRevision((n) => n + 1);
    });
  }

  return <>
    <div class="mg-panel-body">
      <Show when={webhook.loading}><p class="mg-muted">{t("mgmt.channel.webhook.loading")}</p></Show>
      <Show when={webhook.error}><p role="alert">{errorText(webhook.error)}</p></Show>
      <Show when={secret()}>
        <section class="mg-card compact">
          <h3 class="mg-card-title"><Icon name="shield_lock" />{t("mgmt.channel.webhook.title")}</h3>
          <Badge tone="danger" icon="warning">{t("mgmt.channel.webhook.once")}</Badge>
          <p class="mg-note"><Icon name="info" />{t("mgmt.channel.webhook.onceHint")}</p>
          <div class="mg-block">
            <span class="mg-label">{t("mgmt.channel.webhook.url")}</span>
            <div class="mg-key-row">
              <code>{url()}</code>
              <button type="button" disabled={!url()} onClick={() => void copy(url())}><Icon name={copied() ? "check" : "content_copy"} />{copied() ? t("mgmt.copied") : t("mgmt.copy")}</button>
            </div>
          </div>
          <div class="mg-block">
            <span class="mg-label">{t("mgmt.channel.webhook.token")}</span>
            <div class="mg-key-row">
              <code>{secret()?.token ?? ""}</code>
              <button type="button" onClick={() => void copy(secret()?.token ?? "")}><Icon name={copied() ? "check" : "content_copy"} />{copied() ? t("mgmt.copied") : t("mgmt.copy")}</button>
            </div>
          </div>
          <Button onClick={dismissSecret}>{t("mgmt.channel.webhook.done")}</Button>
        </section>
      </Show>
      <Show when={!secret() && !webhook.loading && !webhook.error}>
        <Show when={!webhook() || webhook()?.revoked_at} fallback={
          <section class="mg-card compact">
            <h3 class="mg-card-title"><Icon name="webhook" />{t("mgmt.channel.webhook.titleActive")}</h3>
            <Badge tone="secure" icon="webhook">{t("mgmt.channel.webhook.active")}</Badge>
            <label class="mg-field"><span class="mg-label">{t("mgmt.channel.webhook.name")}</span><input value={editName() || webhook()?.display_name || ""} onInput={(e) => setEditName(e.currentTarget.value)} /></label>
            <Button disabled={busy() || !editName().trim()} onClick={() => void run(async () => {
              const current = webhook()!;
              mutate(await webhooks.rename(props.channel.id, current.id, editName().trim()));
              setEditName("");
            })}>{t("mgmt.channel.webhook.rename")}</Button>
            <div class="mg-key-row">
              <Avatar name={webhook()?.display_name ?? ""} src={avatarSrc()} />
              <small class="mg-muted">{webhook()?.has_avatar ? t("mgmt.channel.webhook.hasAvatar") : t("mgmt.channel.webhook.noAvatar")}</small>
              <label class="ui-button primary cursor-pointer"><Icon name="upload" />{t("mgmt.channel.webhook.avatar")}<input type="file" class="sr-only" accept={[...PROFILE_IMAGE_MEDIA_TYPES].join(",")} disabled={busy()} onChange={(e) => { void pickPhoto(e.currentTarget.files?.[0]); e.currentTarget.value = ""; }} /></label>
            </div>
            <Button disabled={busy()} onClick={() => void run(async () => { setSecret(await webhooks.rotate(props.channel.id, webhook()!.id)); })}>{t("mgmt.channel.webhook.rotate")}</Button>
            <p class="mg-note"><Icon name="info" />{t("mgmt.channel.webhook.revokeHint")}</p>
            <Button variant="danger" disabled={busy()} onClick={() => {
              if (!armed()) { setArmed(true); window.clearTimeout(disarm); disarm = window.setTimeout(() => setArmed(false), 3000); return; }
              window.clearTimeout(disarm);
              setArmed(false);
              void run(async () => { await webhooks.revoke(props.channel.id, webhook()!.id); await refetch(); await updateChannel(); });
            }}>{armed() ? t("mgmt.channel.webhook.confirmRevoke") : t("mgmt.channel.webhook.revoke")}</Button>
          </section>
        }>
          <section class="mg-card compact">
            <h3 class="mg-card-title"><Icon name="webhook" />{t("mgmt.channel.webhook.titleSetup")}</h3>
            <Show when={webhook()?.revoked_at}><Badge tone="neutral">{t("mgmt.channel.webhook.revoked")}</Badge></Show>
            <p>{t("mgmt.channel.webhook.intro")}</p>
            <p>{t("mgmt.channel.webhook.cleartextNotice")}</p>
            <label class="mg-field"><span class="mg-label">{t("mgmt.channel.webhook.nameOptional")}</span><input value={name()} onInput={(e) => setName(e.currentTarget.value)} /></label>
            <Checkbox checked={consent()} onChange={(e) => setConsent(e.currentTarget.checked)}>{t("mgmt.channel.webhook.consent")}</Checkbox>
            <Button variant="primary" disabled={busy() || !consent()} onClick={() => void activate()}>{webhook() ? t("mgmt.channel.webhook.reactivate") : t("mgmt.channel.webhook.activate")}</Button>
          </section>
        </Show>
      </Show>
      <Show when={error()}><p class="mg-error" role="alert">{error()}</p></Show>
    </div>
    <footer class="mg-panel-foot"><Button variant="icon" class="mg-cancel" onClick={props.onClose}>{t("mgmt.close")}</Button></footer>
  </>;
}
