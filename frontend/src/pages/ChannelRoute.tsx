import { Show, createEffect, createResource, createSignal, onCleanup } from "solid-js";
import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { api, markChannelRead, type Account, type Channel } from "../api/client";
import type { WsEnvelope } from "../api/ws";
import type { Identity } from "../crypto/identity";
import { setActiveChannel } from "../preferences/activeChannel";
import { markSeen } from "../preferences/notifications";
import {
  channelHref,
  resolveChannelForServer,
  writeLastChannel,
} from "../preferences/lastChannelByServer";
// Topbar bell still uses session Set; ServerRail unread uses BE has_unread (037).
import ChannelPage from "./Channel";
import VoiceChannel from "./VoiceChannel";

type Props = {
  me: Account;
  identity: Identity;
  onWs: (handler: (msg: WsEnvelope) => void) => () => void;
};

export default function ChannelRoute(props: Props) {
  const params = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [realigning, setRealigning] = createSignal(false);

  createEffect(() => {
    const id = params.id;
    if (id) markSeen(id);
  });

  const [channel] = createResource(
    () => ({
      id: params.id,
      server: String(search.server ?? ""),
    }),
    async ({ id, server }) => {
      if (!id) return undefined;
      try {
        return await api<Channel>(`/api/channels/${id}`);
      } catch {
        if (!server) return undefined;
        const list = await api<Channel[]>(`/api/servers/${server}/channels`);
        return list.find((c) => c.id === id);
      }
    },
  );

  createEffect(() => {
    const ch = channel();
    if (ch) {
      writeLastChannel(ch.server_id, ch.id);
      setActiveChannel({ id: ch.id, name: ch.name, type: ch.type });
      if (ch.type === "text") {
        void markChannelRead(ch.id)
          .then(() => {
            window.dispatchEvent(new CustomEvent("mesa:servers-refresh"));
          })
          .catch(() => {
            /* rail may lag until next refetch */
          });
      }
    } else if (!channel.loading) {
      setActiveChannel(null);
    }
    onCleanup(() => setActiveChannel(null));
  });

  // 041 R6: channel belongs to another server than ?server= — realign to query server.
  createEffect(() => {
    const ch = channel();
    const serverQ = String(search.server ?? "");
    if (!ch || channel.loading || !serverQ || realigning()) return;
    if (ch.server_id === serverQ) return;
    setRealigning(true);
    void (async () => {
      try {
        const list = await api<Channel[]>(`/api/servers/${serverQ}/channels`);
        const target = resolveChannelForServer(serverQ, list);
        if (!target) {
          navigate(`/servers/${serverQ}`, { replace: true });
        } else {
          navigate(channelHref(target, serverQ), { replace: true });
        }
      } catch {
        navigate(`/servers/${serverQ}`, { replace: true });
      } finally {
        setRealigning(false);
      }
    })();
  });

  return (
    <Show when={!channel.loading && !realigning()} fallback={<p class="main">A carregar canal…</p>}>
      <Show when={channel()} fallback={<p class="main">Canal não encontrado.</p>}>
        {(ch) => (
          <Show
            when={ch().type === "voice_video"}
            fallback={<ChannelPage me={props.me} channel={ch()} identity={props.identity} onWs={props.onWs} />}
          >
            <VoiceChannel
              me={props.me}
              channel={ch()}
              identity={props.identity}
              onWs={props.onWs}
            />
          </Show>
        )}
      </Show>
    </Show>
  );
}
