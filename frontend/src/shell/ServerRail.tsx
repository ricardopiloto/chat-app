import { For, Show } from "solid-js";
import { serverImageUrl, type Server } from "../api/client";

type Props = {
  servers: Server[];
  selectedId: string | null;
  onSelect: (server: Server) => void;
  onCreate?: () => void;
  onContextMenu?: (server: Server, e: MouseEvent) => void;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0] ?? "";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const second = parts[1] ?? "";
  return ((first[0] ?? "") + (second[0] ?? "")).toUpperCase() || "?";
}

export default function ServerRail(props: Props) {
  return (
    <nav class="server-rail" aria-label="Servidores">
      <div class="server-rail-list">
        <For each={props.servers}>
          {(s) => (
            <button
              type="button"
              class={`server-rail-btn${s.id === props.selectedId ? " active" : ""}`}
              classList={{
                "has-unread": !!s.has_unread,
                "has-voice": !!s.has_voice,
              }}
              title={s.name}
              aria-label={
                [
                  s.name,
                  s.has_unread ? "mensagens não lidas" : null,
                  s.has_voice ? "voz activa" : null,
                ]
                  .filter(Boolean)
                  .join(", ")
              }
              aria-current={s.id === props.selectedId ? "true" : undefined}
              onClick={() => props.onSelect(s)}
              onContextMenu={(e) => {
                e.preventDefault();
                props.onContextMenu?.(s, e);
              }}
            >
              <Show when={s.has_unread}>
                <span class="server-rail-unread" aria-hidden="true" />
              </Show>
              <Show
                when={s.has_image}
                fallback={<span class="server-rail-glyph">{initials(s.name)}</span>}
              >
                <img
                  class="server-rail-glyph"
                  src={serverImageUrl(s.id)}
                  alt=""
                  draggable={false}
                />
              </Show>
              <Show when={s.has_voice}>
                <span class="server-rail-voice" aria-hidden="true" />
              </Show>
            </button>
          )}
        </For>
      </div>
      <button
        type="button"
        class="server-rail-btn server-rail-create"
        aria-label="Criar servidor"
        title="Criar servidor"
        onClick={() => props.onCreate?.()}
      >
        <span class="server-rail-glyph" aria-hidden="true">
          +
        </span>
      </button>
    </nav>
  );
}
