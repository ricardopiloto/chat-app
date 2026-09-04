import { Show, createResource } from "solid-js";
import { useParams, useSearchParams } from "@solidjs/router";
import { api, type Account, type Channel } from "../api/client";
import type { WsEnvelope } from "../api/ws";
import type { Identity } from "../crypto/identity";
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

  return (
    <Show when={!channel.loading} fallback={<p class="main">A carregar canal…</p>}>
      <Show when={channel()} fallback={<p class="main">Canal não encontrado.</p>}>
        {(ch) => (
          <Show
            when={ch().type === "voice_video"}
            fallback={<ChannelPage channel={ch()} identity={props.identity} onWs={props.onWs} />}
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

