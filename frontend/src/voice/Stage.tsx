// The live call screen: a header (name, live badge, duration, view switch, encryption chip, edit
// scene), the permanent encryption-off banner when it applies, and the view itself.
import { Match, Show, Switch, createSignal } from "solid-js";
import { Badge, Button, Icon, Segmented } from "../components/ui";
import type { Channel } from "../api";
import { t } from "../i18n";
import { useShell } from "../shell/state";
import { CompositionView } from "./CompositionView";
import { E2eeChip, E2eeOffBanner } from "./E2ee";
import { GridView } from "./GridView";
import { SceneEditor } from "./SceneEditor";
import { createElapsed, useCall } from "./callSession";
import { createSceneStore } from "./sceneStore";
import { callView, setCallView, type CallView } from "./view";

export function Stage(props: { channel: Channel }) {
  const call = useCall();
  const shell = useShell();
  const store = createSceneStore(() => props.channel.id, shell.subscribe);
  const [editing, setEditing] = createSignal(false);

  const since = () => {
    const server = shell.voiceCalls()[props.channel.id];
    return server ? Date.parse(server) : call.startedAt();
  };
  const elapsed = createElapsed(since);
  const count = () => call.participants().length;
  const listeners = () => call.participants().filter((p) => p.listener).length;
  const canEdit = () => shell.owner() && callView() === "composition" && !editing();

  const viewOptions = (): { value: CallView; label: string; icon: string }[] => [
    { value: "composition", label: t("call.view.composition"), icon: "view_quilt" },
    { value: "grid", label: t("call.view.grid"), icon: "grid_view" },
  ];

  return (
    <section class="call-screen" aria-label={props.channel.name}>
      <header class="call-bar">
        <span class="call-bar-icon" aria-hidden="true"><Icon name="headset_mic" class="text-[22px]" /></span>
        <div class="call-bar-title">
          <h1>{props.channel.name}</h1>
          <span class="call-bar-meta">
            <Badge tone="live" mono>{t("call.live")}</Badge>
            <time class="mono-label">{elapsed()}</time>
            <span>{listeners() > 0 ? t("call.participantsListening", { n: count() - listeners(), l: listeners() }) : t("call.participants", { n: count() })}</span>
          </span>
        </div>
        <span class="spacer" />
        <Show when={!editing()}>
          <Segmented label={t("call.view.label")} value={callView()} options={viewOptions()} onChange={setCallView} />
        </Show>
        <E2eeChip enabled={props.channel.e2ee_enabled} />
        <Show when={canEdit()}>
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Icon name="edit" class="text-[18px]" />
            {t("call.editScene")}
          </Button>
        </Show>
        <Show when={callView() === "grid" && !editing()}>
          <Show when={call.canSpeak()}>
            <Button variant="secondary" onClick={() => void call.setScreen(!call.screen())}>
              <Icon name={call.screen() ? "stop_screen_share" : "screen_share"} class="text-[18px]" />
              {call.screen() ? t("call.screenStop") : t("call.screenStart")}
            </Button>
          </Show>
          <Show when={shell.can("can_create_invites")}>
            <Button variant="primary" onClick={() => document.dispatchEvent(new Event("mesa:invite"))}>
              <Icon name="person_add" class="text-[18px]" />
              {t("call.invite")}
            </Button>
          </Show>
        </Show>
      </header>

      <Show when={!props.channel.e2ee_enabled}>
        <E2eeOffBanner channel={props.channel} />
      </Show>
      <Show when={call.status() === "reconnecting"}>
        <p class="call-notice" role="status">{t("call.reconnecting")}</p>
      </Show>
      <Show when={callView() === "composition" && call.participants().some((p) => p.screen && !p.isLocal)}>
        <p class="call-notice" role="status">
          <Icon name="present_to_all" class="text-[18px]" />
          {t("call.sharingElsewhere")}
          <button type="button" class="link" onClick={() => setCallView("grid")}>{t("call.view.grid")}</button>
        </p>
      </Show>
      <Show when={call.audioBlocked()}>
        <button type="button" class="call-notice action" onClick={() => void call.resumeAudio()}>
          <Icon name="volume_off" class="text-[18px]" />
          {t("call.audioBlocked")}
        </button>
      </Show>
      <Show when={call.notice()}>
        {(key) => (
          <p class="call-notice" role="status">
            {t(`call.notice.${key()}`)}
            <button type="button" class="link" onClick={() => call.clearNotice()}>{t("ui.close")}</button>
          </p>
        )}
      </Show>

      <div class="call-body">
        <Switch>
          <Match when={editing()}>
            <SceneEditor saved={store.scene()} name={store.name()} onSave={store.save} onClose={() => setEditing(false)} />
          </Match>
          <Match when={callView() === "grid"}>
            <GridView />
          </Match>
          <Match when={true}>
            <CompositionView scene={store.scene()} />
          </Match>
        </Switch>
      </div>
    </section>
  );
}
