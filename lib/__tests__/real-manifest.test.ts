/**
 * The shipped artifact, not a fixture: `public/manifest.json` as produced by
 * `scripts/build-manifest.mjs`. `loadManifest` runs zod + `validateGraph`, so a
 * dangling edge or a drifted region id fails here before it reaches a phone.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadManifest } from "../manifest";

const pub = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "public");
const m = loadManifest(JSON.parse(readFileSync(join(pub, "manifest.json"), "utf8")));

describe("shipped manifest", () => {
  it("starts at locked frame one with same-origin media", () => {
    expect(m.meta.start.frame).toBe("daf1a2609185d63d");
    expect(m.meta.mediaBase).toBe("/media");
  });

  it("ships only approved clips whose media exist on disk", () => {
    expect(Object.keys(m.clips).length).toBeGreaterThanOrEqual(15);
    for (const clip of Object.values(m.clips)) {
      expect(clip.approvedAt).not.toBeNull();
      expect(existsSync(join(pub, "media", "clips", `${clip.id}.mp4`))).toBe(true);
    }
    for (const frame of Object.values(m.frames)) {
      expect(existsSync(join(pub, "media", "frames", `${frame.hash}.jpg`))).toBe(true);
    }
  });

  it("frame one has all five warm edges", () => {
    expect(Object.keys(m.frames["daf1a2609185d63d"].edges)).toHaveLength(5);
  });
});
