import { createSignal, onCleanup } from "solid-js";

/** A brief status line: `flash(text)` shows it and clears it again after `lifetimeMs`. */
export function createToast(lifetimeMs = 2600) {
  const [message, setMessage] = createSignal("");
  let pending: number | undefined;
  const clear = () => window.clearTimeout(pending);
  onCleanup(clear);
  return {
    message,
    flash(text: string) {
      clear();
      setMessage(text);
      pending = window.setTimeout(() => setMessage(""), lifetimeMs);
    },
  };
}
