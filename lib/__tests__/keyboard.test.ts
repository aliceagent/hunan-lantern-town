import { describe, expect, it } from "vitest";
import { applyClipEnd, initialState, jumpToTrailStep } from "../engine";
import {
  badgeLabel,
  deriveMode,
  hotspotForOrdinal,
  keyToAction,
  orderedHotspots,
} from "../keyboard";
import { parseManifest } from "../manifest";
import { richFixture } from "./fixtures";

const manifest = parseManifest(richFixture());
const START = manifest.frames["bbbb000000000001"];
const DEST = manifest.frames["bbbb000000000002"];
const CLIP = "cccc000000000001";

function ev(key: string, extra: Partial<Parameters<typeof keyToAction>[0]> = {}) {
  return {
    key,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    repeat: false,
    targetIsEditable: false,
    ...extra,
  };
}

describe("deriveMode", () => {
  it("priority: authoring > npc > menu > clip > explore", () => {
    expect(deriveMode({ authoring: true, npcOpen: true, menuOpen: true, phase: "playing" })).toBe(
      "authoring",
    );
    expect(deriveMode({ authoring: false, npcOpen: true, menuOpen: true, phase: "playing" })).toBe(
      "npc",
    );
    expect(deriveMode({ authoring: false, npcOpen: false, menuOpen: true, phase: "playing" })).toBe(
      "menu",
    );
    expect(deriveMode({ authoring: false, npcOpen: false, menuOpen: false, phase: "playing" })).toBe(
      "clip",
    );
    expect(deriveMode({ authoring: false, npcOpen: false, menuOpen: false, phase: "still" })).toBe(
      "explore",
    );
  });
});

describe("keyToAction explore", () => {
  it("maps the v1 keys", () => {
    expect(keyToAction(ev("`"), "explore")).toEqual({ type: "toggleNumbers" });
    expect(keyToAction(ev("1"), "explore")).toEqual({ type: "select", ordinal: 1 });
    expect(keyToAction(ev("0"), "explore")).toEqual({ type: "select", ordinal: 10 });
    expect(keyToAction(ev("Backspace"), "explore")).toEqual({ type: "back" });
    expect(keyToAction(ev("["), "explore")).toEqual({ type: "back" });
    expect(keyToAction(ev("Escape"), "explore")).toEqual({ type: "openMenu" });
    expect(keyToAction(ev("m"), "explore")).toEqual({ type: "toggleMute" });
    expect(keyToAction(ev("H"), "explore")).toEqual({ type: "hint" });
    expect(keyToAction(ev("p"), "explore")).toEqual({ type: "openPath" });
    expect(keyToAction(ev("f"), "explore")).toEqual({ type: "fullscreen" });
    expect(keyToAction(ev("x"), "explore")).toBeNull();
  });
});

describe("keyToAction modes", () => {
  it("authoring swallows every key", () => {
    for (const key of ["Backspace", "1", "`", "Escape", "m", "p"]) {
      expect(keyToAction(ev(key), "authoring")).toBeNull();
    }
  });

  it("clip: only mute", () => {
    expect(keyToAction(ev("1"), "clip")).toBeNull();
    expect(keyToAction(ev("Backspace"), "clip")).toBeNull();
    expect(keyToAction(ev("`"), "clip")).toBeNull();
    expect(keyToAction(ev("m"), "clip")).toEqual({ type: "toggleMute" });
  });

  it("npc/menu: digits and back ignored; Escape closes", () => {
    expect(keyToAction(ev("1"), "npc")).toBeNull();
    expect(keyToAction(ev("Backspace"), "menu")).toBeNull();
    expect(keyToAction(ev("Escape"), "npc")).toEqual({ type: "closeTop" });
    expect(keyToAction(ev("Escape"), "menu")).toEqual({ type: "closeTop" });
  });

  it("modifiers and editable targets are ignored", () => {
    expect(keyToAction(ev("1", { metaKey: true }), "explore")).toBeNull();
    expect(keyToAction(ev("1", { ctrlKey: true }), "explore")).toBeNull();
    expect(keyToAction(ev("1", { altKey: true }), "explore")).toBeNull();
    expect(keyToAction(ev("1", { targetIsEditable: true }), "explore")).toBeNull();
  });

  it("repeat does not machine-gun back or select", () => {
    expect(keyToAction(ev("Backspace", { repeat: true }), "explore")).toBeNull();
    expect(keyToAction(ev("1", { repeat: true }), "explore")).toBeNull();
  });
});

describe("orderedHotspots", () => {
  it("omits cold regions and is deterministic", () => {
    const a = orderedHotspots(manifest, START);
    const b = orderedHotspots(manifest, START);
    expect(a.map((r) => r.id)).toEqual(["red-lanterns", "ferryman"]);
    expect(b.map((r) => r.id)).toEqual(a.map((r) => r.id));
  });

  it("is empty on a world-edge still", () => {
    expect(orderedHotspots(manifest, DEST)).toEqual([]);
    expect(hotspotForOrdinal(manifest, DEST, 1)).toBeNull();
  });

  it("maps ordinals 1-based; out of range is null", () => {
    expect(hotspotForOrdinal(manifest, START, 1)?.id).toBe("red-lanterns");
    expect(hotspotForOrdinal(manifest, START, 2)?.id).toBe("ferryman");
    expect(hotspotForOrdinal(manifest, START, 7)).toBeNull();
  });

  it("row-bands similar y left-to-right", () => {
    const frame = structuredClone(START);
    frame.regions = [
      {
        ...START.regions[0],
        id: "right",
        polygon: [
          [800, 100],
          [900, 100],
          [900, 200],
          [800, 200],
        ],
      },
      {
        ...START.regions[0],
        id: "left",
        polygon: [
          [100, 110],
          [200, 110],
          [200, 210],
          [100, 210],
        ],
      },
    ];
    frame.edges = { right: CLIP, left: CLIP };
    expect(orderedHotspots(manifest, frame).map((r) => r.id)).toEqual(["left", "right"]);
  });
});

describe("badgeLabel", () => {
  it("1..9 then 0 for 10", () => {
    expect([...Array(10)].map((_, i) => badgeLabel(i + 1)).join("")).toBe("1234567890");
  });
});

describe("Backspace semantics", () => {
  it("after two advances, trail.length-2 is the previous still", () => {
    const once = applyClipEnd(manifest, initialState(manifest), CLIP);
    const back = jumpToTrailStep(manifest, once, once.trail.length - 2);
    expect(back.currentFrame).toBe("bbbb000000000001");
    expect(back.trail).toHaveLength(1);
    expect(back.moves).toBe(1);
  });

  it("on the start still, trail.length-2 is a no-op", () => {
    const s = initialState(manifest);
    expect(jumpToTrailStep(manifest, s, s.trail.length - 2)).toBe(s);
  });
});
