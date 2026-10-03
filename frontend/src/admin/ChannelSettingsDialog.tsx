import { For, Match, Show, Switch, createEffect, createSignal } from "solid-js";
import { MutePanel } from "./channel/MutePanel";
import { InspectPanel } from "./channel/InspectPanel";
import { DeleteChannelDialog } from "./channel/DeleteChannelDialog";
import { AccessPanel } from "./channel/AccessPanel";
import { t } from "../i18n";
import { Badge, Dialog, Icon } from "../components/ui";
import type { Channel } from "../api";

type Tab = "access" | "inspect" | "mute";

// Everything about who can do what in one channel: the access rules, an inspector that explains
// the access a member really has, muting, and the way to delete the channel.
export function ChannelSettingsDialog(props: {
  open: boolean;
  channel: Channel | null;
  canMute: boolean;
  startDeleting?: boolean;
  onClose: () => void;
  onChanged: (channel: Channel) => void;
  onDeleted: (channelId: string) => void;
}) {
  const [tab, setTab] = createSignal<Tab>("access");
  const [count, setCount] = createSignal(0);
  const [deleting, setDeleting] = createSignal(false);

  createEffect(() => {
    if (!props.open) return;
    setTab("access");
    setDeleting(props.startDeleting === true);
  });

  const tabs = (): { id: Tab; icon: string; label: string }[] => [
    { id: "access", icon: "shield", label: t("mgmt.channel.tabAccess") },
    { id: "inspect", icon: "manage_search", label: t("mgmt.channel.tabInspect") },
    ...(props.canMute ? [{ id: "mute" as Tab, icon: "volume_off", label: t("mgmt.channel.tabMute") }] : []),
  ];

  return (
    <>
      <Dialog
        open={props.open && !deleting()}
        title={t("mgmt.channel.settingsTitle", { name: props.channel?.name ?? "" })}
        onClose={props.onClose}
        accent
        wide
        icon={props.channel?.type === "voice_video" ? "volume_up" : "tag"}
      >
        <Show when={props.channel}>
          {(channel) => (
            <div class="mg-channel-dialog">
              <p class="mg-lead">
                {t("mgmt.channel.settingsLead")}{" "}
                <Badge tone="secure" mono icon="lock">{t("mgmt.channel.chipE2ee")}</Badge>
              </p>
              <nav class="mg-tabs" aria-label={t("mgmt.channel.tabs")}>
                <For each={tabs()}>
                  {(item) => (
                    <button type="button" classList={{ active: tab() === item.id }} aria-current={tab() === item.id ? "page" : undefined} onClick={() => setTab(item.id)}>
                      <Icon name={item.icon} />
                      {item.label}
                      <Show when={item.id === "access"}><span class="mg-count">{count()}</span></Show>
                    </button>
                  )}
                </For>
              </nav>
              <Switch>
                <Match when={tab() === "access"}>
                  <AccessPanel channel={channel()} onCount={setCount} onSaved={(updated) => { props.onChanged(updated); props.onClose(); }} onCancel={props.onClose} onDelete={() => setDeleting(true)} />
                </Match>
                <Match when={tab() === "inspect"}>
                  <InspectPanel channel={channel()} onEdit={() => setTab("access")} onClose={props.onClose} />
                </Match>
                <Match when={tab() === "mute"}>
                  <MutePanel channel={channel()} onClose={props.onClose} />
                </Match>
              </Switch>
            </div>
          )}
        </Show>
      </Dialog>
      <Show when={props.channel}>
        {(channel) => (
          <DeleteChannelDialog open={props.open && deleting()} channel={channel()} onClose={() => setDeleting(false)} onDeleted={props.onDeleted} />
        )}
      </Show>
    </>
  );
}
