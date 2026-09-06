import { Show, createEffect, createSignal, onCleanup } from "solid-js";
import {
  accountAvatarUrl,
  deleteOwnAvatar,
  putOwnAvatar,
  type Account,
} from "../api/client";
import Dialog from "./Dialog";
import ImageUploadDialog from "./ImageUploadDialog";

type Props = {
  open: boolean;
  onClose: () => void;
  me: Account;
  onLogout: () => void;
  onAccountPatch?: (account: Account) => void;
};

export default function AccountMenu(props: Props) {
  const [confirmOpen, setConfirmOpen] = createSignal(false);
  const [avatarOpen, setAvatarOpen] = createSignal(false);
  let panelRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (!props.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !confirmOpen() && !avatarOpen()) {
        e.preventDefault();
        props.onClose();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (confirmOpen() || avatarOpen()) return;
      const t = e.target;
      if (t instanceof Element && t.closest(".account-menu-anchor")) return;
      if (panelRef && t instanceof Node && !panelRef.contains(t)) props.onClose();
    };
    window.addEventListener("keydown", onKey);
    // next tick so the opening click does not immediately close
    const id = window.setTimeout(() => {
      window.addEventListener("pointerdown", onPointer);
    }, 0);
    onCleanup(() => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    });
  });

  function requestLogout() {
    setConfirmOpen(true);
  }

  function cancelConfirm() {
    setConfirmOpen(false);
  }

  function confirmLogout() {
    setConfirmOpen(false);
    props.onClose();
    props.onLogout();
  }

  return (
    <>
      <Show when={props.open}>
        <div class="account-menu" ref={(el) => (panelRef = el)}>
          <div class="account-menu-panel" role="menu" aria-label="Conta">
            <div class="account-menu-handle">
              <span class="muted" style={{ "font-size": "11px" }}>
                Ligado como
              </span>
              <code class="members-handle">{props.me.handle}</code>
            </div>
            <button
              type="button"
              class="account-menu-item"
              role="menuitem"
              onClick={() => {
                setAvatarOpen(true);
                props.onClose();
              }}
            >
              Foto de perfil
            </button>
            <button
              type="button"
              class="account-menu-item"
              role="menuitem"
              onClick={requestLogout}
            >
              Terminar sessão
            </button>
          </div>
        </div>
      </Show>
      <Dialog
        open={confirmOpen()}
        title="Terminar sessão"
        onClose={cancelConfirm}
        actions={
          <>
            <button type="button" class="btn btn-secondary" onClick={cancelConfirm}>
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" onClick={confirmLogout}>
              Confirmar
            </button>
          </>
        }
      >
        <p>Tens a certeza de que queres terminar a sessão nesta instância?</p>
      </Dialog>
      <ImageUploadDialog
        open={avatarOpen()}
        title="Foto de perfil"
        hasImage={!!props.me.has_avatar}
        currentUrl={accountAvatarUrl(props.me.id)}
        onClose={() => setAvatarOpen(false)}
        onSave={async (file) => {
          const updated = await putOwnAvatar(file, file.type);
          props.onAccountPatch?.({ ...props.me, ...updated, has_avatar: true });
        }}
        onRemove={async () => {
          await deleteOwnAvatar();
          props.onAccountPatch?.({ ...props.me, has_avatar: false });
        }}
      />
    </>
  );
}
