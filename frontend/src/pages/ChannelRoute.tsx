import { ErrorBoundary, Show, Suspense, createEffect, createResource, createSignal, lazy, onCleanup } from "solid-js";
import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { api, markChannelRead, type Account, type Channel } from "../api/client";
import type { LiveDeliveryStatus, WsEnvelope } from "../api/ws";
import type { Identity } from "../crypto/identity";
import { setActiveChannel } from "../preferences/activeChannel";
import {
  channelHref,
  resolveChannelForServer,
  writeLastChannel,
} from "../preferences/lastChannelByServer";
// Topbar session unseen clears on viewport / Limpar (071), not on channel enter.
// Server-rail unread uses BE has_unread (037).

const ChannelPage = lazy(() => import("./Channel"));
const VoiceChannel = lazy(() => import("./VoiceChannel"));

type Props = {
  me: Account;
  identity: Identity;
  onWs: (handler: (msg: WsEnvelope) => void) => () => void;
  deliveryStatus?: LiveDeliveryStatus;
};

function VoiceChannelLoadFallback() {
  return (
    <div class="pane voice-pane voice-module-load" role="status">
      <p class="muted" style={{ padding: "16px 24px" }}>
        A carregar canal de voz…
      </p>
    </div>
  );
}

function VoiceChannelLoadError(props: { reset: () => void }) {
  return (
    <div class="pane voice-pane voice-module-load" role="alert">
      <p class="error" style={{ padding: "16px 24px 8px" }}>
        Falha ao carregar o módulo de voz.
      </p>
      <div class="row" style={{ padding: "0 24px 16px", gap: "8px" }}>
        <button type="button" class="btn btn-primary" onClick={() => props.reset()}>
          Tentar de novo
        </button>
      </div>
    </div>
  );
}

export default function ChannelRoute(props: Props) {
  const params = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [realigning, setRealigning] = createSignal(false);

  const [channel, { mutate: mutateChannel }] = createResource(
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
    const onRenamed = (e: Event) => {
      const detail = (e as CustomEvent<{ channelId?: string; name?: string }>).detail;
      if (!detail?.channelId || detail.name == null) return;
      if (detail.channelId !== params.id) return;
      mutateChannel((ch) => (ch ? { ...ch, name: detail.name! } : ch));
    };
    window.addEventListener("mesa:channel-renamed", onRenamed);
    onCleanup(() => window.removeEventListener("mesa:channel-renamed", onRenamed));
  });

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
            fallback={
              <Suspense fallback={<p class="main">A carregar canal…</p>}>
                <ChannelPage
                  me={props.me}
                  channel={ch()}
                  identity={props.identity}
                  onWs={props.onWs}
                  deliveryStatus={props.deliveryStatus ?? "connected"}
                />
              </Suspense>
            }
          >
            <ErrorBoundary fallback={(_err, reset) => <VoiceChannelLoadError reset={reset} />}>
              <Suspense fallback={<VoiceChannelLoadFallback />}>
                <VoiceChannel
                  me={props.me}
                  channel={ch()}
                  identity={props.identity}
                  onWs={props.onWs}
                />
              </Suspense>
            </ErrorBoundary>
          </Show>
        )}
      </Show>
    </Show>
  );
}
