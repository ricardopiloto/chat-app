import { createSignal, onCleanup } from "solid-js";

/** Copy-to-clipboard with a short-lived "copied" flag for button feedback. */
export function createCopy() {
  const [copied, setCopied] = createSignal(false);
  let timer: number | undefined;
  onCleanup(() => window.clearTimeout(timer));
  async function copy(text: string) {
    try {
      await Promise.race([
        navigator.clipboard.writeText(text),
        new Promise((_, reject) => window.setTimeout(reject, 1000)),
      ]);
    } catch {
      const input = document.createElement("textarea");
      input.value = text;
      document.body.append(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    window.clearTimeout(timer);
    timer = window.setTimeout(() => setCopied(false), 1800);
  }
  return { copied, copy };
}
