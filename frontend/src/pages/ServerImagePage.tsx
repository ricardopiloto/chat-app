import { Show, createResource, createSignal } from "solid-js";
import { useParams } from "@solidjs/router";
import {
  api,
  deleteServerImage,
  putServerImage,
  serverImageUrl,
  type Server,
} from "../api/client";
import ImageUploadDialog from "../components/ImageUploadDialog";
import { errorMessage } from "../lib/apiError";

export default function ServerImagePage() {
  const params = useParams<{ serverId: string }>();
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [error, setError] = createSignal("");

  const serverId = () => params.serverId!;

  const [server, { refetch }] = createResource(serverId, async (id) => {
    const list = await api<Server[]>("/api/servers");
    return list.find((s) => s.id === id) ?? null;
  });

  return (
    <div class="server-image-page main" role="main">
      <header class="server-settings-page-header">
        <h1>Imagem do servidor</h1>
        <p class="muted">Atualize a imagem mostrada no rail e na lista de servidores.</p>
      </header>
      <Show when={server()} fallback={<p class="muted">A carregar…</p>}>
        {(s) => (
          <div class="server-image-preview-block">
            <Show
              when={s().has_image}
              fallback={<div class="server-image-placeholder muted">Sem imagem</div>}
            >
              <img
                class="server-image-preview"
                src={serverImageUrl(s().id)}
                alt={`Imagem de ${s().name}`}
              />
            </Show>
            <button type="button" class="btn btn-primary" onClick={() => setDialogOpen(true)}>
              Alterar imagem
            </button>
          </div>
        )}
      </Show>
      <Show when={error()}>
        <p class="error" role="alert">
          {error()}
        </p>
      </Show>
      <ImageUploadDialog
        open={dialogOpen()}
        title="Imagem do servidor"
        hasImage={!!server()?.has_image}
        currentUrl={server() ? serverImageUrl(server()!.id) : undefined}
        onClose={() => setDialogOpen(false)}
        onSave={async (file) => {
          setError("");
          try {
            await putServerImage(serverId(), file, file.type);
            await refetch();
            window.dispatchEvent(new CustomEvent("mesa:servers-refresh"));
          } catch (err) {
            setError(errorMessage(err));
            throw err;
          }
        }}
        onRemove={async () => {
          setError("");
          try {
            await deleteServerImage(serverId());
            await refetch();
            window.dispatchEvent(new CustomEvent("mesa:servers-refresh"));
          } catch (err) {
            setError(errorMessage(err));
            throw err;
          }
        }}
      />
    </div>
  );
}
