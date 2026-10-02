import { Match, Show, Switch } from "solid-js";
import { useLocation } from "@solidjs/router";
import { Logo } from "../components/ui";
import { SettingsPage } from "../admin/settings/SettingsPage";
import { t } from "../i18n";
import { Account as AccountPage } from "../pages/Account";
import { ChannelPage } from "../chat/ChannelPage";
import VoiceChannel from "../pages/VoiceChannel";
import { useSession } from "../session/session";
import { useShell } from "./state";

function EmptyState(props: { title: string; hint: string }) {
  return (
    <div class="grid h-full place-items-center p-8 text-center">
      <div class="flex max-w-md flex-col items-center gap-3">
        <Logo variant="full" size={120} />
        <h1 class="font-display text-headline-lg">{props.title}</h1>
        <p class="text-body-md text-on-surface-variant">{props.hint}</p>
      </div>
    </div>
  );
}

// The main area. Channel and settings screens belong to later phases and are only mounted here.
export function Content() {
  const shell = useShell();
  const session = useSession();
  const where = useLocation();
  const me = () => session.account()!;
  const identity = () => session.identity()!;

  const emptyKey = () => (shell.serverId() && shell.channels.data?.length === 0 ? "noChannels" : shell.servers.data?.length ? "chooseChannel" : "noServers");

  return (
    <main class="min-h-0 min-w-0 flex-1 overflow-y-auto bg-background">
      <Switch>
        <Match when={shell.route().page === "account"}>
          <AccountPage />
        </Match>
        <Match when={shell.route().settings && shell.server()}>
          <SettingsPage server={shell.server()!} />
        </Match>
        <Match when={shell.route().channelId}>
          <Show when={shell.channel()?.id} keyed fallback={<p class="p-6 text-on-surface-variant">{t("shell.loadingChannel")}</p>}>
            {(_id) => (
              <Show
                when={shell.channel()!.type === "text"}
                fallback={<VoiceChannel me={me()} channel={shell.channel()!} identity={identity()} server={shell.server()} roles={shell.roles.data ?? []} onWs={shell.subscribe} />}
              >
                <ChannelPage
                  me={me()}
                  channel={shell.channel()!}
                  identity={identity()}
                  server={shell.server()}
                  roles={shell.roles.data ?? []}
                  subscribe={shell.subscribe}
                  focusMessageId={new URLSearchParams(where.search).get("msg")}
                  replyOnFocus={new URLSearchParams(where.search).get("reply") === "1"}
                />
              </Show>
            )}
          </Show>
        </Match>
        <Match when={true}>
          <EmptyState title={t(`shell.${emptyKey()}`)} hint={t(`shell.${emptyKey()}Hint`)} />
        </Match>
      </Switch>
    </main>
  );
}
