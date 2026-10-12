import { Show, createSignal } from "solid-js";
import { avatarUrl, useAuthedSrc } from "../api";
import { Avatar, Icon } from "../components/ui";
import { t } from "../i18n";
import { useSession } from "../session/session";
import { CallControls } from "../voice/CallControls";
import { AccountMenu } from "./AccountMenu";

// Pinned at the bottom of the sidebar: who you are, and the entry to the account menu.
export function UserPanel() {
  const session = useSession();
  const [open, setOpen] = createSignal(false);
  const me = () => session.account()!;
  const name = () => me().display_name || me().handle;
  const avatar = useAuthedSrc(() => (me().has_avatar ? avatarUrl(me().id) : undefined));
  return (
    <div class="user-strip relative bg-surface-container-lowest p-2 space-y-2 [&_.presence]:h-2.5 [&_.presence]:w-2.5 [&_.presence]:border-surface-container-lowest">
      <CallControls />
      <div class="flex items-center justify-between gap-2 px-1.5 py-1">
      <div class="flex min-w-0 items-center gap-2">
      <Avatar name={name()} src={avatar()} online size="sm" />
      <div class="flex min-w-0 flex-col leading-tight">
        <span class="truncate font-display text-body-sm text-on-surface">{name()}</span>
        <small class="truncate font-code text-label-code-sm text-on-surface-variant">@{me().handle}</small>
      </div>
      </div>
      <button type="button" aria-haspopup="menu" aria-expanded={open()} title={t("shell.accountMenu")} aria-label={t("shell.accountMenu")} onClick={() => setOpen(!open())} class="grid shrink-0 place-items-center rounded p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface">
        <Icon name="tune" class="text-[18px]" />
      </button>
      <Show when={open()}>
        <AccountMenu onClose={() => setOpen(false)} />
      </Show>
      </div>
    </div>
  );
}
