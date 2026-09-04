import { describe, expect, it } from "vitest";
import { applyClipEnd, initialState, isInteractive, resolveClick } from "../engine";
import { parseManifest } from "../manifest";
import { richFixture, s1Fixture } from "./fixtures";

const manifest = parseManifest(richFixture());
const START = "bbbb000000000001";
const DEST = "bbbb000000000002";
const CLIP = "cccc000000000001";

describe("initialState", () => {
  it("starts at meta.start with the start frame's location visited", () => {
    expect(initialState(manifest)).toEqual({
      currentFrame: START,
      moves: 0,
      visitedLocations: ["arched-moon-bridge"],
      muted: false,
    });
  });
});

describe("resolveClick", () => {
  const state = initialState(manifest);

  it("resolves a warm hotspot to its clip", () => {
    const result = resolveClick(manifest, state, "red-lanterns");
    expect(result).toEqual({ kind: "clip", regionId: "red-lanterns", clip: manifest.clips[CLIP] });
  });

  it("resolves a cold region to null — no dead-end clicks, ever", () => {
    expect(resolveClick(manifest, state, "moored-boat")).toBeNull();
  });

  it("resolves an npc region to its npc, no video edge required", () => {
    const result = resolveClick(manifest, state, "ferryman");
    expect(result).toEqual({
      kind: "npc",
      regionId: "ferryman",
      npc: manifest.npcs["uncle-chen"],
    });
  });

  it("is null for a region that is not on the current frame", () => {
    expect(resolveClick(manifest, state, "stone-steps")).toBeNull();
    expect(resolveClick(manifest, { ...state, currentFrame: DEST }, "red-lanterns")).toBeNull();
  });

  it("is null for an unknown region and an unknown current frame", () => {
    expect(resolveClick(manifest, state, "nothing-here")).toBeNull();
    expect(
      resolveClick(manifest, { ...state, currentFrame: "9999999999999999" }, "red-lanterns"),
    ).toBeNull();
  });

  it("is null when an edge points at a clip the manifest does not carry", () => {
    const orphaned = structuredClone(manifest);
    delete orphaned.clips[CLIP];
    expect(resolveClick(orphaned, state, "red-lanterns")).toBeNull();
  });

  it("drives the shipped S1 demo", () => {
    const s1 = parseManifest(s1Fixture());
    const result = resolveClick(s1, initialState(s1), "covered-bridge");
    expect(result?.kind).toBe("clip");
    expect(result && result.kind === "clip" && result.clip.id).toBe("5df6f37e77a8a8ae");
  });
});

describe("isInteractive", () => {
  const frame = manifest.frames[START];
  const byId = (id: string) => frame.regions.find((r) => r.id === id)!;

  it("counts warm hotspots and npcs, not cold hotspots (errata #3)", () => {
    expect(isInteractive(manifest, frame, byId("red-lanterns"))).toBe(true);
    expect(isInteractive(manifest, frame, byId("ferryman"))).toBe(true);
    expect(isInteractive(manifest, frame, byId("moored-boat"))).toBe(false);
  });
});

describe("applyClipEnd", () => {
  it("moves to the destination frame and counts the move", () => {
    const state = initialState(manifest);
    const next = applyClipEnd(manifest, state, CLIP);
    expect(next.currentFrame).toBe(DEST);
    expect(next.moves).toBe(1);
    expect(next.visitedLocations).toEqual(["arched-moon-bridge", "riverside-steps"]);
    expect(next.muted).toBe(false);
    // pure: the input is untouched
    expect(state.currentFrame).toBe(START);
    expect(state.moves).toBe(0);
  });

  it("does not re-add an already visited location", () => {
    const state = { ...initialState(manifest), visitedLocations: ["arched-moon-bridge", "riverside-steps"] };
    expect(applyClipEnd(manifest, state, CLIP).visitedLocations).toEqual([
      "arched-moon-bridge",
      "riverside-steps",
    ]);
  });

  it("leaves state untouched for an unknown clip", () => {
    const state = initialState(manifest);
    expect(applyClipEnd(manifest, state, "9999999999999999")).toBe(state);
  });

  it("leaves state untouched when the clip does not start from the current frame", () => {
    const state = { ...initialState(manifest), currentFrame: DEST };
    expect(applyClipEnd(manifest, state, CLIP)).toBe(state);
  });

  it("leaves state untouched when the destination frame is missing", () => {
    const orphaned = structuredClone(manifest);
    delete orphaned.frames[DEST];
    const state = initialState(orphaned);
    expect(applyClipEnd(orphaned, state, CLIP)).toBe(state);
  });

  it("preserves the mute preference across a move", () => {
    const state = { ...initialState(manifest), muted: true };
    expect(applyClipEnd(manifest, state, CLIP).muted).toBe(true);
  });
});
