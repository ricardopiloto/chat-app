import { For, Show, createSignal, type JSX } from "solid-js";
import { Portal } from "solid-js/web";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: JSX.Element;
  actions?: JSX.Element;
};

export default function Dialog(props: Props) {
  return (
    <Show when={props.open}>
      <Portal>
        <div
          class="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) props.onClose();
          }}
        >
          <div class="dialog" role="dialog" aria-modal="true" aria-label={props.title}>
            <div class="dialog-title">{props.title}</div>
            <div class="dialog-body">{props.children}</div>
            <Show when={props.actions}>
              <div class="dialog-actions">{props.actions}</div>
            </Show>
          </div>
        </div>
      </Portal>
    </Show>
  );
}

export function ConfirmDirty(props: {
  open: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog
      open={props.open}
      title="Alterações por guardar"
      onClose={props.onCancel}
      actions={
        <>
          <button type="button" class="btn btn-secondary" onClick={props.onCancel}>
            Cancelar
          </button>
          <button type="button" class="btn btn-secondary" onClick={props.onDiscard}>
            Descartar
          </button>
          <button type="button" class="btn btn-primary" onClick={props.onSave}>
            Guardar
          </button>
        </>
      }
    >
      <p>O rascunho da cena tem alterações. Guardar no servidor, descartar, ou continuar a editar?</p>
    </Dialog>
  );
}

/** Simple copy feedback helper used by invite dialogs. */
export function useCopiedFeedback() {
  const [label, setLabel] = createSignal("Copiar");
  async function copy(text: string) {
    await navigator.clipboard.writeText(text).catch(() => undefined);
    setLabel("Copiado");
    window.setTimeout(() => setLabel("Copiar"), 1600);
  }
  return { label, copy };
}

export function OptionList<T>(props: {
  items: T[];
  render: (item: T) => JSX.Element;
}) {
  return (
    <For each={props.items}>{(item) => props.render(item)}</For>
  );
}
