// The channel's active scene as the stage sees it: loaded once, kept current by `grid.updated`, and
// saved through PATCH on the active scene by the channel creator; everyone else just follows.
import { createSignal, onCleanup } from "solid-js";
import { grid as gridApi, type GridLayout, type RealtimeEnvelope } from "../api";
import { emptyScene, fromWire, toWire, type Scene } from "./scene";

export function createSceneStore(channelId: () => string, subscribe: (h: (m: RealtimeEnvelope) => void) => () => void) {
  const [scene, setScene] = createSignal<Scene>(emptyScene());
  const [loaded, setLoaded] = createSignal(false);
  const [name, setName] = createSignal("");
  const [activeSceneId, setActiveSceneId] = createSignal("");
  let latest = 0;

  async function load() {
    const id = channelId();
    const ticket = ++latest;
    try {
      const wire = await gridApi.get(id);
      if (ticket === latest && id === channelId()) {
        setScene(fromWire(wire));
        setLoaded(true);
      }
    } catch {
      /* the stage keeps the last scene it had; the next event or reload refreshes it */
    }
  }
  void load();
  void gridApi.scenes(channelId()).then((list) => {
    setActiveSceneId(list.active_scene_id);
    setName(list.scenes.find((x) => x.id === list.active_scene_id)?.name ?? "");
  }).catch(() => undefined);

  const stop = subscribe((message) => {
    const mine = message.payload.channel_id === channelId();
    if (!mine) return;
    if (message.event === "grid.updated" && message.payload.grid) {
      latest++;
      setScene(fromWire(message.payload.grid as GridLayout));
      setLoaded(true);
    }
    if (message.event === "scene.changed") {
      if (typeof message.payload.active_scene_id === "string") setActiveSceneId(message.payload.active_scene_id);
      void load();
    }
  });
  onCleanup(stop);

  async function save(next: Scene): Promise<void> {
    const sceneId = activeSceneId() || (await gridApi.scenes(channelId())).active_scene_id;
    const saved = await gridApi.saveScene(channelId(), sceneId, toWire(next));
    latest++;
    setScene(fromWire(saved.layout));
  }

  return { scene, name, loaded, save, reload: load };
}

export type SceneStore = ReturnType<typeof createSceneStore>;
