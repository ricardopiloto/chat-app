import { createSignal, onMount, type JSX } from "solid-js";
import { useParams } from "@solidjs/router";
import { pickEmptyServerJoke } from "../preferences/emptyServerJokes";

/** Blank main pane when the selected server has zero channels (041). */
export default function EmptyServerPane(): JSX.Element {
  const params = useParams();
  const [joke, setJoke] = createSignal("");

  onMount(() => {
    setJoke(pickEmptyServerJoke());
  });

  return (
    <div
      class="empty-server-pane main"
      role="status"
      aria-live="polite"
      data-server-id={params.serverId ?? ""}
    >
      <p class="empty-server-pane-joke">{joke() || "…"}</p>
    </div>
  );
}
