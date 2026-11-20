import { Show, createSignal, onCleanup, onMount } from "solid-js";
import { avatarUrl, useAuthedSrc } from "../api";
import { Avatar, Icon } from "../components/ui";
import { t } from "../i18n";
import { useSession } from "../session/session";
import { CallControls } from "../voice/CallControls";
import { AccountMenu } from "./AccountMenu";

// Shared navigation card: who you are, and the entry to the account menu.
export function UserPanel(props: { onHeightChange: (height: number) => void; showCallControls: boolean }) {
  const session = useSession();
  const [open, setOpen] = createSignal(false);
  const me = () => session.account()!;
  const name = () => me().display_name || me().handle;
  const avatar = useAuthedSrc(() => (me().has_avatar ? avatarUrl(me().id) : undefined));
  let card: HTMLDivElement | undefined;
  onMount(() => {
    const resize = new ResizeObserver(([entry]) => {
      if (entry) props.onHeightChange(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height);
    });
    if (card) resize.observe(card);
    onCleanup(() => resize.disconnect());
  });
  return (
    <div ref={card} class="user-strip relative mx-2 mb-2 space-y-2 rounded-md bg-surface-container-high p-2 shadow-floating [&_.presence]:h-2.5 [&_.presence]:w-2.5 [&_.presence]:border-surface-container-high">
      <Show when={props.showCallControls}><CallControls /></Show>
      <div class="flex items-center justify-between gap-2 px-1.5 py-1">
      <div class="flex min-w-0 items-center gap-2">
      <Avatar name={name()} src={avatar()} online size="sm" />
      <div class="flex min-w-0 flex-col leading-tight">
        <span class="truncate font-display text-body-sm text-on-surface">{name()}</span>
        <small class="truncate font-code text-label-code-sm text-on-surface-variant">@{me().handle}</small>
      </div>
      </div>
      <button type="button" aria-haspopup="menu" aria-expanded={open()} title={t("shell.accountMenu")} aria-label={t("shell.accountMenu")} onClick={() => setOpen(!open())} class="grid shrink-0 place-items-center rounded p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface focus-visible:bg-surface-container-highest focus-visible:text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
        <Icon name="tune" class="text-[18px]" />
      </button>
      <Show when={open()}>
        <AccountMenu onClose={() => setOpen(false)} />
      </Show>
      </div>
    </div>
  );
}
