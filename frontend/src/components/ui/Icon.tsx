import { Show } from "solid-js";
import { iconMap } from "./icon-map";

export function Icon(props: { name: string; label?: string; class?: string; filled?: boolean }) {
  return (
    <Show when={iconMap[props.name]} keyed>
      {(Glyph) => (
        <Glyph
          fill={props.filled ? "currentColor" : "none"}
          class={`ui-icon ${props.class ?? ""}`}
          role={props.label ? "img" : undefined}
          aria-label={props.label}
        />
      )}
    </Show>
  );
}
