import { createSignal, onCleanup } from "solid-js";

/** A short-lived message: `flash(text)` shows it for a couple of seconds. */
export function createToast(durationMs = 2600) {
  const [message, setMessage] = createSignal("");
  let timer: number | undefined;
  onCleanup(() => window.clearTimeout(timer));
  const flash = (text: string) => {
    setMessage(text);
    window.clearTimeout(timer);
    timer = window.setTimeout(() => setMessage(""), durationMs);
  };
  return { message, flash };
}
