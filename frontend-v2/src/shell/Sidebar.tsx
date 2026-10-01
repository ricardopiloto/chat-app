import { For, Show, createSignal } from "solid-js";
import { channels as channelsApi, avatarUrl, type Channel, type ChannelKind } from "../api";
import { Badge, Icon } from "../components/ui";
import { canManageChannel } from "../lib/capabilities";
import { normalizeChannelNameDraft, validateChannelName } from "../lib/channelName";
import { errorText } from "../lib/errors";
import { publicDisplayLabel } from "../lib/displayName";
import { t } from "../i18n";
import CallControls from "../voice/CallControls";
import { useVoiceSession } from "../voice/VoiceSession";
import { useShell } from "./state";
import { UserPanel } from "./UserPanel";

const SECTIONS: { kind: ChannelKind; title: string; add: string; glyph: string }[] = [
  { kind: "text", title: "shell.text", add: "admin.channel.addText", glyph: "tag" },
  { kind: "voice_video", title: "shell.voice", add: "admin.channel.addVoice", glyph: "volume_up" },
];

const iconButton = "grid h-7 w-7 place-items-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface";

function VoiceRoster(props: { channelId: string }) {
  const shell = useShell();
  const voice = useVoiceSession();
  const people = () => shell.voiceRoster()[props.channelId] ?? [];
  const speaking = () => (voice.channelId() === props.channelId ? voice.speakingAccountIds() : undefined);
  return (
    <Show when={people().length > 0}>
      <ul class="mb-1 ml-9 mt-0.5 flex flex-col gap-0.5">
        <For each={people()}>
          {(person) => (
            <li class="flex items-center gap-2 rounded-md px-2 py-1 text-body-sm text-on-surface-variant" classList={{ "text-secondary": speaking()?.has(person.account_id) }} title={speaking()?.has(person.account_id) ? t("voice.rosterSpeaking") : undefined}>
              <span class="grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-container-highest text-[10px] font-semibold" classList={{ "ring-2 ring-secondary": speaking()?.has(person.account_id) }}>
                <Show when={person.has_avatar} fallback={publicDisplayLabel(person.handle, person.display_name).slice(0, 1).toUpperCase()}>
                  <img src={avatarUrl(person.account_id)} alt="" class="h-full w-full object-cover" />
                </Show>
              </span>
              <span class="min-w-0 flex-1 truncate">{publicDisplayLabel(person.handle, person.display_name)}</span>
              <Show when={!person.mic_on}>
                <Icon name="mic_off" label={t("voice.rosterMuted")} class="text-[14px] text-error" />
              </Show>
            </li>
          )}
        </For>
      </ul>
    </Show>
  );
}

function ChannelRow(props: { channel: Channel; glyph: string }) {
  const shell = useShell();
  const [renaming, setRenaming] = createSignal(false);
  const [draft, setDraft] = createSignal("");
  const [problem, setProblem] = createSignal("");
  const selected = () => shell.route().channelId === props.channel.id;
  const manageable = () => canManageChannel(shell.meId(), shell.server(), props.channel, shell.roles.data);
  const isPrivate = () => props.channel.visibility === "private";

  async function commit() {
    if (!renaming()) return;
    const checked = validateChannelName(draft());
    if (!checked.ok) return setProblem(t(checked.reason === "empty" ? "admin.channel.nameEmpty" : "admin.channel.nameHyphens"));
    setProblem("");
    setRenaming(false);
    if (checked.name === props.channel.name) return;
    try {
      await channelsApi.update(props.channel.id, { name: checked.name });
      await shell.refreshChannels();
    } catch (error) {
      setProblem(errorText(error));
    }
  }

  return (
    <li>
      <div class="group relative flex items-center rounded-md transition-colors" classList={{ "bg-surface-container-high": selected(), "hover:bg-surface-container": !selected() }}>
        <Show
          when={renaming()}
          fallback={
            <button type="button" aria-current={selected() ? "page" : undefined} onClick={() => shell.go(`/servers/${shell.serverId()}/channels/${props.channel.id}`)} class="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-body-md" classList={{ "font-semibold text-on-surface": selected(), "text-on-surface-variant": !selected() }}>
              <Icon name={props.glyph} class="text-[18px] opacity-70" />
              <span class="min-w-0 flex-1 truncate">{props.channel.name}</span>
              <Show when={props.channel.type === "voice_video" && (shell.voiceRoster()[props.channel.id]?.length ?? 0) > 0}>
                <Badge tone="live" mono>
                  {t("shell.live")}
                </Badge>
              </Show>
              <Show when={isPrivate()}>
                <Icon name="lock" label={t("shell.privateChannel")} class="text-[16px] text-secondary" />
              </Show>
            </button>
          }
        >
          <input
            class="m-1 min-w-0 flex-1 rounded-md border border-primary-container bg-surface-container-lowest px-2 py-1 text-body-md outline-none"
            aria-label={t("admin.channel.rename")}
            value={draft()}
            ref={(el) => queueMicrotask(() => el.focus())}
            onInput={(e) => {
              const next = normalizeChannelNameDraft(e.currentTarget.value);
              setDraft(next);
              e.currentTarget.value = next;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void commit();
              if (e.key === "Escape") {
                setRenaming(false);
                setProblem("");
              }
            }}
            onBlur={() => void commit()}
          />
        </Show>
        <Show when={manageable() && !renaming()}>
          <span class="absolute right-1 top-1/2 flex -translate-y-1/2 rounded-md bg-surface-container-highest opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <button type="button" class={iconButton} title={t("admin.channel.rename")} aria-label={t("admin.channel.rename")} onClick={() => { setDraft(props.channel.name); setProblem(""); setRenaming(true); }}>
              <Icon name="edit" class="text-[16px]" />
            </button>
            <button type="button" class={iconButton} title={t("admin.channel.settings")} aria-label={t("admin.channel.settings")} onClick={() => shell.setSettingsChannel(props.channel)}>
              <Icon name="settings" class="text-[16px]" />
            </button>
          </span>
        </Show>
      </div>
      <Show when={problem()}>
        <p class="px-3 py-1 text-body-sm text-error" role="alert">{problem()}</p>
      </Show>
      <Show when={props.channel.type === "voice_video"}>
        <VoiceRoster channelId={props.channel.id} />
      </Show>
    </li>
  );
}

// Left column: the server header, the channels in two sections, then the call controls and the
// signed-in user's panel pinned to the bottom.
export function Sidebar() {
  const shell = useShell();
  return (
    <aside class="flex min-h-0 w-60 shrink-0 flex-col bg-surface-container-low">
      <Show when={shell.serverId()} fallback={<p class="flex-1 p-4 text-body-sm text-on-surface-variant">{t("shell.chooseServer")}</p>}>
        <header class="flex items-center gap-1 border-b border-outline-variant px-4 py-3">
          <h2 class="min-w-0 flex-1 truncate font-display text-headline-sm">{shell.server()?.name ?? t("shell.server")}</h2>
          <Show when={shell.can("can_create_invites")}>
            <button type="button" class={iconButton} title={t("shell.invite")} aria-label={t("shell.invite")} onClick={() => document.dispatchEvent(new Event("mesa:invite"))}>
              <Icon name="person_add" class="text-[20px]" />
            </button>
          </Show>
          <Show when={shell.canAdminServer()}>
            <button type="button" class={iconButton} title={t("shell.settings")} aria-label={t("shell.settings")} onClick={() => document.dispatchEvent(new Event("mesa:server-settings"))}>
              <Icon name="settings" class="text-[20px]" />
            </button>
          </Show>
        </header>
        <div class="flex-1 overflow-y-auto px-2 py-3">
          <For each={SECTIONS}>
            {(section) => (
              <section class="mb-4">
                <h3 class="mb-1 flex items-center justify-between px-3">
                  <span class="mono-label">{t(section.title)}</span>
                  <Show when={shell.can("can_manage_channels")}>
                    <button type="button" class={iconButton} title={t(section.add)} aria-label={t(section.add)} onClick={() => shell.setCreateChannelKind(section.kind)}>
                      <Icon name="add" class="text-[18px]" />
                    </button>
                  </Show>
                </h3>
                <ul class="flex flex-col gap-0.5">
                  <For each={shell.channels.data?.filter((c) => c.type === section.kind) ?? []}>{(channel) => <ChannelRow channel={channel} glyph={section.glyph} />}</For>
                </ul>
              </section>
            )}
          </For>
          <Show when={shell.channels.data?.length === 0}>
            <p class="px-3 text-body-sm text-on-surface-variant">{t("shell.noChannels")}</p>
          </Show>
        </div>
      </Show>
      <CallControls />
      <UserPanel />
    </aside>
  );
}
