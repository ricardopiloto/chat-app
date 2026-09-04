export type ViewMode = "composition" | "grid";

const VIEW_KEY = "mesa.viewMode";
const STAGE_KEY = "mesa.stageMode";
const STAGE_CHANNELS_KEY = "mesa.stageChannelsExpanded";
const MEMBERS_PANEL_KEY = "mesa.membersPanelOpen";

export function readViewMode(): ViewMode {
  const v = localStorage.getItem(VIEW_KEY);
  if (v === "composition" || v === "grid") return v;
  return "composition";
}

export function writeViewMode(mode: ViewMode): void {
  localStorage.setItem(VIEW_KEY, mode);
}

export function readStageMode(): boolean {
  return localStorage.getItem(STAGE_KEY) === "1";
}

export function writeStageMode(on: boolean): void {
  localStorage.setItem(STAGE_KEY, on ? "1" : "0");
}

/** Default false — stage keeps channel column as a narrow strip. */
export function readStageChannelsExpanded(): boolean {
  return localStorage.getItem(STAGE_CHANNELS_KEY) === "1";
}

export function writeStageChannelsExpanded(on: boolean): void {
  localStorage.setItem(STAGE_CHANNELS_KEY, on ? "1" : "0");
}

/** Default false — members panel closed until user opens it. */
export function readMembersPanelOpen(): boolean {
  return localStorage.getItem(MEMBERS_PANEL_KEY) === "1";
}

export function writeMembersPanelOpen(on: boolean): void {
  localStorage.setItem(MEMBERS_PANEL_KEY, on ? "1" : "0");
}
