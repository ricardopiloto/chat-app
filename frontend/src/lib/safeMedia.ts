/**
 * Safe HTMLMediaElement.play() — ignore AbortError / autoplay blocks.
 * Migrated surfaces: inventory C7.
 */
export function safePlay(el: HTMLMediaElement | null | undefined): void {
  if (!el?.play) return;
  void el.play().catch(() => undefined);
}
