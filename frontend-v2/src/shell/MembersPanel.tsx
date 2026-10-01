import { For, Show, createMemo } from "solid-js";
import { avatarUrl, type Member, type ServerRole } from "../api";
import { Avatar, MonoLabel } from "../components/ui";
import { publicDisplayLabel } from "../lib/displayName";
import { t } from "../i18n";
import { useShell } from "./state";

type Group = { key: string; title: string; people: Member[] };

// Members of the open server, grouped by their highest role among those online, then everyone
// offline. A role with a higher position outranks one with a lower position.
export function MembersPanel() {
  const shell = useShell();
  const online = createMemo(() => new Set(shell.presence.data?.online_account_ids ?? []));

  const roleOf = (accountId: string): ServerRole | undefined =>
    (shell.roles.data ?? []).filter((role) => role.member_ids.includes(accountId)).sort((a, b) => b.position - a.position)[0];

  const groups = createMemo<{ live: Group[]; away: Member[]; liveCount: number }>(() => {
    const everyone = shell.members.data ?? [];
    const live = everyone.filter((m) => online().has(m.account_id));
    const byRole = new Map<string, Group>();
    for (const member of live) {
      const role = roleOf(member.account_id);
      const key = role?.id ?? "none";
      const group = byRole.get(key) ?? { key, title: role?.name ?? t("shell.membersNoRole"), people: [] };
      group.people.push(member);
      byRole.set(key, group);
    }
    const rank = (key: string) => shell.roles.data?.find((role) => role.id === key)?.position ?? -1;
    return {
      live: [...byRole.values()].sort((a, b) => rank(b.key) - rank(a.key)),
      away: everyone.filter((m) => !online().has(m.account_id)),
      liveCount: live.length,
    };
  });

  const Person = (props: { member: Member; online: boolean }) => (
    <li class="flex items-center gap-3 rounded-md px-2 py-1.5" classList={{ "opacity-60": !props.online }}>
      <Avatar name={publicDisplayLabel(props.member.handle, props.member.display_name)} src={props.member.has_avatar ? avatarUrl(props.member.account_id) : undefined} online={props.online} size="sm" />
      <div class="min-w-0 leading-tight">
        <p class="truncate text-body-md">{publicDisplayLabel(props.member.handle, props.member.display_name)}</p>
        <Show when={props.member.display_name}>
          <p class="truncate font-code text-label-code-sm text-on-surface-variant">@{props.member.handle}</p>
        </Show>
      </div>
      <Show when={props.member.account_id === shell.meId()}>
        <span class="ml-auto font-code text-label-code-sm text-on-surface-variant">{t("shell.you")}</span>
      </Show>
    </li>
  );

  return (
    <aside class="flex min-h-0 w-64 shrink-0 flex-col border-l border-outline-variant bg-surface-container-low" aria-label={t("shell.members")}>
      <header class="flex items-center gap-3 border-b border-outline-variant px-4 py-3">
        <h2 class="font-display text-headline-sm">{t("shell.members")}</h2>
        <span class="rounded-full bg-surface-container-high px-2 py-0.5 font-code text-label-code-sm text-secondary">{t("shell.onlineCount", { count: groups().liveCount })}</span>
      </header>
      <div class="flex-1 overflow-y-auto px-2 py-3">
        <For each={groups().live}>
          {(group) => (
            <section class="mb-4">
              <MonoLabel class="px-2">{group.title} — {group.people.length}</MonoLabel>
              <ul class="mt-1">
                <For each={group.people}>{(member) => <Person member={member} online />}</For>
              </ul>
            </section>
          )}
        </For>
        <Show when={groups().away.length > 0}>
          <section>
            <MonoLabel class="px-2">{t("shell.offline")} — {groups().away.length}</MonoLabel>
            <ul class="mt-1">
              <For each={groups().away}>{(member) => <Person member={member} online={false} />}</For>
            </ul>
          </section>
        </Show>
      </div>
    </aside>
  );
}
