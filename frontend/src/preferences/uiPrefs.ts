import { readFlag, readString, writeFlag, writeString } from "../lib/localPrefs";

export type ViewMode = "composition" | "grid";

const VIEW_KEY = "mesa.viewMode";
const STAGE_KEY = "mesa.stageMode";
/** Preferred key for channels list drawer (055). */
const CHANNELS_LIST_KEY = "mesa.channelsListExpanded";
/** Legacy key — read fallback only. */
const LEGACY_STAGE_CHANNELS_KEY = "mesa.stageChannelsExpanded";
const MEMBERS_PANEL_KEY = "mesa.membersPanelOpen";

export function readViewMode(): ViewMode {
  const v = readString(VIEW_KEY);
  if (v === "composition" || v === "grid") return v;
  return "composition";
}

export function writeViewMode(mode: ViewMode): void {
  writeString(VIEW_KEY, mode);
}

export function readStageMode(): boolean {
  return readFlag(STAGE_KEY);
}

export function writeStageMode(on: boolean): void {
  writeFlag(STAGE_KEY, on);
}

/**
 * Channels list drawer expanded (desktop rail+lista).
 * Reads `mesa.channelsListExpanded`, then legacy `mesa.stageChannelsExpanded`.
 * Default true (expanded) when neither key is set.
 */
export function readChannelsListExpanded(): boolean {
  const raw = readString(CHANNELS_LIST_KEY);
  if (raw !== null) return raw === "1";
  const legacy = readString(LEGACY_STAGE_CHANNELS_KEY);
  if (legacy !== null) return legacy === "1";
  return true;
}

export function writeChannelsListExpanded(on: boolean): void {
  writeFlag(CHANNELS_LIST_KEY, on);
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
