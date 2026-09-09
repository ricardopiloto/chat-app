import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import {
  accountAvatarUrl,
  deleteOwnAvatar,
  putOwnAvatar,
  type Account,
} from "../api/client";
import { getLocale, setLocale, SUPPORTED_LOCALES, t, type AppLocale } from "../i18n";
import Dialog from "./Dialog";
import ImageUploadDialog from "./ImageUploadDialog";

type Props = {
  open: boolean;
  onClose: () => void;
  me: Account;
  onLogout: () => void;
  onAccountPatch?: (account: Account) => void;
};

const LOCALE_LABEL_KEY: Record<AppLocale, string> = {
  "pt-BR": "account.langPt",
  en: "account.langEn",
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
      const tEl = e.target;
      if (tEl instanceof Element && tEl.closest(".account-menu-anchor")) return;
      if (panelRef && tEl instanceof Node && !panelRef.contains(tEl)) props.onClose();
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
          <div class="account-menu-panel" role="menu" aria-label={t("account.menu")}>
            <div class="account-menu-handle">
              <span class="muted" style={{ "font-size": "11px" }}>
                {t("account.signedInAs")}
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
              {t("account.profilePhoto")}
            </button>
            <div class="account-menu-lang" role="group" aria-label={t("account.language")}>
              <span class="muted" style={{ "font-size": "11px" }}>
                {t("account.language")}
              </span>
              <div class="account-menu-lang-options">
                <For each={[...SUPPORTED_LOCALES]}>
                  {(loc) => (
                    <button
                      type="button"
                      class="account-menu-item"
                      role="menuitemradio"
                      aria-checked={getLocale() === loc}
                      aria-label={t(LOCALE_LABEL_KEY[loc])}
                      onClick={() => setLocale(loc)}
                    >
                      {t(LOCALE_LABEL_KEY[loc])}
                      <Show when={getLocale() === loc}> ✓</Show>
                    </button>
                  )}
                </For>
              </div>
            </div>
            <button
              type="button"
              class="account-menu-item"
              role="menuitem"
              onClick={requestLogout}
            >
              {t("account.logout")}
            </button>
          </div>
        </div>
      </Show>
      <Dialog
        open={confirmOpen()}
        title={t("account.logoutConfirmTitle")}
        onClose={cancelConfirm}
        actions={
          <>
            <button type="button" class="btn btn-secondary" onClick={cancelConfirm}>
              {t("common.cancel")}
            </button>
            <button type="button" class="btn btn-primary" onClick={confirmLogout}>
              {t("common.confirm")}
            </button>
          </>
        }
      >
        <p>{t("account.logoutConfirmBody")}</p>
      </Dialog>
      <ImageUploadDialog
        open={avatarOpen()}
        title={t("account.profilePhoto")}
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
