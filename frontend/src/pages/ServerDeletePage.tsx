import { Show, createResource, createSignal } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import { api, deleteServer, type Server } from "../api/client";
import { t } from "../i18n";
import { errorMessage } from "../lib/apiError";

export default function ServerDeletePage() {
  const params = useParams<{ serverId: string }>();
  const navigate = useNavigate();
  const [error, setError] = createSignal("");
  const [busy, setBusy] = createSignal(false);

  const serverId = () => params.serverId!;

  const [server] = createResource(serverId, async (id) => {
    const list = await api<Server[]>("/api/servers");
    return list.find((s) => s.id === id) ?? null;
  });

  async function onDelete() {
    const s = server();
    if (!s || busy()) return;
    if (!window.confirm(t("settings.deleteConfirm", { name: s.name }))) return;
    setBusy(true);
    setError("");
    try {
      await deleteServer(s.id);
      window.dispatchEvent(new CustomEvent("mesa:servers-refresh"));
      navigate("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="server-delete-page main" role="main">
      <header class="server-settings-page-header">
        <h1>{t("settings.deleteServer")}</h1>
        <p class="muted">{t("settings.deleteBody")}</p>
      </header>
      <Show when={server()}>
        {(s) => (
          <p>
            {t("settings.deleteWillLead")} <strong>{s().name}</strong>.
          </p>
        )}
      </Show>
      <button
        type="button"
        class="btn btn-primary"
        style={{ background: "var(--color-danger)", "border-color": "var(--color-danger)" }}
        disabled={busy() || !server()}
        onClick={() => void onDelete()}
      >
        {t("settings.deleteServer")}
      </button>
      <Show when={error()}>
        <p class="error" role="alert">
          {error()}
        </p>
      </Show>
    </div>
  );
}
