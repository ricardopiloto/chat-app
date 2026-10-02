// A voice channel's screen. In this call: the stage. Otherwise: the green room, which also covers
// switching channels, since joining another channel leaves the one you were in.
import { Match, Switch } from "solid-js";
import type { Channel } from "../api";
import { t } from "../i18n";
import { GreenRoom } from "./GreenRoom";
import { Stage } from "./Stage";
import { useCall } from "./callSession";

export function VoicePage(props: { channel: Channel }) {
  const call = useCall();
  const inThisCall = () => call.live() && call.channelId() === props.channel.id;
  const connectingHere = () => call.status() === "connecting" && call.channelId() === props.channel.id;
  return (
    <Switch>
      <Match when={inThisCall()}>
        <Stage channel={props.channel} />
      </Match>
      <Match when={connectingHere()}>
        <p class="call-connecting" role="status">{t("call.connecting")}</p>
      </Match>
      <Match when={true}>
        <GreenRoom channel={props.channel} />
      </Match>
    </Switch>
  );
}
