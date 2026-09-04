import { describe, expect, it } from "vitest";
import {
  Manifest,
  loadManifest,
  parseManifest,
  safeParseManifest,
  validateGraph,
} from "../manifest";
import { richFixture, s1Fixture } from "./fixtures";

/** Structured clone with a `any` face, so tests can break the graph on purpose. */
function broken(): any {
  return structuredClone(richFixture());
}

describe("Manifest schema", () => {
  it("accepts the shipped S1 manifest", () => {
    const manifest = parseManifest(s1Fixture());
    expect(manifest.meta.mediaBase).toBe("/media");
    expect(Object.keys(manifest.frames).length).toBeGreaterThanOrEqual(16);
  });

  it("accepts a rich manifest with an NPC, a cold region and a warm edge", () => {
    const manifest = parseManifest(richFixture());
    expect(manifest.npcs["uncle-chen"].nameZh).toBe("陈伯");
    expect(manifest.frames["bbbb000000000001"].regions).toHaveLength(3);
    expect(manifest.frames["bbbb000000000001"].edges).toEqual({
      "red-lanterns": "cccc000000000001",
    });
  });

  it("accepts populated v2 tags and dialogue (the shape is frozen in v1)", () => {
    const m = broken();
    m.frames["bbbb000000000001"].regions[0].tags = [
      { zh: "灯笼", pinyin: "dēnglong", en: "lantern", audio: "aabbccddeeff0011" },
    ];
    m.npcs["uncle-chen"].dialogue = [
      {
        zh: "早上好。",
        pinyin: "Zǎoshang hǎo.",
        en: "Good morning.",
        audio: null,
        speaker: "uncle-chen",
      },
    ];
    expect(() => parseManifest(m)).not.toThrow();
  });

  it("rejects malformed hashes", () => {
    for (const bad of ["AAAA000000000001", "aaaa", "aaaa00000000000g", ""]) {
      const m = broken();
      m.meta.start.frame = bad;
      expect(safeParseManifest(m).success, `start.frame ${bad}`).toBe(false);
    }
  });

  it("rejects frame keys that are not content hashes", () => {
    const m = broken();
    m.frames["not-a-hash"] = m.frames["bbbb000000000002"];
    expect(safeParseManifest(m).success).toBe(false);
  });

  it("rejects non-kebab ids, including the old obj: prefix (errata #10)", () => {
    const m = broken();
    m.frames["bbbb000000000001"].regions[0].objectId = "obj:red-lantern";
    expect(safeParseManifest(m).success).toBe(false);

    const m2 = broken();
    m2.frames["bbbb000000000001"].regions[0].id = "Red_Lanterns";
    expect(safeParseManifest(m2).success).toBe(false);
  });

  it("rejects unknown fields anywhere (schema drift must fail loudly)", () => {
    const m = broken();
    m.frames["bbbb000000000001"].regions[0].colour = "red";
    expect(safeParseManifest(m).success).toBe(false);
  });

  it("ties region.npc to kind", () => {
    const withoutNpc = broken();
    withoutNpc.frames["bbbb000000000001"].regions[2].npc = null;
    expect(safeParseManifest(withoutNpc).success).toBe(false);

    const hotspotWithNpc = broken();
    hotspotWithNpc.frames["bbbb000000000001"].regions[0].npc = "uncle-chen";
    expect(safeParseManifest(hotspotWithNpc).success).toBe(false);
  });

  it("bounds polygons at 3..40 points (D5)", () => {
    const tooFew = broken();
    tooFew.frames["bbbb000000000001"].regions[0].polygon = [
      [0, 0],
      [1, 1],
    ];
    expect(safeParseManifest(tooFew).success).toBe(false);

    const tooMany = broken();
    tooMany.frames["bbbb000000000001"].regions[0].polygon = Array.from({ length: 41 }, (_, i) => [
      i,
      i,
    ]);
    expect(safeParseManifest(tooMany).success).toBe(false);
  });

  it("rejects duplicate region ids within a frame", () => {
    const m = broken();
    const frame = m.frames["bbbb000000000001"];
    frame.regions.push(structuredClone(frame.regions[0]));
    expect(safeParseManifest(m).success).toBe(false);
  });

  it("rejects a mediaBase with a trailing slash", () => {
    const m = broken();
    m.meta.mediaBase = "https://media.example.com/";
    expect(safeParseManifest(m).success).toBe(false);
  });

  it("is exported as reusable zod schemas", () => {
    expect(Manifest.safeParse(richFixture()).success).toBe(true);
  });
});

describe("validateGraph", () => {
  it("passes both fixtures", () => {
    expect(validateGraph(parseManifest(s1Fixture()))).toEqual([]);
    expect(validateGraph(parseManifest(richFixture()))).toEqual([]);
  });

  it("names a dangling edge's missing clip", () => {
    const m = broken();
    m.frames["bbbb000000000001"].edges["red-lanterns"] = "dddd000000000009";
    const errors = validateGraph(parseManifest(m));
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("dddd000000000009");
    expect(errors[0]).toContain("red-lanterns");
  });

  it("names a clip whose destination frame is missing", () => {
    const m = broken();
    m.clips["cccc000000000001"].to = "eeee000000000009";
    const errors = validateGraph(parseManifest(m));
    expect(errors.join("\n")).toContain("cccc000000000001");
    expect(errors.join("\n")).toContain("eeee000000000009");
  });

  it("names an edge whose region does not exist on the frame", () => {
    const m = broken();
    m.frames["bbbb000000000001"].edges["ghost-region"] = "cccc000000000001";
    const errors = validateGraph(parseManifest(m));
    expect(errors.join("\n")).toContain("ghost-region");
  });

  it("names a clip whose from/region disagree with the edge that uses it", () => {
    const m = broken();
    m.clips["cccc000000000001"].region = "moored-boat";
    const errors = validateGraph(parseManifest(m));
    expect(errors.join("\n")).toContain("cccc000000000001");
    expect(errors.join("\n")).toContain("moored-boat");
  });

  it("names a start frame that does not exist", () => {
    const m = broken();
    m.meta.start.frame = "ffff000000000009";
    const errors = validateGraph(parseManifest(m));
    expect(errors.join("\n")).toContain("ffff000000000009");
  });

  it("names a frame with an unknown location", () => {
    const m = broken();
    m.frames["bbbb000000000002"].location = "nowhere-at-all";
    const errors = validateGraph(parseManifest(m));
    expect(errors.join("\n")).toContain("nowhere-at-all");
    expect(errors.join("\n")).toContain("bbbb000000000002");
  });

  it("names an npc region pointing at an unknown npc", () => {
    const m = broken();
    m.frames["bbbb000000000001"].regions[2].npc = "aunt-mei";
    const errors = validateGraph(parseManifest(m));
    expect(errors.join("\n")).toContain("aunt-mei");
    expect(errors.join("\n")).toContain("ferryman");
  });

  it("names a frame whose key and hash field disagree", () => {
    const m = broken();
    m.frames["bbbb000000000002"].hash = "bbbb000000000003";
    const errors = validateGraph(parseManifest(m));
    expect(errors.join("\n")).toContain("bbbb000000000002");
  });

  it("names duplicate location ids", () => {
    const m = broken();
    m.locations.push(structuredClone(m.locations[0]));
    const errors = validateGraph(parseManifest(m));
    expect(errors.join("\n")).toContain("arched-moon-bridge");
  });
});

describe("loadManifest", () => {
  it("parses and graph-checks in one step", () => {
    expect(() => loadManifest(s1Fixture())).not.toThrow();
  });

  it("throws with the offending id in the message", () => {
    const m = broken();
    m.frames["bbbb000000000001"].edges["red-lanterns"] = "dddd000000000009";
    expect(() => loadManifest(m)).toThrow(/dddd000000000009/);
  });
});
