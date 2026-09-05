import { Show, createEffect, createResource, onCleanup } from "solid-js";
import { useParams, useSearchParams } from "@solidjs/router";
import { api, type Account, type Channel } from "../api/client";
import type { WsEnvelope } from "../api/ws";
import type { Identity } from "../crypto/identity";
import { setActiveChannel } from "../preferences/activeChannel";
import { markSeen } from "../preferences/notifications";
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
      setActiveChannel({ id: ch.id, name: ch.name, type: ch.type });
    } else if (!channel.loading) {
      setActiveChannel(null);
    }
    onCleanup(() => setActiveChannel(null));
  });

  return (
    <Show when={!channel.loading} fallback={<p class="main">A carregar canal…</p>}>
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
