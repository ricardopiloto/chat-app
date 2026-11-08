// A voice channel joins once when its keyed screen mounts. Failed joins wait for an explicit retry.
import { Match, Switch, createSignal, onCleanup, onMount } from "solid-js";
import type { Channel } from "../api";
import { Button } from "../components/ui";
import { t } from "../i18n";
import { useShell } from "../shell/state";
import { Stage } from "./Stage";
import { useCall } from "./callSession";
import { prefs } from "./devices";

export function VoicePage(props: { channel: Channel }) {
  const call = useCall();
  const shell = useShell();
  const channelId = props.channel.id;
  const [preparing, setPreparing] = createSignal(true);
  let disposed = false;
  let pending = false;
  const inThisCall = () => call.live() && call.channelId() === channelId;
  const connectingHere = () => call.status() === "connecting" && call.channelId() === channelId;

  async function join() {
    if (disposed || pending) return;
    pending = true;
    setPreparing(true);
    try {
      const channel = shell.channel();
      if (!channel || channel.id !== channelId) return;
      const canSpeak = shell.owner() || channel.my_permission === "speak";
      await call.join({ channel, mode: canSpeak ? "full" : "listen", mic: canSpeak && prefs.micOn(), cam: false }, { valid: () => !disposed });
    } finally {
      pending = false;
      if (!disposed) setPreparing(false);
    }
  }

  onMount(() => {
    void (async () => {
      // Resolve current effective permissions before choosing full or listen mode.
      await Promise.allSettled([shell.refreshChannels(), shell.refreshRoles()]);
      if (!disposed && !inThisCall()) await join();
      else if (!disposed) setPreparing(false);
    })();
  });
  onCleanup(() => {
    disposed = true;
    if (connectingHere()) void call.leave();
  });

  return (
    <Switch>
      <Match when={inThisCall()}>
        <Stage channel={props.channel} />
      </Match>
      <Match when={preparing() || connectingHere()}>
        <p class="call-connecting" role="status">{t("call.connecting")}</p>
      </Match>
      <Match when={call.problem()}>
        {(problem) => (
          <div class="call-join-error" role="alert">
            <p class="call-inline-error">{t(`call.problem.${problem()}`)}</p>
            <div class="call-join-actions">
              <Button variant="primary" onClick={() => void join()}>{t("call.joinRetry")}</Button>
              <Button variant="secondary" onClick={() => shell.go("/account#audio-video")}>{t("call.settings.nav")}</Button>
            </div>
          </div>
        )}
      </Match>
    </Switch>
  );
}
