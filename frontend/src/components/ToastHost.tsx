import { Show } from "solid-js";
import { toastNotice } from "../ui/toast";

export default function ToastHost() {
  return (
    <Show when={toastNotice()}>
      {(msg) => (
        <div class="app-toast" role="status" aria-live="polite">
          {msg()}
        </div>
      )}
    </Show>
  );
}
