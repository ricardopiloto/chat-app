import { For, Show, createResource, createSignal, onCleanup } from "solid-js";
import { MuteMemberDialog, remainingLabel } from "./MuteMemberDialog";
import { useShell } from "../../shell/state";
import { publicDisplayLabel } from "../../lib/displayName";
import { t } from "../../i18n";
import { Avatar, Badge, Button, Icon } from "../../components/ui";
import { avatarUrl, mutes, type Channel, type Member, type Mute } from "../../api";

// Members who can be muted in this channel, with the state of each one. The owner and the person
// looking are never listed: neither can be muted.
export function MutePanel(props: { channel: Channel; onClose: () => void }) {
  const shell = useShell();
  const [list, { refetch }] = createResource(
    () => props.channel.id,
    async (id) => {
      try {
        return await mutes.list(id);
      } catch {
        return [] as Mute[];
      }
    },
  );
  const [target, setTarget] = createSignal<Member | null>(null);
  const [now, setNow] = createSignal(Date.now());
  const timer = window.setInterval(() => setNow(Date.now()), 15_000);
  onCleanup(() => window.clearInterval(timer));

  const ownerId = () => shell.server()?.owner_account_id;
  const candidates = () => (shell.members.data ?? []).filter((m) => m.account_id !== shell.meId() && m.account_id !== ownerId());
  const muteOf = (accountId: string) => (list() ?? []).find((m) => m.account_id === accountId && new Date(m.ends_at).getTime() > now());

  return (
    <>
      <div class="mg-panel-body">
        <ul class="mg-mute-list">
          <For each={candidates()} fallback={<li class="mg-empty">{t("mgmt.channel.mute.none")}</li>}>
            {(member) => {
              const label = () => publicDisplayLabel(member.handle, member.display_name);
              return (
                <li data-member={member.handle}>
                  <Avatar name={label()} src={member.has_avatar ? avatarUrl(member.account_id) : undefined} />
                  <div><strong>{label()}</strong><small>@{member.handle}</small></div>
                  <Show when={muteOf(member.account_id)}>
                    {(active) => <Badge tone="danger" mono icon="timer">{t("mgmt.channel.mute.status", { remaining: remainingLabel(active().ends_at, now()) })}</Badge>}
                  </Show>
                  <Button onClick={() => setTarget(member)}>
                    <Icon name={muteOf(member.account_id) ? "volume_up" : "volume_off"} />
                    {muteOf(member.account_id) ? t("mgmt.channel.mute.unmute") : t("mgmt.channel.mute.action")}
                  </Button>
                </li>
              );
            }}
          </For>
        </ul>
      </div>
      <footer class="mg-panel-foot">
        <Button variant="icon" class="mg-cancel" onClick={props.onClose}>{t("mgmt.close")}</Button>
      </footer>
      <MuteMemberDialog
        open={target() !== null}
        channelId={props.channel.id}
        member={target()}
        mute={target() ? muteOf(target()!.account_id) : undefined}
        onClose={() => setTarget(null)}
        onChanged={() => {
          setNow(Date.now());
          void refetch();
        }}
      />
    </>
  );
}
