/**
 * Pure geometry helpers for rendering authored polygons (§5.3, D5) as SVG.
 * No DOM, no React — the hotspot layer is the only caller.
 */

export type Point = readonly [number, number];

/** `M x,y L x,y … Z` for a `<path d>` — polygons are always closed. */
export function polygonToPath(polygon: readonly Point[]): string {
  if (polygon.length === 0) return "";
  const [first, ...rest] = polygon;
  const move = `M${first[0]},${first[1]}`;
  const lines = rest.map(([x, y]) => `L${x},${y}`).join(" ");
  return lines ? `${move} ${lines} Z` : `${move} Z`;
}

/** Centroid of the polygon's vertices — good enough to anchor a name chip. */
export function polygonCentroid(polygon: readonly Point[]): Point {
  if (polygon.length === 0) return [0, 0];
  const sum = polygon.reduce(
    (acc, [x, y]) => [acc[0] + x, acc[1] + y] as const,
    [0, 0] as const,
  );
  return [sum[0] / polygon.length, sum[1] / polygon.length];
}
