import { Show, type JSX } from "solid-js";
import { Icon } from "./Icon";

export function Avatar(props: { name: string; src?: string; online?: boolean; size?: "sm" | "md" | "lg" }) {
  return (
    <span class="avatar-wrap">
      <span class={`avatar ${props.size ?? "md"}`} title={props.name}>
        {props.src ? <img src={props.src} alt={props.name} /> : props.name.slice(0, 1).toUpperCase()}
      </span>
      <Show when={props.online !== undefined}>
        <span class={`presence ${props.online ? "online" : "offline"}`} aria-label={props.online ? "online" : "offline"} />
      </Show>
    </span>
  );
}

export type BadgeTone = "primary" | "secure" | "danger" | "neutral" | "live";

// Chip for state, encryption, live and role markers. `mono` switches to the technical label style
// used by the mockups: JetBrains Mono, upper case, tight tracking.
export function Badge(props: { children: JSX.Element; tone?: BadgeTone; mono?: boolean; icon?: string }) {
  return (
    <span class={`badge ${props.tone ?? "primary"}`} classList={{ mono: props.mono }}>
      <Show when={props.icon}>{(name) => <Icon name={name()} class="text-[14px]" />}</Show>
      {props.children}
    </span>
  );
}

/** Upper-case monospace caption for identifiers, states and metadata. */
export function MonoLabel(props: { children: JSX.Element; class?: string }) {
  return <span class={`mono-label ${props.class ?? ""}`}>{props.children}</span>;
}

export function Tooltip(props: { text: string; children: JSX.Element }) {
  return (
    <span class="tooltip-wrap">
      {props.children}
      <span role="tooltip">{props.text}</span>
    </span>
  );
}

// Card with the mockup header: icon, mono caption and title above the content.
export function Card(props: { icon?: string; label?: string; title?: string; children: JSX.Element }) {
  return (
    <section class="card">
      <Show when={props.icon || props.label || props.title}>
        <header>
          <Show when={props.icon}>{(name) => <Icon name={name()} class="card-icon" />}</Show>
          <div>
            <Show when={props.label}>{(text) => <MonoLabel>{text()}</MonoLabel>}</Show>
            <Show when={props.title}>{(text) => <h3>{text()}</h3>}</Show>
          </div>
        </header>
      </Show>
      {props.children}
    </section>
  );
}
