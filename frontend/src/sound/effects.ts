// The two sound effects (new mention, someone joined my call). One Audio element per effect, played on
// the output chosen in Audio & Video. Everything fails silently: a missing file, a refused autoplay or
// blocked storage must never reach the person or the rest of the app.
import { createSignal } from "solid-js";
import { readJson, writeJson } from "../lib/localPrefs";
import { prefs } from "../voice/devices";

export type Effect = "mention" | "callJoin";

const FILES: Record<Effect, string> = { mention: "/audio/mention.mp3", callJoin: "/audio/call-join.mp3" };
/** After one play, the same effect stays quiet for this long, so a burst is heard once. */
export const QUIET_MS: Record<Effect, number> = { mention: 3000, callJoin: 2000 };

/** Pure rate limit: the first request passes, later ones inside the quiet window are dropped. */
export function createQuietWindow(windows: Record<Effect, number>, now: () => number = Date.now) {
  const last: Partial<Record<Effect, number>> = {};
  return (effect: Effect): boolean => {
    const at = now();
    const before = last[effect];
    if (before !== undefined && at - before < windows[effect]) return false;
    last[effect] = at;
    return true;
  };
}

// --- preference ------------------------------------------------------------------------------
const STORE = "mesa.soundPrefs.v1";
const [enabled, setEnabledSignal] = createSignal<boolean>(readJson<{ enabled?: boolean }>(STORE, {}).enabled !== false);

export const soundPrefs = {
  enabled,
  setEnabled(on: boolean) {
    setEnabledSignal(on);
    writeJson(STORE, { enabled: on });
  },
};

// --- playback --------------------------------------------------------------------------------
const elements: Partial<Record<Effect, HTMLAudioElement>> = {};
const broken = new Set<Effect>();

function element(effect: Effect): HTMLAudioElement | null {
  if (broken.has(effect) || typeof Audio === "undefined") return null;
  let el = elements[effect];
  if (!el) {
    el = new Audio(FILES[effect]);
    el.preload = "auto";
    el.addEventListener("error", () => broken.add(effect));
    elements[effect] = el;
  }
  return el;
}

/** Loads both files ahead of the first notice, so the first sound is not delayed. */
export function preloadEffects(): void {
  try {
    element("mention");
    element("callJoin");
  } catch {
    /* no audio support: effects stay off */
  }
}

async function play(effect: Effect): Promise<void> {
  try {
    const el = element(effect);
    if (!el) return;
    const sink = prefs.outId();
    if (sink && "setSinkId" in el) {
      try {
        await (el as unknown as { setSinkId: (id: string) => Promise<void> }).setSinkId(sink);
      } catch {
        /* the saved output is gone: the default one is used */
      }
    }
    el.currentTime = 0;
    await el.play();
  } catch {
    /* autoplay refused or file unavailable */
  }
}

const quiet = createQuietWindow(QUIET_MS);

/** A real notice: honours the preference and the quiet window. */
export function notify(effect: Effect): void {
  if (!enabled() || !quiet(effect)) return;
  void play(effect);
}

/** The settings page "listen" button: ignores the preference and never touches the quiet window. */
export function preview(effect: Effect): void {
  void play(effect);
}
