import { readFlag, readString, writeFlag, writeString } from "../lib/localPrefs";

export type ViewMode = "composition" | "grid";

const VIEW_KEY = "mesa.viewMode";
const STAGE_KEY = "mesa.stageMode";
/* Preferred key for channels list drawer (055 / 078 always-expanded). */
const CHANNELS_LIST_KEY = "mesa.channelsListExpanded";
const MEMBERS_PANEL_KEY = "mesa.membersPanelOpen";

export function readViewMode(): ViewMode {
  const v = readString(VIEW_KEY);
  if (v === "composition" || v === "grid") return v;
  return "composition";
}

export function writeViewMode(mode: ViewMode): void {
  writeString(VIEW_KEY, mode);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mesa:view-mode", { detail: { mode } }));
  }
}

/** Subscribe to view-mode changes (082 panel screen-share gate). */
export function subscribeViewMode(cb: (mode: ViewMode) => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = (e: Event) => {
    const mode = (e as CustomEvent<{ mode?: string }>).detail?.mode;
    if (mode === "composition" || mode === "grid") cb(mode);
  };
  window.addEventListener("mesa:view-mode", handler);
  return () => window.removeEventListener("mesa:view-mode", handler);
}

export function readStageMode(): boolean {
  // 081: stage mode retired — always off
  return false;
}

export function writeStageMode(_on: boolean): void {
  writeFlag(STAGE_KEY, false);
}

/**
 * Channels list drawer expanded (desktop rail+lista).
 * 078: collapse deferred — always report expanded; ignore legacy stored false.
 */
export function readChannelsListExpanded(): boolean {
  return true;
}

/** 078: force expanded; writing false still persists expanded (clears collapse intent). */
export function writeChannelsListExpanded(_on: boolean): void {
  writeFlag(CHANNELS_LIST_KEY, true);
}

/** @deprecated Prefer readChannelsListExpanded — alias for call sites. */
export function readStageChannelsExpanded(): boolean {
  return readChannelsListExpanded();
}

/** @deprecated Prefer writeChannelsListExpanded — alias for call sites. */
export function writeStageChannelsExpanded(on: boolean): void {
  writeChannelsListExpanded(on);
}

/** Default false — members panel closed until user opens it. */
export function readMembersPanelOpen(): boolean {
  return readFlag(MEMBERS_PANEL_KEY);
}

export function writeMembersPanelOpen(on: boolean): void {
  writeFlag(MEMBERS_PANEL_KEY, on);
}
