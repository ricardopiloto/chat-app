import { Show, createSignal } from "solid-js";
import { avatarUrl } from "../api";
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
  return (
    <div class="relative border-t border-outline-variant bg-surface-container">
      <CallControls />
      <div class="flex items-center gap-3 px-3 py-3">
      <Avatar name={name()} src={me().has_avatar ? avatarUrl(me().id) : undefined} online />
      <div class="flex min-w-0 flex-1 flex-col leading-tight">
        <strong class="truncate text-body-md">{name()}</strong>
        <small class="truncate font-code text-label-code-sm text-on-surface-variant">@{me().handle}</small>
      </div>
      <button type="button" aria-haspopup="menu" aria-expanded={open()} title={t("shell.accountMenu")} aria-label={t("shell.accountMenu")} onClick={() => setOpen(!open())} class="grid h-9 w-9 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface">
        <Icon name="tune" class="text-[20px]" />
      </button>
      <Show when={open()}>
        <AccountMenu onClose={() => setOpen(false)} />
      </Show>
      </div>
    </div>
  );
}
