// Joins what LiveKit knows about a participant (tracks, mic) with what the server knows about the
// account (handle, avatar), so every view can draw the same person the same way.
import { createMemo } from "solid-js";
import { avatarUrl } from "../api";
import { publicDisplayLabel } from "../lib/displayName";
import { useShell } from "../shell/state";
import { useCall } from "./callSession";
import type { TileData } from "./tiles";

export function useCallPeople() {
  const call = useCall();
  const shell = useShell();
  const roster = () => {
    const id = call.channelId();
    return id ? shell.voiceRoster()[id] ?? [] : [];
  };
  const people = createMemo<TileData[]>(() =>
    call.participants().map((p) => {
      const known = roster().find((o) => o.account_id === p.id);
      return {
        id: p.id,
        name: known ? publicDisplayLabel(known.handle, known.display_name) : p.name,
        handle: known?.handle,
        avatar: known?.has_avatar ? avatarUrl(p.id) : undefined,
        camera: p.camera,
        micOn: p.micOn,
        listener: p.listener,
        isLocal: p.isLocal,
      };
    }),
  );
  const screens = createMemo(() => call.participants().filter((p) => p.screen).map((p) => ({ id: p.id, track: p.screen!, owner: people().find((x) => x.id === p.id) })));
  const byId = (id: string | null | undefined) => (id ? people().find((p) => p.id === id) : undefined);
  return { people, screens, byId };
}
