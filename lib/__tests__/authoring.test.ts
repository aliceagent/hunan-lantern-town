import { describe, expect, it } from "vitest";
import {
  addPathBlock,
  bboxesConflict,
  containLayout,
  cssRectToStillBbox,
  overlappingRegionIds,
  regionAabb,
  type StillBbox,
} from "../authoring";

describe("containLayout", () => {
  it("is identity when the container matches the frame", () => {
    expect(containLayout(1344, 768, 1344, 768)).toEqual({ scale: 1, offsetX: 0, offsetY: 0 });
  });

  it("letterboxes a wide frame in a tall container (void above and below)", () => {
    // 672×584 container, 1344×768 frame → scale 0.5, painted 672×384, 100px bands.
    expect(containLayout(672, 584, 1344, 768)).toEqual({ scale: 0.5, offsetX: 0, offsetY: 100 });
  });

  it("pillarboxes a wide container (void left and right)", () => {
    expect(containLayout(1000, 384, 1344, 768)).toEqual({ scale: 0.5, offsetX: 164, offsetY: 0 });
  });
});

describe("cssRectToStillBbox", () => {
  it("maps 1:1 when the container matches the frame", () => {
    expect(cssRectToStillBbox({ x1: 10, y1: 20, x2: 110, y2: 220 }, 1344, 768, 1344, 768)).toEqual(
      [10, 20, 100, 200],
    );
  });

  it("undoes scale and letterbox offset", () => {
    // scale 0.5, offsetY 100: the painted area spans css y 100..484.
    expect(cssRectToStillBbox({ x1: 0, y1: 100, x2: 672, y2: 484 }, 672, 584, 1344, 768)).toEqual(
      [0, 0, 1344, 768],
    );
    expect(cssRectToStillBbox({ x1: 336, y1: 292, x2: 436, y2: 342 }, 672, 584, 1344, 768)).toEqual(
      [672, 384, 200, 100],
    );
  });

  it("undoes a pillarbox offset", () => {
    // scale 0.5, offsetX 164: the painted area spans css x 164..836.
    expect(cssRectToStillBbox({ x1: 164, y1: 0, x2: 836, y2: 384 }, 1000, 384, 1344, 768)).toEqual(
      [0, 0, 1344, 768],
    );
  });

  it("is corner-order independent", () => {
    const forward = cssRectToStillBbox({ x1: 10, y1: 20, x2: 110, y2: 220 }, 1344, 768, 1344, 768);
    const reversed = cssRectToStillBbox({ x1: 110, y1: 220, x2: 10, y2: 20 }, 1344, 768, 1344, 768);
    expect(reversed).toEqual(forward);
  });

  it("clamps a drag that spills into the void to the painted area", () => {
    expect(cssRectToStillBbox({ x1: -50, y1: 0, x2: 700, y2: 600 }, 672, 584, 1344, 768)).toEqual(
      [0, 0, 1344, 768],
    );
  });

  it("never lets x+w or y+h exceed the frame", () => {
    const bbox = cssRectToStillBbox(
      { x1: 3.3, y1: 102.7, x2: 671.4, y2: 483.9 },
      672,
      584,
      1344,
      768,
    );
    expect(bbox).not.toBeNull();
    const [x, y, w, h] = bbox!;
    expect(x + w).toBeLessThanOrEqual(1344);
    expect(y + h).toBeLessThanOrEqual(768);
    expect(x).toBeGreaterThanOrEqual(0);
    expect(y).toBeGreaterThanOrEqual(0);
  });

  it("returns null for a tap (zero-size rect)", () => {
    expect(cssRectToStillBbox({ x1: 50, y1: 50, x2: 50, y2: 50 }, 1344, 768, 1344, 768)).toBeNull();
  });

  it("returns null for a rect entirely inside the letterbox void", () => {
    // Void band is css y 0..100 in this layout; the whole rect clamps flat.
    expect(cssRectToStillBbox({ x1: 10, y1: 10, x2: 200, y2: 90 }, 672, 584, 1344, 768)).toBeNull();
  });

  it("returns null on degenerate container or frame", () => {
    expect(cssRectToStillBbox({ x1: 0, y1: 0, x2: 10, y2: 10 }, 0, 584, 1344, 768)).toBeNull();
    expect(cssRectToStillBbox({ x1: 0, y1: 0, x2: 10, y2: 10 }, 672, 584, 0, 768)).toBeNull();
  });
});

describe("regionAabb", () => {
  it("prefers the bbox when present", () => {
    expect(
      regionAabb({
        id: "door",
        bbox: [10, 20, 30, 40],
        polygon: [
          [0, 0],
          [500, 0],
          [500, 500],
        ],
      }),
    ).toEqual([10, 20, 30, 40]);
  });

  it("falls back to the polygon's bounds", () => {
    expect(
      regionAabb({
        id: "lantern",
        polygon: [
          [100, 50],
          [300, 80],
          [200, 250],
        ],
      }),
    ).toEqual([100, 50, 200, 200]);
  });

  it("is null with neither shape", () => {
    expect(regionAabb({ id: "ghost" })).toBeNull();
    expect(regionAabb({ id: "ghost", bbox: null, polygon: [] })).toBeNull();
  });
});

describe("bboxesConflict", () => {
  const base: StillBbox = [100, 100, 200, 100];

  it("is false when boxes are clearly apart", () => {
    expect(bboxesConflict(base, [400, 100, 50, 50])).toBe(false);
    expect(bboxesConflict(base, [100, 300, 200, 100])).toBe(false);
  });

  it("is true on real overlap", () => {
    expect(bboxesConflict(base, [250, 150, 200, 100])).toBe(true);
    // Containment either way.
    expect(bboxesConflict(base, [150, 120, 20, 20])).toBe(true);
    expect(bboxesConflict(base, [0, 0, 1344, 768])).toBe(true);
  });

  it("counts a shared edge or corner — avoid conflict, not maximize packing", () => {
    // Right edge of base is x=300; a box starting exactly there grazes.
    expect(bboxesConflict(base, [300, 100, 50, 100])).toBe(true);
    // Corner touch at (300, 200).
    expect(bboxesConflict(base, [300, 200, 50, 50])).toBe(true);
  });

  it("is false with a 1px gap", () => {
    expect(bboxesConflict(base, [301, 100, 50, 100])).toBe(false);
    expect(bboxesConflict(base, [100, 201, 200, 50])).toBe(false);
  });

  it("is symmetric", () => {
    const other: StillBbox = [250, 150, 200, 100];
    expect(bboxesConflict(base, other)).toBe(bboxesConflict(other, base));
  });
});

describe("overlappingRegionIds", () => {
  const regions = [
    { id: "door", bbox: [0, 0, 100, 100] as const },
    { id: "boat", bbox: [500, 300, 200, 150] as const },
    {
      id: "lantern",
      polygon: [
        [1000, 100],
        [1100, 100],
        [1050, 250],
      ] as const,
    },
    { id: "ghost" }, // no shape: never conflicts
  ];

  it("returns every conflicting region id, in region order", () => {
    expect(overlappingRegionIds([50, 50, 1100, 100], regions)).toEqual(["door", "lantern"]);
  });

  it("is empty over clear space", () => {
    expect(overlappingRegionIds([200, 500, 100, 100], regions)).toEqual([]);
  });

  it("uses the polygon AABB for polygon-only regions", () => {
    expect(overlappingRegionIds([950, 200, 60, 60], regions)).toEqual(["lantern"]);
  });
});

describe("addPathBlock", () => {
  it("formats the tight Telegram block", () => {
    expect(
      addPathBlock({
        frameHash: "0af7e80235596dc2",
        locationId: "lantern-shops",
        locationName: "Lantern Shops",
        stillWidth: 1344,
        stillHeight: 768,
        bbox: [620, 40, 500, 680],
      }),
    ).toBe(
      [
        "ADD PATH",
        "frame: 0af7e80235596dc2",
        "location: lantern-shops (Lantern Shops)",
        "still: 1344x768",
        "bbox: [620, 40, 500, 680]",
        "ACTION: ",
      ].join("\n"),
    );
  });

  it("degrades to the id alone, then to unknown", () => {
    const base = {
      frameHash: "0af7e80235596dc2",
      stillWidth: 1344,
      stillHeight: 768,
      bbox: [1, 2, 3, 4] as [number, number, number, number],
    };
    expect(addPathBlock({ ...base, locationId: "lantern-shops" })).toContain(
      "location: lantern-shops\n",
    );
    expect(addPathBlock(base)).toContain("location: unknown\n");
  });
});
