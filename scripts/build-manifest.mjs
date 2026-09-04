/**
 * build-manifest.mjs — joins the authoring records on the box into the real
 * `public/manifest.json` and copies the media the player fetches (PS1).
 *
 * Run on the authoring machine:  node scripts/build-manifest.mjs
 *
 * Deliberately dependency-free plain Node ESM (no TS imports): validation is
 * the job of `lib/__tests__/real-manifest.test.ts`, which runs the real zod
 * pipeline over whatever this script writes. Failures here are loud and fatal —
 * a broken graph must never reach a deploy.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DATA = process.env.LANTERN_DATA ?? "/home/nvidia/lantern-town-data";
const WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RECORDS = path.join(DATA, "records");
const START = "daf1a2609185d63d";
const MEDIA_BASE = "/media";
const WIDTH = 1344;
const HEIGHT = 768;
/** Clips are 6.583s at 24fps; only used when a record predates the field. */
const DEFAULT_DURATION_S = 6.583;
/** Frames with no regions record at all fall back to this location slug. */
const FALLBACK_LOCATION = "riverside";

/** approved-record region id → region id in the from-frame's regions file (data drift). */
const REGION_ALIASES = { "center-stilt-house-fall": "center-stilt-house" };

const LOCATION_NAMES = {
  "flagstone-old-street": { en: "Flagstone Old Street", zh: "石板老街", pinyin: "Shíbǎn Lǎojiē" },
  "covered-bridge": { en: "The Covered Bridge", zh: "风雨桥", pinyin: "Fēngyǔ Qiáo" },
  "stilt-houses": { en: "Stilt Houses", zh: "吊脚楼", pinyin: "Diàojiǎolóu" },
  "noodle-stall": { en: "The Noodle Stall", zh: "米粉摊", pinyin: "Mǐfěn Tān" },
  "temple-stairs": { en: "Temple Stairs", zh: "庙前石阶", pinyin: "Miào Qián Shíjiē" },
  "lantern-shops": { en: "Lantern Shops", zh: "灯笼铺", pinyin: "Dēnglong Pù" },
};
const FALLBACK_ZH = "河灯镇一角";
const FALLBACK_PINYIN = "Hédēng Zhèn Yījiǎo";

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function die(message, offender) {
  console.error(`build-manifest: ${message}`);
  if (offender !== undefined) console.error(JSON.stringify(offender, null, 2));
  process.exit(1);
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    die(`could not read ${file}: ${err.message}`);
  }
}

/** Lowercase kebab-case, the only id shape the schema accepts. */
function kebab(value) {
  return String(value)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleize(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------- read records

if (!existsSync(RECORDS)) die(`no records directory at ${RECORDS} (set LANTERN_DATA?)`);
const recordFiles = readdirSync(RECORDS);

// 1. Approved edges. `rejected-*.json` is skipped by filename — some rejected
//    records still carry status "approved" inside, so the filename is the truth.
const approved = [];
for (const file of recordFiles.filter((f) => f.startsWith("approved-") && f.endsWith(".json")).sort()) {
  const record = readJson(path.join(RECORDS, file));
  if (record.status !== "approved") {
    console.warn(`build-manifest: skipping ${file} — status is ${JSON.stringify(record.status)}`);
    continue;
  }
  approved.push({ file, ...record });
}
if (approved.length === 0) die("no approved records found — nothing to ship");

// 2. Regions indexed by the `frameHash` FIELD, never by filename (frame one
//    lives in frame-one-regions.json).
const regionsByFrame = new Map();
for (const file of recordFiles.filter((f) => f.endsWith("-regions.json")).sort()) {
  const record = readJson(path.join(RECORDS, file));
  if (!record.frameHash) die(`${file} has no frameHash field`, record);
  if (regionsByFrame.has(record.frameHash)) {
    die(`two regions records claim frameHash ${record.frameHash} (second: ${file})`);
  }
  regionsByFrame.set(record.frameHash, { file, ...record });
}

// --------------------------------------------------------------- build frames

// 3. Frame set = start frame ∪ every from ∪ every to.
const frameHashes = new Set([START]);
for (const record of approved) {
  frameHashes.add(record.from);
  frameHashes.add(record.to);
}

const frames = {};
for (const hash of [...frameHashes].sort()) {
  const source = regionsByFrame.get(hash);
  if (!source) {
    console.warn(`build-manifest: no regions record for frame ${hash} — shipping it with no regions`);
  }

  const location = source?.location ? kebab(source.location) : FALLBACK_LOCATION;
  if (!KEBAB.test(location)) {
    die(`frame ${hash}: location ${JSON.stringify(source?.location)} is not kebab-case`, source);
  }

  // 4. `look` is an authoring kind; the player schema knows only hotspot/npc.
  const regions = (source?.regions ?? []).map((r) => {
    if (!KEBAB.test(r.id ?? "")) die(`frame ${hash}: region id ${JSON.stringify(r.id)} is not kebab-case`, r);
    if (!Array.isArray(r.bbox) || r.bbox.length !== 4) {
      die(`frame ${hash} region ${r.id}: bbox must be [x, y, w, h]`, r);
    }
    const [x, y, w, h] = r.bbox.map(Number);
    return {
      id: r.id,
      objectId: r.objectId ?? null,
      kind: r.kind === "look" ? "hotspot" : (r.kind ?? "hotspot"),
      npc: null,
      polygon: [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
      ],
      bbox: [x, y, w, h],
      labelEn: r.labelEn ?? "",
      tags: [],
      dialogue: [],
    };
  });

  frames[hash] = {
    hash,
    location,
    width: WIDTH,
    height: HEIGHT,
    still: { png: hash, jpg: hash },
    regions,
    edges: {},
  };
}

// ---------------------------------------------------------------- build clips

const clips = {};
for (const record of approved) {
  const frame = frames[record.from];
  if (!frame) die(`${record.file}: from-frame ${record.from} is not in the frame set`, record);

  // 5. Normalize through the alias map; an unknown region is a hard failure —
  //    Alice adds an alias, we never silently drop an approved clip.
  const region = REGION_ALIASES[record.region] ?? record.region;
  const emitted = frame.regions.find((r) => r.id === region);
  if (!emitted) {
    console.error(
      `build-manifest: ${record.file} — region "${record.region}"` +
        (region === record.region ? "" : ` (aliased to "${region}")`) +
        ` is not a region of frame ${record.from}. Known: ${frame.regions.map((r) => r.id).join(", ") || "(none)"}`,
    );
    die("unmapped region drift — add an alias to REGION_ALIASES", record);
  }

  if (frame.edges[region]) {
    die(`two approved records claim edge (${record.from}, ${region}); ${record.file} collides`, record);
  }

  const durationS = typeof record.durationS === "number" && record.durationS > 0
    ? record.durationS
    : DEFAULT_DURATION_S;
  const h3 = record.h3 ?? {};
  const rawSeed = h3.seed ?? h3.seed_used ?? 0;
  const similarity = h3.firstFrameSimilarity;

  if (!record.approvedAt) console.warn(`build-manifest: ${record.file} has no approvedAt`);

  // 6. `prompt` is the from-frame region's authored `action` text — read from
  //    the raw record, since the emitted region is schema-strict and drops it.
  const action = regionsByFrame.get(record.from)?.regions?.find((r) => r.id === region)?.action;

  clips[record.clipId] = {
    id: record.clipId,
    from: record.from,
    region,
    to: record.to,
    durationS,
    prompt: typeof action === "string" ? action : "",
    h3: {
      quality: String(h3.quality ?? ""),
      // The schema wants an int; records have occasionally carried it as a string.
      seed: Number.isFinite(Number(rawSeed)) ? Math.trunc(Number(rawSeed)) : 0,
      // null means unscored — never 0.0 (errata #16).
      firstFrameSimilarity: typeof similarity === "number" ? similarity : null,
    },
    approvedAt: record.approvedAt ?? null,
  };

  frame.edges[region] = record.clipId;
}

// ------------------------------------------------------------ locations, meta

const locations = [...new Set(Object.values(frames).map((f) => f.location))].sort().map((id) => {
  const named = LOCATION_NAMES[id];
  return {
    id,
    nameEn: named?.en ?? titleize(id),
    nameZh: named?.zh ?? FALLBACK_ZH,
    pinyin: named?.pinyin ?? FALLBACK_PINYIN,
    ambientAudio: null,
  };
});

const manifest = {
  schemaVersion: 1,
  meta: {
    title: "Lantern River Town",
    titleZh: "河灯小镇",
    mediaBase: MEDIA_BASE,
    start: { frame: START },
  },
  locations,
  frames,
  clips,
  npcs: {},
};

// ------------------------------------------------------------------ copy media

// 7. Only what the player actually fetches: mp4 per clip, jpg per frame. No
//    PNGs (never requested) and no ffmpeg — approved clips are already remuxed.
const clipsOut = path.join(WEB, "public", "media", "clips");
const framesOut = path.join(WEB, "public", "media", "frames");
mkdirSync(clipsOut, { recursive: true });
mkdirSync(framesOut, { recursive: true });

let bytes = 0;
const missing = [];
function copy(src, dest) {
  if (!existsSync(src)) {
    missing.push(src);
    return;
  }
  copyFileSync(src, dest);
  bytes += statSync(dest).size;
}

for (const clipId of Object.keys(clips)) {
  copy(path.join(DATA, "clips", "approved", `${clipId}.mp4`), path.join(clipsOut, `${clipId}.mp4`));
}
for (const hash of Object.keys(frames)) {
  copy(path.join(DATA, "frames", `${hash}.jpg`), path.join(framesOut, `${hash}.jpg`));
}
if (missing.length > 0) {
  for (const file of missing) console.error(`build-manifest: missing media source ${file}`);
  die(`${missing.length} media file(s) missing — refusing to write a manifest that points at nothing`);
}

// ------------------------------------------------------------------ write out

const manifestPath = path.join(WEB, "public", "manifest.json");
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const warm = Object.values(frames).filter((f) => Object.keys(f.edges).length > 0).length;
console.log(
  `build-manifest: ${Object.keys(frames).length} frames (${warm} warm, ${Object.keys(frames).length - warm} leaves), ` +
    `${Object.keys(clips).length} clips, ${locations.length} locations, ` +
    `${(bytes / 1024 / 1024).toFixed(1)} MB copied into public/media → ${path.relative(WEB, manifestPath)}`,
);
