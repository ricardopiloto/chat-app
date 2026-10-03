import { Show } from "solid-js";
import { avatarUrl } from "../api";
import { Avatar, Badge, Icon, Logo } from "../components/ui";
import { t } from "../i18n";
import { useSession } from "../session/session";
import { ThemeSwitch } from "./ThemeSwitch";
import { useShell } from "./state";

const roundButton = "relative grid h-9 w-9 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface";

// Global entry points. Search and notifications only announce an intent (a document event); the
// text-chat phase renders what opens.
export function Topbar() {
  const shell = useShell();
  const session = useSession();
  const me = () => session.account()!;
  return (
    <header class="flex h-14 shrink-0 items-center gap-3 border-b border-outline-variant bg-surface-container-lowest px-3 tablet:px-4">
      <button type="button" class={`${roundButton} tablet:hidden`} aria-label={t("shell.openNavigation")} aria-expanded={shell.drawerOpen()} onClick={() => shell.setDrawerOpen(true)}>
        <Icon name="menu" />
      </button>
      <button type="button" class="flex items-center gap-2 rounded-md px-1 py-1" onClick={() => shell.go("/")} aria-label={t("shell.home")}>
        <Logo size={28} />
        <span class="font-display text-headline-sm text-primary">{t("shell.brand")}</span>
      </button>
      <span class="hidden font-code text-label-code-sm text-on-surface-variant tablet:inline">
        {t("shell.instance")} · v{__APP_VERSION__}
      </span>
      <Badge tone="secure" mono icon="lock">
        <span class="hidden tablet:inline">{t("shell.e2eeChip")}</span>
        <span class="tablet:hidden">E2EE</span>
      </Badge>

      <div class="flex-1" />

      <button type="button" class="hidden min-w-[260px] items-center gap-3 rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 text-left text-body-sm text-on-surface-variant transition-colors hover:border-outline tablet:flex" aria-label={t("shell.searchEntry")} onClick={() => document.dispatchEvent(new Event("mesa:search"))}>
        <Icon name="search" class="text-[18px]" />
        <span class="flex-1">{t("shell.searchPlaceholder")}</span>
        <kbd class="rounded bg-surface-container-highest px-1.5 py-0.5 font-code text-label-code-sm">Ctrl+K</kbd>
      </button>
      <button type="button" class={`${roundButton} tablet:hidden`} aria-label={t("shell.searchEntry")} onClick={() => document.dispatchEvent(new Event("mesa:search"))}>
        <Icon name="search" />
      </button>

      <div class="hidden tablet:block">
        <ThemeSwitch />
      </div>

      <Show when={shell.serverId() && shell.route().page === "server" && !shell.narrow()}>
        <button type="button" class={roundButton} classList={{ "!bg-surface-container-high !text-primary": shell.membersOpen() }} title={t("shell.toggleMembers")} aria-label={t("shell.toggleMembers")} aria-pressed={shell.membersOpen()} onClick={shell.toggleMembers}>
          <Icon name="group" />
        </button>
      </Show>

      <button type="button" class={`${roundButton} news-button`} aria-label={t("shell.notificationEntry")} onClick={() => document.dispatchEvent(new Event("mesa:notifications"))}>
        <Icon name="notifications" />
        <Show when={shell.hasNews()}>
          <span class="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface-container-lowest bg-primary" aria-label={t("shell.newsIndicator")} />
        </Show>
      </button>

      <button type="button" class="rounded-full" title={t("shell.myAccount")} aria-label={t("shell.myAccount")} onClick={() => shell.go("/account")}>
        <Avatar name={me().display_name || me().handle} src={me().has_avatar ? avatarUrl(me().id) : undefined} size="sm" />
      </button>
    </header>
  );
}
