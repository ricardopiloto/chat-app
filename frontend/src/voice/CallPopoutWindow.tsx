// The native popout: a second window with its own LiveKit room, showing only the grid.
import { Match, Show, Switch, createSignal, onMount } from "solid-js";
import { fromB64 } from "../crypto/identity";
import { rememberServerKey } from "../crypto/serverKey";
import { t } from "../i18n";
import { ShellProvider, type ShellState } from "../shell/state";
import { CallProvider, useCall } from "./callSession";
import { GridView } from "./GridView";

const shell = { voiceRoster: () => ({}) } as ShellState;

function PopoutStage(props: { request: { channelId: string; serverId: string; e2ee: boolean } }) {
  const call = useCall();
  return (
    <Show
      when={call.problem()}
      fallback={
        <main class="call-popout">
          <GridView fill />
        </main>
      }
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
