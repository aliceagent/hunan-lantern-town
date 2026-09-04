import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/** The real shipped manifest, built from the approved records by scripts/build-manifest.mjs. */
export function s1Fixture(): unknown {
  return JSON.parse(readFileSync(join(here, "..", "..", "public", "manifest.json"), "utf8"));
}

/**
 * A richer graph than S1 ships: two locations, an NPC region, a warm hotspot
 * and a cold one (authored geometry with no approved clip yet).
 */
export function richFixture() {
  return {
    schemaVersion: 1,
    meta: {
      title: "Lantern River Town",
      titleZh: "河灯小镇",
      mediaBase: "https://media.example.com",
      start: { frame: "bbbb000000000001" },
    },
    locations: [
      {
        id: "arched-moon-bridge",
        nameEn: "Arched Moon Bridge",
        nameZh: "拱月桥",
        pinyin: "Gǒngyuè Qiáo",
        ambientAudio: null,
      },
      {
        id: "riverside-steps",
        nameEn: "Riverside Steps",
        nameZh: "河边石阶",
        pinyin: "Hébiān Shíjiē",
        ambientAudio: "0011223344556677",
      },
    ],
    frames: {
      bbbb000000000001: {
        hash: "bbbb000000000001",
        location: "arched-moon-bridge",
        width: 1344,
        height: 768,
        still: { png: "bbbb000000000001", jpg: "bbbb000000000001" },
        regions: [
          {
            id: "red-lanterns",
            objectId: "red-lantern",
            kind: "hotspot",
            npc: null,
            polygon: [
              [812, 104],
              [1030, 96],
              [1042, 215],
              [820, 230],
            ],
            bbox: [812, 96, 230, 134],
            labelEn: "strings of red lanterns",
            tags: [],
            dialogue: [],
          },
          {
            // Authored geometry, no approved clip: cold, and invisible to players.
            id: "moored-boat",
            objectId: "wooden-boat",
            kind: "hotspot",
            npc: null,
            polygon: [
              [100, 600],
              [400, 600],
              [400, 700],
              [100, 700],
            ],
            bbox: [100, 600, 300, 100],
            labelEn: "a moored wooden boat",
            tags: [],
            dialogue: [],
          },
          {
            id: "ferryman",
            objectId: null,
            kind: "npc",
            npc: "uncle-chen",
            polygon: [
              [500, 400],
              [600, 400],
              [600, 620],
              [500, 620],
            ],
            bbox: [500, 400, 100, 220],
            labelEn: "the ferryman",
            tags: [],
            dialogue: [],
          },
        ],
        edges: { "red-lanterns": "cccc000000000001" },
      },
      bbbb000000000002: {
        hash: "bbbb000000000002",
        location: "riverside-steps",
        width: 1344,
        height: 768,
        still: { png: "bbbb000000000002", jpg: "bbbb000000000002" },
        regions: [
          {
            id: "stone-steps",
            kind: "hotspot",
            npc: null,
            polygon: [
              [200, 500],
              [900, 500],
              [900, 760],
              [200, 760],
            ],
            bbox: [200, 500, 700, 260],
            labelEn: "wet stone steps",
            tags: [],
            dialogue: [],
          },
        ],
        edges: {},
      },
    },
    clips: {
      cccc000000000001: {
        id: "cccc000000000001",
        from: "bbbb000000000001",
        region: "red-lanterns",
        to: "bbbb000000000002",
        durationS: 6,
        prompt: "Wanqing walks slowly toward the hanging lanterns…",
        h3: { quality: "extra-fast", seed: 123456, firstFrameSimilarity: 0.94 },
        approvedAt: "2026-09-20T08:12:00Z",
      },
    },
    npcs: {
      "uncle-chen": {
        id: "uncle-chen",
        nameEn: "Uncle Chen",
        nameZh: "陈伯",
        pinyin: "Chén Bó",
        portrait: "c4f2000000000016",
        blurbEn: "The ferryman watches the mist like it owes him a fare.",
        dialogue: [],
      },
    },
  };
}
