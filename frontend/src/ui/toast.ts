import { createSignal } from "solid-js";

const TOAST_MS = 4000;

const [toastNotice, setToastNotice] = createSignal<string | null>(null);
let dismissTimer: number | undefined;

export { toastNotice };

export function showToast(message: string) {
  setToastNotice(message);
  if (dismissTimer !== undefined) window.clearTimeout(dismissTimer);
  dismissTimer = window.setTimeout(() => {
    setToastNotice(null);
    dismissTimer = undefined;
  }, TOAST_MS);
}

export function clearToast() {
  if (dismissTimer !== undefined) {
    window.clearTimeout(dismissTimer);
    dismissTimer = undefined;
  }
  setToastNotice(null);
}
