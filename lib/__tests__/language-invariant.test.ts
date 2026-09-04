/**
 * The core architectural guarantee (§4.5, §8): the v2 language layer is
 * attributes hung off IDs that already exist. Populating `tags[]` and
 * `dialogue[]` must not move a single byte of the (frameHash, regionId) →
 * clipId cache, nor any content hash. If someone couples language data to the
 * cache, this test fails and CI stops them.
 *
 * Per errata #12 the table is derived *through the engine the player actually
 * calls* — `resolveClick` and `frames[].edges` — not a parallel helper written
 * for the test.
 */
import { describe, expect, it } from "vitest";
import { applyClipEnd, resolveClick, type PlayerState } from "../engine";
import { parseManifest, validateGraph, type Manifest } from "../manifest";
import { richFixture, s1Fixture } from "./fixtures";

/**
 * Every (frameHash, regionId) the player can click, resolved through
 * `resolveClick`, recorded as the clip id it lands on (or null).
 */
function clipLookupTable(manifest: Manifest): Record<string, string | null> {
  const table: Record<string, string | null> = {};
  for (const [frameHash, frame] of Object.entries(manifest.frames)) {
    const state: PlayerState = {
      currentFrame: frameHash,
      moves: 0,
      visitedLocations: [],
      muted: false,
    };
    for (const region of frame.regions) {
      const result = resolveClick(manifest, state, region.id);
      table[`${frameHash}|${region.id}`] = result?.kind === "clip" ? result.clip.id : null;
    }
    // The raw cache too, so a change to either side of the lookup is caught.
    for (const [regionId, clipId] of Object.entries(frame.edges)) {
      table[`edges:${frameHash}|${regionId}`] = clipId;
    }
  }
  return table;
}

/** Every content hash in the manifest — nothing here may move. */
function hashes(manifest: Manifest) {
  return {
    start: manifest.meta.start.frame,
    frames: Object.entries(manifest.frames)
      .map(([key, f]) => `${key}:${f.hash}:${f.still.png}:${f.still.jpg}`)
      .sort(),
    clips: Object.entries(manifest.clips)
      .map(([key, c]) => `${key}:${c.id}:${c.from}:${c.to}:${c.region}:${c.durationS}`)
      .sort(),
    portraits: Object.values(manifest.npcs)
      .map((n) => n.portrait)
      .sort(),
    audio: manifest.locations.map((l) => l.ambientAudio).sort(),
  };
}

/** What v2 will do to the manifest, and nothing more (§5.7, §8). */
function injectLanguageLayer(manifest: Manifest): Manifest {
  const next = structuredClone(manifest);
  for (const frame of Object.values(next.frames)) {
    for (const region of frame.regions) {
      region.tags = [
        { zh: "灯笼", pinyin: "dēnglong", en: "lantern", audio: "aabbccddeeff0011" },
        { zh: "小船", pinyin: "xiǎochuán", en: "little boat", audio: null },
      ];
      if (region.kind === "npc" && region.npc) {
        region.dialogue = [
          {
            zh: "早上好。",
            pinyin: "Zǎoshang hǎo.",
            en: "Good morning.",
            audio: "1122334455667788",
            speaker: region.npc,
          },
        ];
      }
    }
  }
  for (const npc of Object.values(next.npcs)) {
    npc.dialogue = [
      {
        zh: "河水今天很静。",
        pinyin: "Héshuǐ jīntiān hěn jìng.",
        en: "The river is quiet today.",
        audio: "99aabbccddeeff00",
        speaker: npc.id,
      },
    ];
  }
  return next;
}

describe.each([
  ["the shipped S1 manifest", s1Fixture],
  ["a rich manifest with npcs and cold regions", richFixture],
])("language-layer invariant — %s", (_name, fixture) => {
  const before = parseManifest(fixture());
  const after = injectLanguageLayer(before);

  it("actually injected something (guards against a vacuous test)", () => {
    const tagCount = Object.values(after.frames)
      .flatMap((f) => f.regions)
      .reduce((n, r) => n + r.tags.length, 0);
    expect(tagCount).toBeGreaterThan(0);
    expect(
      Object.values(before.frames)
        .flatMap((f) => f.regions)
        .every((r) => r.tags.length === 0 && r.dialogue.length === 0),
    ).toBe(true);
  });

  it("is still a valid manifest with a sound graph", () => {
    expect(() => parseManifest(after)).not.toThrow();
    expect(validateGraph(parseManifest(after))).toEqual([]);
  });

  it("leaves the (frameHash, regionId) → clipId table byte-identical", () => {
    const b = clipLookupTable(before);
    const a = clipLookupTable(after);
    expect(a).toEqual(b);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("leaves every content hash untouched — not one MP4 is re-keyed", () => {
    expect(JSON.stringify(hashes(after))).toBe(JSON.stringify(hashes(before)));
  });

  it("leaves frames[].edges deep-equal", () => {
    for (const [frameHash, frame] of Object.entries(before.frames)) {
      expect(after.frames[frameHash].edges).toEqual(frame.edges);
    }
  });

  it("leaves navigation through the engine identical", () => {
    for (const [frameHash, frame] of Object.entries(before.frames)) {
      const state: PlayerState = {
        currentFrame: frameHash,
        moves: 0,
        visitedLocations: [],
        muted: false,
      };
      for (const clipId of Object.values(frame.edges)) {
        expect(applyClipEnd(after, state, clipId)).toEqual(applyClipEnd(before, state, clipId));
      }
    }
  });

  it("touches nothing outside tags[] and dialogue[]", () => {
    const strip = (m: Manifest) => {
      const copy = structuredClone(m);
      for (const frame of Object.values(copy.frames)) {
        for (const region of frame.regions) {
          region.tags = [];
          region.dialogue = [];
        }
      }
      for (const npc of Object.values(copy.npcs)) npc.dialogue = [];
      return JSON.stringify(copy);
    };
    expect(strip(after)).toBe(strip(before));
  });
});
