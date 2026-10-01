import { Show, type JSX } from "solid-js";

const FieldError = (props: { text?: string }) => (
  <Show when={props.text}>
    <small class="field-error" role="alert">
      {props.text}
    </small>
  </Show>
);

export function TextField(props: {
  label: string;
  value?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  type?: string;
  onInput?: JSX.EventHandlerUnion<HTMLInputElement, InputEvent>;
}) {
  return (
    <label class="field">
      <span>{props.label}</span>
      <input
        type={props.type ?? "text"}
        value={props.value ?? ""}
        placeholder={props.placeholder}
        disabled={props.disabled}
        aria-invalid={!!props.error}
        onInput={props.onInput}
      />
      <FieldError text={props.error} />
    </label>
  );
}

export function Select(props: {
  label: string;
  children: JSX.Element;
  value?: string;
  disabled?: boolean;
  error?: string;
  onChange?: JSX.EventHandlerUnion<HTMLSelectElement, Event>;
}) {
  return (
    <label class="field">
      <span>{props.label}</span>
      <select value={props.value} disabled={props.disabled} aria-invalid={!!props.error} onChange={props.onChange}>
        {props.children}
      </select>
      <FieldError text={props.error} />
    </label>
  );
}

export function Radio(props: {
  name: string;
  value: string;
  checked?: boolean;
  disabled?: boolean;
  error?: string;
  children: JSX.Element;
  onChange?: JSX.EventHandlerUnion<HTMLInputElement, Event>;
}) {
  return (
    <label class="choice">
      <input
        type="radio"
        name={props.name}
        value={props.value}
        checked={props.checked}
        disabled={props.disabled}
        aria-invalid={!!props.error}
        onChange={props.onChange}
      />
      <span>{props.children}</span>
      <FieldError text={props.error} />
    </label>
  );
}

export function Checkbox(props: {
  children: JSX.Element;
  checked?: boolean;
  disabled?: boolean;
  error?: string;
  onChange?: JSX.EventHandlerUnion<HTMLInputElement, Event>;
}) {
  return (
    <label class="choice">
      <input
        type="checkbox"
        checked={props.checked}
        disabled={props.disabled}
        aria-invalid={!!props.error}
        onChange={props.onChange}
      />
      <span>{props.children}</span>
      <FieldError text={props.error} />
    </label>
  );
}

// A toggle: the native checkbox stays in the tree (keyboard, screen readers) and is drawn as a track.
export function Switch(props: {
  label: string;
  checked?: boolean;
  disabled?: boolean;
  error?: string;
  onChange?: JSX.EventHandlerUnion<HTMLInputElement, Event>;
}) {
  return (
    <label class="switch">
      <input
        type="checkbox"
        role="switch"
        checked={props.checked}
        disabled={props.disabled}
        aria-invalid={!!props.error}
        onChange={props.onChange}
      />
      <span class="switch-track" aria-hidden="true" />
      <span>{props.label}</span>
      <FieldError text={props.error} />
    </label>
  );
}

// Segmented selector: one option active at a time, drawn as a single pill-shaped group.
export function Segmented<T extends string>(props: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  /** Stretch the options across the full width. */
  fill?: boolean;
}) {
  return (
    <div class="segmented" classList={{ fill: props.fill }} role="radiogroup" aria-label={props.label}>
      {props.options.map((option) => (
        <button
          type="button"
          role="radio"
          aria-checked={props.value === option.value}
          onClick={() => props.onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
