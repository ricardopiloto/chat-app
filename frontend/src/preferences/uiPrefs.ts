export type ViewMode = "composition" | "grid";

const VIEW_KEY = "mesa.viewMode";
const STAGE_KEY = "mesa.stageMode";

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
