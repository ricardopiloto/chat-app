import { For, Show, createResource, createSignal } from "solid-js";
import { useParams } from "@solidjs/router";
import {
  api,
  fetchServerWelcome,
  patchServerWelcome,
  type Channel,
} from "../api/client";
import { t } from "../i18n";
import { errorMessage } from "../lib/apiError";
import { showToast } from "../ui/toast";

export default function ServerWelcomePage() {
  const params = useParams<{ serverId: string }>();
  const [error, setError] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  const [channelId, setChannelId] = createSignal("");
  const [template, setTemplate] = createSignal("");

  const serverId = () => params.serverId!;

  const [channels] = createResource(serverId, async (id) => {
    const list = await api<Channel[]>(`/api/servers/${id}/channels`);
    return list.filter((c) => c.type === "text");
  });

  const [settings, { refetch }] = createResource(serverId, async (id) => {
    const s = await fetchServerWelcome(id);
    setChannelId(s.welcome_channel_id ?? "");
    setTemplate(s.welcome_message_template ?? "");
    return s;
  });

  async function onSave() {
    if (busy()) return;
    setBusy(true);
    setError("");
    try {
      const trimmed = template().trim();
      await patchServerWelcome(serverId(), {
        welcome_channel_id: channelId() || null,
        welcome_message_template: trimmed.length === 0 ? null : trimmed,
      });
      await refetch();
      showToast(t("settings.welcomeSaved"));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="server-welcome-page main" role="main">
      <header class="server-settings-page-header">
        <h1>{t("settings.welcomeTitle")}</h1>
        <p class="muted">{t("settings.welcomeHint")}</p>
      </header>
      <Show when={settings() && channels()} fallback={<p class="muted">{t("common.loading")}</p>}>
        <form
          class="server-welcome-form"
          onSubmit={(e) => {
            e.preventDefault();
            void onSave();
          }}
        >
          <label class="field">
            <span>{t("settings.welcomeChannel")}</span>
            <select
              class="input"
              value={channelId()}
              onChange={(e) => setChannelId(e.currentTarget.value)}
            >
              <option value="">{t("settings.welcomeChannelDefault")}</option>
              <For each={channels() ?? []}>
                {(c) => <option value={c.id}>#{c.name}</option>}
              </For>
            </select>
          </label>
          <label class="field">
            <span>{t("settings.welcomeTemplate")}</span>
            <textarea
              class="input"
              rows={3}
              value={template()}
              placeholder={t("settings.welcomeTemplatePlaceholder")}
              onInput={(e) => setTemplate(e.currentTarget.value)}
            />
          </label>
          <button type="submit" class="btn btn-primary" disabled={busy()}>
            {t("settings.welcomeSave")}
          </button>
        </form>
      </Show>
      <Show when={error()}>
        <p class="error" role="alert">
          {error()}
        </p>
      </Show>
    </div>
  );
}
