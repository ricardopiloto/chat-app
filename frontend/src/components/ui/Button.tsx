import type { JSX } from "solid-js";

export type ButtonVariant = "primary" | "secondary" | "danger" | "icon";

type ButtonProps = {
  variant?: ButtonVariant;
  children?: JSX.Element;
  onClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>;
  disabled?: boolean;
  title?: string;
  type?: "button" | "submit";
  class?: string;
  /** Marks the button a dialog should focus when it opens. */
  "data-autofocus"?: boolean;
};

// Pill-shaped button; the variant picks the colour role, "icon" is a round, borderless target.
export function Button(props: ButtonProps) {
  return (
    <button
      type={props.type ?? "button"}
      title={props.title}
      aria-label={props.variant === "icon" ? props.title : undefined}
      disabled={props.disabled}
      onClick={props.onClick}
      data-autofocus={props["data-autofocus"] ? "" : undefined}
      class={`ui-button ${props.variant ?? "secondary"} ${props.class ?? ""}`}
    >
      {props.children}
    </button>
  );
}
