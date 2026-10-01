import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { unfurlUrl, type UnfurlResult } from "../api/client";

const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;
export const MAX_PREVIEWS = 5;

export function extractUrls(text: string, limit = MAX_PREVIEWS): string[] {
  const unique: string[] = [];
  for (const raw of text.match(URL_RE) ?? []) {
    const cleaned = raw.replace(/[.,;:!?)]+$/, "");
    if (!unique.includes(cleaned)) unique.push(cleaned);
    if (unique.length >= limit) break;
  }
  return unique;
}

const httpUrl = (url?: string | null) =>
  url && /^https?:\/\//.test(url) ? url : undefined;
const hostname = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

export function LinkPreviews(props: { text: string }) {
  const [cards, setCards] = createSignal<UnfurlResult[]>([]);
  createEffect(() => {
    const urls = extractUrls(props.text);
    let cancelled = false;
    setCards([]);
    void (async () => {
      const out: UnfurlResult[] = [];
      for (const url of urls) {
        try {
          const card = await unfurlUrl(url);
          if (cancelled) return;
          if (!card.error) out.push(card);
        } catch {
          /* the link stays plain text */
        }
      }
      if (!cancelled) setCards(out);
    })();
    onCleanup(() => {
      cancelled = true;
    });
  });
  return (
    <Show when={cards().length > 0}>
      <div class="link-previews">
        <For each={cards()}>
          {(card) => (
            <a
              class="link-card"
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Show when={httpUrl(card.image_url)}>
                {(src) => (
                  <img
                    class="link-card-thumb"
                    src={src()}
                    alt=""
                    loading="lazy"
                  />
                )}
              </Show>
              <div class="link-card-body">
                <div class="link-card-site">
                  {card.site_name ?? hostname(card.url)}
                </div>
                <Show when={card.title}>
                  {(title) => <div class="link-card-title">{title()}</div>}
                </Show>
              </div>
            </a>
          )}
        </For>
      </div>
    </Show>
  );
}
