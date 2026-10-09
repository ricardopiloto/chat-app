import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import { createQuery, useQueryClient } from "@tanstack/solid-query";
import { PageHead } from "./PageHead";
import { useShell } from "../../shell/state";
import { createToast } from "../../lib/toast";
import { errorText } from "../../lib/errors";
import { t } from "../../i18n";
import { Button, Icon, Toast } from "../../components/ui";
import { queryKeys, servers, useAuthedSrc, type Server } from "../../api";
import { MAX_IMAGE_BYTES, PROFILE_IMAGE_MEDIA_TYPES } from "../../api/limits";

const NAME_MAX = 32;

const kib = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

function ImageCard(props: { server: Server }) {
  const shell = useShell();
  const toast = createToast();
  const [version, setVersion] = createSignal(0);
  const [picked, setPicked] = createSignal<{ name: string; size: number } | null>(null);
  const [problem, setProblem] = createSignal("");
  const [busy, setBusy] = createSignal(false);

  const src = useAuthedSrc(() => (props.server.has_image ? `${servers.imageUrl(props.server.id)}?v=${version()}` : undefined));

  async function change(file: File | undefined) {
    if (!file) return;
    setProblem("");
    if (!PROFILE_IMAGE_MEDIA_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES) {
      setProblem(t("mgmt.overview.imageError"));
      return;
    }
    setBusy(true);
    try {
      await servers.setImage(props.server.id, file, file.type);
      setPicked({ name: file.name, size: file.size });
      setVersion((n) => n + 1);
      await shell.refreshServers();
    } catch (failure) {
      setProblem(errorText(failure, "mgmt.overview.imageFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setProblem("");
    try {
      await servers.removeImage(props.server.id);
      setPicked(null);
      setVersion((n) => n + 1);
      await shell.refreshServers();
    } catch (failure) {
      setProblem(errorText(failure, "mgmt.overview.imageFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section class="mg-card">
      <p class="mg-card-eyebrow"><Icon name="badge" />{t("mgmt.overview.imageEyebrow")}</p>
      <h2>{t("mgmt.overview.imageTitle")}</h2>
      <p class="mg-muted">{t("mgmt.overview.imageText")}</p>

      <div class="mg-image-box">
        <span class="mg-image-preview">
          <Show when={src()} fallback={<b>{props.server.name.slice(0, 2).toUpperCase()}</b>}>
            <img src={src()} alt="" />
          </Show>
          <Show when={picked()}><Icon name="check_circle" filled class="mg-image-ok" /></Show>
        </span>
        <div class="mg-image-info">
          <strong>{picked()?.name ?? (props.server.has_image ? t("mgmt.overview.imageCurrent") : t("mgmt.overview.imageNone"))}</strong>
          <Show when={picked()}>
            {(file) => <span class="mg-chip-line"><span class="mg-pill secure">{kib(file().size)}</span><span class="mg-muted">{t("mgmt.overview.imageValid")}</span></span>}
          </Show>
          <div class="mg-row">
            <label class="ui-button primary mg-file" aria-disabled={busy()}>
              <Icon name="upload" />{t("mgmt.overview.imageChange")}
              <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy()} onChange={(event) => { void change(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
            </label>
            <Show when={props.server.has_image}>
              <Button onClick={() => void remove()} disabled={busy()}><Icon name="delete" />{t("mgmt.overview.imageRemove")}</Button>
            </Show>
          </div>
        </div>
      </div>
      <Show when={problem()}><p class="mg-error" role="alert">{problem()}</p></Show>

      <div class="mg-field">
        <span class="mg-label">{t("mgmt.overview.nameLabel")}<output>{t("mgmt.overview.nameCount", { count: props.server.name.length, max: NAME_MAX })}</output></span>
        <p class="mg-readonly">{props.server.name}</p>
      </div>
      <Toast show={!!toast.message()} message={toast.message()} />
    </section>
  );
}

function WelcomeCard(props: { server: Server }) {
  const shell = useShell();
  const cache = useQueryClient();
  const toast = createToast();
  const welcome = createQuery(() => ({ queryKey: queryKeys.welcome(props.server.id), queryFn: () => servers.welcome(props.server.id) }));
  const [busy, setBusy] = createSignal(false);
  const [template, setTemplate] = createSignal("");
  const [preview, setPreview] = createSignal(false);
  const [channelId, setChannelId] = createSignal("");
  const [error, setError] = createSignal("");

  // The draft starts from the saved settings once per server; later refetches must not overwrite what is being typed.
  let seeded = "";
  createEffect(() => {
    const data = welcome.data;
    if (!data || seeded === props.server.id) return;
    seeded = props.server.id;
    setChannelId(data.welcome_channel_id ?? "");
    setTemplate(data.welcome_message_template ?? "");
  });

  const textChannels = createMemo(() => (shell.channels.data ?? []).filter((c) => c.type === "text"));
  const rendered = () => template().replaceAll("{nome}", shell.members.data?.find((m) => m.account_id === shell.meId())?.handle ?? "alguém");

  async function save() {
    setBusy(true);
    setError("");
    try {
      await servers.updateWelcome(props.server.id, { welcome_channel_id: channelId() || null, welcome_message_template: template().trim() || null });
      await cache.invalidateQueries({ queryKey: queryKeys.welcome(props.server.id) });
      toast.flash(t("mgmt.overview.welcomeSaved"));
    } catch (failure) {
      setError(errorText(failure, "mgmt.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section class="mg-card" id="mg-welcome">
      <p class="mg-card-eyebrow"><Icon name="celebration" />{t("mgmt.overview.welcomeEyebrow")}</p>
      <h2>{t("mgmt.overview.welcomeTitle")}</h2>
      <p class="mg-muted">{t("mgmt.overview.welcomeText")}</p>

      <label class="mg-field">
        <span class="mg-label">{t("mgmt.overview.welcomeChannel")}</span>
        <select value={channelId()} onChange={(event) => setChannelId(event.currentTarget.value)}>
          <option value="">{t("mgmt.overview.welcomeChannelNone")}</option>
          <For each={textChannels()}>{(channel) => <option value={channel.id} selected={channel.id === channelId()}># {channel.name}</option>}</For>
        </select>
      </label>

      <label class="mg-field">
        <span class="mg-label">{t("mgmt.overview.welcomeTemplate")}</span>
        <textarea rows="4" value={template()} placeholder={t("mgmt.overview.welcomeTemplatePlaceholder")} onInput={(event) => setTemplate(event.currentTarget.value)} />
      </label>
      <p class="mg-tokens">{t("mgmt.overview.welcomeTokens")} <code>{"{nome}"}</code></p>

      <Show when={preview()}>
        <div class="mg-preview" role="note">
          <span class="mg-label">{t("mgmt.overview.welcomePreviewTitle")}</span>
          <p>{rendered() || "…"}</p>
        </div>
      </Show>
      <Show when={error()}><p class="mg-error" role="alert">{error()}</p></Show>
      <div class="mg-row end">
        <Button onClick={() => setPreview((on) => !on)}>{t("mgmt.overview.welcomePreview")}</Button>
        <Button variant="primary" onClick={() => void save()} disabled={busy()}>{t("mgmt.overview.welcomeSave")}</Button>
      </div>
      <Toast show={!!toast.message()} message={toast.message()} />
    </section>
  );
}

function DangerCard(props: { server: Server }) {
  const shell = useShell();
  const [typed, setTyped] = createSignal("");
  const [error, setError] = createSignal("");
  const [busy, setBusy] = createSignal(false);

  async function destroy() {
    setBusy(true);
    setError("");
    try {
      await servers.remove(props.server.id);
      await shell.refreshServers();
      shell.go("/");
    } catch (failure) {
      setError(errorText(failure, "mgmt.error"));
      setBusy(false);
    }
  }

  return (
    <section class="mg-card danger" id="mg-danger">
      <p class="mg-card-eyebrow"><Icon name="warning" />{t("mgmt.overview.dangerEyebrow")}</p>
      <h2>{t("mgmt.overview.dangerTitle")}</h2>
      <p class="mg-muted">{t("mgmt.overview.dangerText", { server: props.server.name })}</p>
      <label class="mg-field">
        <span class="mg-label">{t("mgmt.overview.dangerConfirm")}</span>
        <input value={typed()} placeholder={props.server.name} autocomplete="off" onInput={(event) => setTyped(event.currentTarget.value)} />
      </label>
      <Show when={error()}><p class="mg-error" role="alert">{error()}</p></Show>
      <div class="mg-row spread">
        <span class="mg-muted mg-hint"><Icon name="shield" />{t("mgmt.overview.dangerHint")}</span>
        <Button variant="danger" onClick={() => void destroy()} disabled={typed() !== props.server.name || busy()}>
          <Icon name="delete_forever" />{t("mgmt.overview.dangerButton")}
        </Button>
      </div>
    </section>
  );
}

// The landing page of the settings: image and name, welcome message, and deleting the server.
export function Overview(props: { server: Server }) {
  return (
    <div class="mg-page">
      <PageHead
        crumb={`${t("mgmt.settings.crumb", { server: props.server.name.toUpperCase() })} / ${t("mgmt.settings.crumbOwner").toUpperCase()}`}
        title={t("mgmt.settings.overviewTitle")}
        owner
      />
      <div class="mg-columns">
        <div class="mg-stack"><ImageCard server={props.server} /></div>
        <div class="mg-stack">
          <WelcomeCard server={props.server} />
          <DangerCard server={props.server} />
        </div>
      </div>
    </div>
  );
}
