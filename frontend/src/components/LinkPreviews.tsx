import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { unfurlUrl, type UnfurlResult } from "../api/client";

const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;

export function extractUrls(text: string, limit = 5): string[] {
  const found = text.match(URL_RE) ?? [];
  const unique: string[] = [];
  for (const u of found) {
    const cleaned = u.replace(/[.,;:!?)]+$/, "");
    if (!unique.includes(cleaned)) unique.push(cleaned);
    if (unique.length >= limit) break;
  }
  return unique;
}

type Props = {
  text: string;
};

export default function LinkPreviews(props: Props) {
  const [cards, setCards] = createSignal<UnfurlResult[]>([]);

  createEffect(() => {
    const urls = extractUrls(props.text);
    let cancelled = false;
    async function run() {
      setCards([]);
      const out: UnfurlResult[] = [];
      for (const url of urls) {
        try {
          const card = await unfurlUrl(url);
          if (cancelled) return;
          if (!card.error) out.push(card);
        } catch {
          /* degrade to plain link in text */
        }
      }
      if (!cancelled) setCards(out);
    }
    void run();
    onCleanup(() => {
      cancelled = true;
    });
  });

  return (
    <Show when={cards().length > 0}>
      <div class="link-previews">
        <For each={cards()}>
          {(c) => (
            <a class={`link-card link-card-${c.kind}`} href={c.url} target="_blank" rel="noopener noreferrer">
              <Show when={c.image_url}>
                {(src) => <img class="link-card-thumb" src={src()} alt="" loading="lazy" />}
              </Show>
              <div class="link-card-body">
                <div class="link-card-site">{c.site_name ?? new URL(c.url).hostname}</div>
                <Show when={c.title}>{(t) => <div class="link-card-title">{t()}</div>}</Show>
                <Show when={c.kind === "video"}>
                  <div class="link-card-kind">Vídeo</div>
                </Show>
              </div>
            </a>
          )}
        </For>
      </div>
    </Show>
  );
}
