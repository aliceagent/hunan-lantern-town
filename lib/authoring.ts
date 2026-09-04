/**
 * Helpers for the "Add path" authoring utility: mapping a rectangle drawn in
 * CSS pixels over the letterboxed stage back into still pixel space (the same
 * coordinate space as manifest `region.bbox`), and formatting the
 * Telegram-pasteable block. Pure — no DOM — so the letterbox math is testable;
 * getting it wrong would hand the studio bboxes in the wrong space.
 */

/** How object-contain places a frame in a container: uniform scale + centered offsets. */
export interface ContainLayout {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function containLayout(
  containerW: number,
  containerH: number,
  frameW: number,
  frameH: number,
): ContainLayout {
  const scale = Math.min(containerW / frameW, containerH / frameH);
  return {
    scale,
    offsetX: (containerW - frameW * scale) / 2,
    offsetY: (containerH - frameH * scale) / 2,
  };
}

/** Two drag corners in container CSS pixels, in any order. */
export interface CssRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * A drag rectangle in container CSS pixels → `[x, y, w, h]` in still pixels,
 * clamped to the painted area (a drag that starts in the letterbox void keeps
 * only its intersection with the painting). Null when nothing paintable
 * remains — a zero-size tap, or a rect entirely in the void.
 */
export function cssRectToStillBbox(
  rect: CssRect,
  containerW: number,
  containerH: number,
  frameW: number,
  frameH: number,
): [number, number, number, number] | null {
  if (containerW <= 0 || containerH <= 0 || frameW <= 0 || frameH <= 0) return null;
  const { scale, offsetX, offsetY } = containLayout(containerW, containerH, frameW, frameH);
  const toStillX = (cssX: number) => Math.min(frameW, Math.max(0, (cssX - offsetX) / scale));
  const toStillY = (cssY: number) => Math.min(frameH, Math.max(0, (cssY - offsetY) / scale));
  // Round each edge (not x + w separately) so x+w can never exceed the frame.
  const left = Math.round(toStillX(Math.min(rect.x1, rect.x2)));
  const right = Math.round(toStillX(Math.max(rect.x1, rect.x2)));
  const top = Math.round(toStillY(Math.min(rect.y1, rect.y2)));
  const bottom = Math.round(toStillY(Math.max(rect.y1, rect.y2)));
  const w = right - left;
  const h = bottom - top;
  if (w < 1 || h < 1) return null;
  return [left, top, w, h];
}

/** The block copied for Telegram. Keep it tight — it is pasted into chat as-is. */
export function addPathBlock(input: {
  frameHash: string;
  locationId?: string;
  locationName?: string;
  stillWidth: number;
  stillHeight: number;
  bbox: [number, number, number, number];
}): string {
  const location = input.locationId
    ? input.locationName
      ? `${input.locationId} (${input.locationName})`
      : input.locationId
    : "unknown";
  return [
    "ADD PATH",
    `frame: ${input.frameHash}`,
    `location: ${location}`,
    `still: ${input.stillWidth}x${input.stillHeight}`,
    `bbox: [${input.bbox.join(", ")}]`,
    "ACTION: ",
  ].join("\n");
}
