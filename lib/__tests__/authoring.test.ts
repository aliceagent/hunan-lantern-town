import { describe, expect, it } from "vitest";
import { addPathBlock, containLayout, cssRectToStillBbox } from "../authoring";

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
