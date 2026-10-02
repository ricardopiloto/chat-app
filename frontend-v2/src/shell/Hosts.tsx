import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import { CreateChannelDialog } from "../admin/CreateChannelDialog";
import { CreateServerDialog } from "../admin/CreateServerDialog";
import { ChannelSettingsDialog } from "../admin/ChannelSettingsDialog";
import { InviteDialog } from "../admin/InviteDialog";
import { NotificationsPanel } from "../chat/NotificationsPanel";
import { SearchPanel, type SearchHit } from "../chat/SearchPanel";
import { FloatingPlayer } from "../voice/FloatingPlayer";
import { useCall } from "../voice/callSession";
import { useSession } from "../session/session";
import { useShell } from "./state";

// Mounts the dialogs and panels owned by later phases, and routes the "mesa:*" document events the
// chrome emits (create a server, invite, settings, search, notifications) to them.
export function Hosts() {
  const shell = useShell();
  const session = useSession();
  const voice = useCall();

  const [creatingServer, setCreatingServer] = createSignal(false);
  const [inviting, setInviting] = createSignal(false);
  const [searching, setSearching] = createSignal(false);
  const [seed, setSeed] = createSignal<string | null>(null);
  const [seedNonce, setSeedNonce] = createSignal(0);
  const [notifying, setNotifying] = createSignal(false);

  function openSearch(text: string | null) {
    setSeed(text);
    setSeedNonce((n) => n + 1);
    setNotifying(false);
    setSearching(true);
  }

  function openMessage(channelId: string, serverId: string, messageId: string | null, reply = false) {
    const query = messageId ? `?msg=${encodeURIComponent(messageId)}${reply ? "&reply=1" : ""}` : "";
    shell.go(`/servers/${serverId}/channels/${channelId}${query}`);
  }

  createEffect(() => {
    const on: [string, () => void][] = [
      ["mesa:create-server", () => setCreatingServer(true)],
      ["mesa:invite", () => setInviting(true)],
      ["mesa:server-settings", () => shell.serverId() && shell.go(`/servers/${shell.serverId()}/settings`)],
      ["mesa:search", () => openSearch(null)],
      ["mesa:search-channel", () => openSearch(shell.channel()?.type === "text" ? `#${shell.channel()!.name} ` : null)],
      ["mesa:notifications", () => { setSearching(false); setNotifying((open) => !open); }],
    ];
    for (const [name, handler] of on) document.addEventListener(name, handler);

    // Ctrl/Cmd+K opens search anywhere; Ctrl/Cmd+F opens it scoped to the open text channel.
    const shortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key !== "k" && key !== "f") return;
      event.preventDefault();
      event.stopPropagation();
      const scoped = key === "f" && shell.channel()?.type === "text" ? `#${shell.channel()!.name} ` : null;
      openSearch(scoped);
    };
    window.addEventListener("keydown", shortcut, true);
    const refresh = () => void shell.refreshServers();
    window.addEventListener("mesa:servers-refresh", refresh);

    onCleanup(() => {
      for (const [name, handler] of on) document.removeEventListener(name, handler);
      window.removeEventListener("keydown", shortcut, true);
      window.removeEventListener("mesa:servers-refresh", refresh);
    });
  });

  const openHit = (hit: SearchHit) => {
    setSearching(false);
    openMessage(hit.channelId, hit.serverId, hit.messageId);
  };

  return (
    <>
      <Show when={voice.live() && voice.channelId() !== null && voice.channelId() !== shell.route().channelId}>
        <FloatingPlayer />
      </Show>
      <CreateServerDialog
        open={creatingServer()}
        accountId={shell.meId()}
        identity={session.identity()!}
        onClose={() => setCreatingServer(false)}
        onCreated={(serverId) => {
          setCreatingServer(false);
          void shell.refreshServers();
          shell.go(`/servers/${serverId}`);
        }}
      />
      <CreateChannelDialog
        open={shell.createChannelKind() !== null}
        serverId={shell.serverId()}
        initialType={shell.createChannelKind() ?? "text"}
        identity={session.identity()!}
        onClose={() => shell.setCreateChannelKind(null)}
        onCreated={(channel) => {
          shell.setCreateChannelKind(null);
          void shell.refreshChannels();
          shell.go(`/servers/${channel.server_id}/channels/${channel.id}`);
        }}
      />
      <InviteDialog open={inviting()} serverId={shell.serverId()} onClose={() => setInviting(false)} />
      <ChannelSettingsDialog
        open={shell.settingsChannel() !== null}
        channel={shell.settingsChannel()}
        canMute={shell.can("can_mute_members")}
        startDeleting={shell.settingsDelete()}
        onClose={() => {
          shell.setSettingsChannel(null);
          shell.setSettingsDelete(false);
        }}
        onChanged={() => void shell.refreshChannels()}
        onDeleted={(channelId) => {
          shell.setSettingsChannel(null);
          shell.setSettingsDelete(false);
          void shell.refreshChannels();
          if (shell.route().channelId === channelId) shell.go(`/servers/${shell.serverId()}`);
        }}
      />
      <SearchPanel open={searching()} seed={seed()} seedNonce={seedNonce()} onClose={() => setSearching(false)} onOpenHit={openHit} />
      <NotificationsPanel open={notifying()} onClose={() => setNotifying(false)} onOpenMessage={openMessage} />
    </>
  );
}
