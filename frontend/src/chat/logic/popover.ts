/** Full height of the reaction emoji picker, including its search field and tabs. */
export const PICKER_HEIGHT_PX = 340;

/** Gap between the react button and the picker. Subtracted when the picker must shrink. */
const PICKER_GAP_PX = 4;

export interface PickerSpace {
  below: number;
  above: number;
}

export interface PickerPlacement {
  placement: "above" | "below";
  /** Set only when the picker must shrink to stay inside the visible list. */
  maxHeight?: number;
}

/**
 * Chooses which side of the react button can hold the picker.
 * Below wins when it fits, then above. When neither fits, the larger side wins
 * and equal space stays below. The reduced height leaves the 4px gap.
 */
export function pickPlacement(space: PickerSpace): PickerPlacement {
  if (space.below >= PICKER_HEIGHT_PX) return { placement: "below" };
  if (space.above >= PICKER_HEIGHT_PX) return { placement: "above" };
  const placement = space.above > space.below ? "above" : "below";
  const room = placement === "above" ? space.above : space.below;
  return { placement, maxHeight: Math.max(0, room - PICKER_GAP_PX) };
}
