/** Corner snap helpers for floating voice PiP (038). */

export type Corner = "top-right" | "top-left" | "bottom-right" | "bottom-left";

export const DEFAULT_CORNER: Corner = "top-right";

export const CORNER_CLASS: Record<Corner, string> = {
  "top-right": "voice-pip--tr",
  "top-left": "voice-pip--tl",
  "bottom-right": "voice-pip--br",
  "bottom-left": "voice-pip--bl",
};

/** Margin from app edges when anchored (px). */
export const PIP_MARGIN = 12;

/**
 * Pick the corner whose point is closest to the center of `pipRect`
 * within `containerRect` (app bounds).
 */
export function nearestCorner(pipRect: DOMRect, containerRect: DOMRect): Corner {
  const cx = pipRect.left + pipRect.width / 2;
  const cy = pipRect.top + pipRect.height / 2;
  const corners: { corner: Corner; x: number; y: number }[] = [
    { corner: "top-left", x: containerRect.left, y: containerRect.top },
    { corner: "top-right", x: containerRect.right, y: containerRect.top },
    { corner: "bottom-left", x: containerRect.left, y: containerRect.bottom },
    { corner: "bottom-right", x: containerRect.right, y: containerRect.bottom },
  ];
  let best: Corner = DEFAULT_CORNER;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const c of corners) {
    const dx = cx - c.x;
    const dy = cy - c.y;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = c.corner;
    }
  }
  return best;
}

/** Clamp free-drag top-left so the pip stays inside the container. */
export function clampPipPosition(
  left: number,
  top: number,
  pipW: number,
  pipH: number,
  containerW: number,
  containerH: number,
): { left: number; top: number } {
  const maxL = Math.max(PIP_MARGIN, containerW - pipW - PIP_MARGIN);
  const maxT = Math.max(PIP_MARGIN, containerH - pipH - PIP_MARGIN);
  return {
    left: Math.min(maxL, Math.max(PIP_MARGIN, left)),
    top: Math.min(maxT, Math.max(PIP_MARGIN, top)),
  };
}
