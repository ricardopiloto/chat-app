/**
 * Safe HTMLMediaElement.play() — ignore AbortError / autoplay blocks.
 * Migrated surfaces: inventory C7.
 */
export function safePlay(el: HTMLMediaElement | null | undefined): void {
  if (!el?.play) return;
  void el.play().catch(() => undefined);
}

/** 096: retry play on all media under a host (undeafen / user gesture recovery). */
export function resumeMediaUnder(host: ParentNode | null | undefined): void {
  if (!host) return;
  for (const el of host.querySelectorAll("audio, video")) {
    if (!(el instanceof HTMLMediaElement)) continue;
    el.muted = el instanceof HTMLVideoElement ? el.muted : false;
    safePlay(el);
  }
}
