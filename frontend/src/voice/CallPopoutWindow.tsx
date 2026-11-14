// The native popout: a second window with its own LiveKit room, showing only the grid,
// plus relayed controls that act on the owning main-window call.
import { Match, Show, Switch, createSignal, onCleanup, onMount } from "solid-js";
import { Icon } from "../components/ui";
import { fromB64 } from "../crypto/identity";
import { rememberServerKey } from "../crypto/serverKey";
import { t } from "../i18n";
import { ShellProvider, type ShellState } from "../shell/state";
import { CallProvider, useCall } from "./callSession";
import { GridView } from "./GridView";
import { ConnectionQualityGlyph } from "./tiles";

const shell = { voiceRoster: () => ({}) } as ShellState;

function PopoutControls(props: { channelId: string }) {
  const [owner, setOwner] = createSignal<CallPopoutOwnerState | null>(null);
  const [hovering, setHovering] = createSignal(false);
  const [focusWithin, setFocusWithin] = createSignal(false);
  const visible = () => hovering() || focusWithin();
  const ready = () => {
    const state = owner();
    return Boolean(state?.available && state.channelId === props.channelId && state.live);
  };
  const listenOnly = () => owner()?.canSpeak === false;

  const send = (command: CallPopoutCommand) => {
    window.mesaNative?.sendCallPopoutCommand(command);
  };

  onMount(() => {
    window.mesaNative?.requestCallPopoutOwnerState(props.channelId);
    const stop = window.mesaNative?.onCallPopoutOwnerState((state) => {
      if (state.channelId !== props.channelId) return;
      setOwner(state);
    });
    onCleanup(() => stop?.());
  });

  return (
    <div
      class="call-popout-shell"
      classList={{ "is-controls-visible": visible() }}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
    >
      <main class="call-popout">
        <GridView fill />
      </main>
      <div
        class="call-popout-controls"
        role="group"
        aria-label={t("call.controls")}
        onFocusIn={() => setFocusWithin(true)}
        onFocusOut={(event) => {
          const next = event.relatedTarget as Node | null;
          if (!event.currentTarget.contains(next)) setFocusWithin(false);
        }}
      >
        <Show when={!ready()}>
          <p class="call-popout-controls-note" role="status">{t("call.popout.ownerUnavailable")}</p>
        </Show>
        <Show when={ready() && owner()?.quality}>
          <ConnectionQualityGlyph level={owner()!.quality} />
        </Show>
        <button
          type="button"
          class="call-control"
          classList={{ off: !(owner()?.mic ?? false) }}
          aria-pressed={owner()?.mic ?? false}
          disabled={!ready() || listenOnly()}
          title={listenOnly() ? t("call.listenOnlyWhy") : owner()?.mic ? t("call.mute") : t("call.unmute")}
          aria-label={listenOnly() ? t("call.listenOnlyWhy") : owner()?.mic ? t("call.mute") : t("call.unmute")}
          onClick={() => send({ channelId: props.channelId, action: "setMic", value: !(owner()?.mic ?? false) })}
        >
          <Icon name={owner()?.mic ? "mic" : "mic_off"} />
        </button>
        <button
          type="button"
          class="call-control"
          classList={{ off: owner()?.deafened ?? false }}
          aria-pressed={owner()?.deafened ?? false}
          disabled={!ready()}
          title={owner()?.deafened ? t("call.undeafen") : t("call.deafen")}
          aria-label={owner()?.deafened ? t("call.undeafen") : t("call.deafen")}
          onClick={() => send({ channelId: props.channelId, action: "toggleDeafened" })}
        >
          <Icon name={owner()?.deafened ? "headset_off" : "headset_mic"} />
        </button>
        <button
          type="button"
          class="call-control"
          classList={{ off: !(owner()?.cam ?? false) }}
          aria-pressed={owner()?.cam ?? false}
          disabled={!ready() || listenOnly()}
          title={listenOnly() ? t("call.listenOnlyWhy") : owner()?.cam ? t("call.camOff") : t("call.camOn")}
          aria-label={listenOnly() ? t("call.listenOnlyWhy") : owner()?.cam ? t("call.camOff") : t("call.camOn")}
          onClick={() => send({ channelId: props.channelId, action: "setCam", value: !(owner()?.cam ?? false) })}
        >
          <Icon name={owner()?.cam ? "videocam" : "videocam_off"} />
        </button>
        <button
          type="button"
          class="call-control hangup"
          disabled={!ready()}
          title={t("call.hangup")}
          aria-label={t("call.hangup")}
          onClick={() => send({ channelId: props.channelId, action: "leave" })}
        >
          <Icon name="call_hangup" class="call-hangup-icon" />
        </button>
      </div>
    </div>
  );
}

function PopoutStage(props: { request: { channelId: string; serverId: string; e2ee: boolean } }) {
  const call = useCall();
  return (
    <Show
      when={call.problem()}
      fallback={<PopoutControls channelId={props.request.channelId} />}
    >
      {(problem) => (
        <main class="call-popout-status">
          <p class="call-inline-error" role="alert">{t(`call.problem.${problem()}`)}</p>
          <div class="call-actions">
            <button type="button" class="call-action primary" onClick={() => void call.watch(props.request)}>
              {t("call.popout.retry")}
            </button>
            <button type="button" class="call-action" onClick={() => void window.mesaNative?.closeCallPopout()}>
              {t("call.popout.close")}
            </button>
          </div>
        </main>
      )}
    </Show>
  );
}

export function CallPopoutWindow(props: { channelId: string }) {
  const [watch, setWatch] = createSignal<{ channelId: string; serverId: string; e2ee: boolean } | null>(null);
  const [failed, setFailed] = createSignal(false);

  onMount(() => {
    void window.mesaNative?.takeCallPopout().then((handed) => {
      if (!handed || handed.channelId !== props.channelId) {
        setFailed(true);
        return;
      }
      if (handed.serverKey) rememberServerKey(handed.serverId, fromB64(handed.serverKey));
      setWatch({ channelId: handed.channelId, serverId: handed.serverId, e2ee: handed.e2ee });
    });
  });

  return (
    <Switch>
      <Match when={failed()}>
        <main class="call-popout-status">{t("call.popout.unavailable")}</main>
      </Match>
      <Match when={watch()}>
        {(request) => (
          <ShellProvider value={shell}>
            <CallProvider subscribe={() => () => undefined} watch={request()}>
              <PopoutStage request={request()} />
            </CallProvider>
          </ShellProvider>
        )}
      </Match>
      <Match when={true}>
        <main class="call-popout-status">{t("call.connecting")}</main>
      </Match>
    </Switch>
  );
}
