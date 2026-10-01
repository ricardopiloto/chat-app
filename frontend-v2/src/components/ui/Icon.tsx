// Material Symbols Outlined is loaded as a font from index.html; a glyph is picked by its ligature name.
export function Icon(props: { name: string; label?: string; class?: string; filled?: boolean }) {
  return (
    <span
      class={`material-symbols-outlined select-none leading-none ${props.class ?? ""}`}
      style={props.filled ? { "font-variation-settings": "'FILL' 1" } : undefined}
      role={props.label ? "img" : undefined}
      aria-hidden={props.label ? undefined : "true"}
      aria-label={props.label}
    >
      {props.name}
    </span>
  );
}
