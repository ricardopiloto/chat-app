import { Show, createEffect, createSignal, onCleanup } from "solid-js";
import { ALLOWED_AVATAR_TYPES, MAX_AVATAR_BYTES } from "../api/client";
import Dialog from "./Dialog";

type Props = {
  open: boolean;
  title: string;
  hasImage: boolean;
  currentUrl?: string;
  onClose: () => void;
  onSave: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
};

export default function ImageUploadDialog(props: Props) {
  const [file, setFile] = createSignal<File | null>(null);
  const [preview, setPreview] = createSignal<string | null>(null);
  const [error, setError] = createSignal("");
  const [busy, setBusy] = createSignal(false);

  createEffect(() => {
    if (props.open) return;
    setFile(null);
    setError("");
    setBusy(false);
  });

  createEffect(() => {
    const next = file();
    if (!next) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(next);
    setPreview(url);
    onCleanup(() => URL.revokeObjectURL(url));
  });

  function onPick(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const next = input.files?.[0] ?? null;
    input.value = "";
    if (!next) return;
    if (!ALLOWED_AVATAR_TYPES.has(next.type)) {
      setError("Use JPEG, PNG ou WebP (GIF não é aceite).");
      setFile(null);
      return;
    }
    if (next.size > MAX_AVATAR_BYTES) {
      setError("A imagem não pode exceder 1 MiB.");
      setFile(null);
      return;
    }
    setError("");
    setFile(next);
  }

  async function save() {
    const next = file();
    if (!next) return;
    setBusy(true);
    setError("");
    try {
      await props.onSave(next);
      props.onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError("");
    try {
      await props.onRemove();
      props.onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const shown = () => preview() ?? (props.hasImage ? props.currentUrl : undefined);

  return (
    <Dialog
      open={props.open}
      title={props.title}
      onClose={() => {
        if (!busy()) props.onClose();
      }}
      actions={
        <>
          <button
            type="button"
            class="btn btn-secondary"
            disabled={busy()}
            onClick={() => props.onClose()}
          >
            Cancelar
          </button>
          <Show when={props.hasImage}>
            <button
              type="button"
              class="btn btn-secondary"
              disabled={busy()}
              onClick={() => void remove()}
            >
              Remover
            </button>
          </Show>
          <button
            type="button"
            class="btn btn-primary"
            disabled={busy() || !file()}
            onClick={() => void save()}
          >
            Guardar
          </button>
        </>
      }
    >
      <div class="avatar-dialog">
        <div class="avatar-dialog-preview" aria-hidden="true">
          <Show
            when={shown()}
            fallback={<span class="avatar-dialog-fallback">?</span>}
          >
            <img src={shown()} alt="" />
          </Show>
        </div>
        <p class="muted">JPEG, PNG ou WebP. Máximo 1 MiB. Sem recorte — a imagem preenche o círculo.</p>
        <label class="btn btn-secondary avatar-dialog-pick">
          Escolher ficheiro
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={onPick}
          />
        </label>
        <Show when={error()}>
          <p class="error" role="alert">
            {error()}
          </p>
        </Show>
      </div>
    </Dialog>
  );
}
