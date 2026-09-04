/**
 * The manifest is the entire game graph (§5). It ships with the app, is
 * validated here by zod, and this file is the single definition: the JSON
 * Schema the Python studio consumes is generated from these schemas by
 * `scripts/export-schema.mjs` (§5, §4.3).
 *
 * Nothing in this module touches the DOM, React, or the network.
 */
import { z } from "zod";

/** First 16 hex of a sha256 — the identity of every still, clip and audio loop (§5.1). */
export const Hash16 = z
  .string()
  .regex(/^[0-9a-f]{16}$/, "must be 16 lowercase hex characters (sha256 prefix)");

/** All authored IDs are lowercase kebab-case — no `obj:` prefixes (§5, errata #10). */
export const KebabId = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be lowercase kebab-case");

/**
 * v2 language layer (§5.7, §8). The shape is frozen in v1 so populating it
 * later is a manifest-only diff; v1 content is always `[]`.
 */
export const Tag = z
  .object({
    zh: z.string(),
    pinyin: z.string(),
    en: z.string(),
    audio: Hash16.nullable(),
  })
  .strict();

export const DialogueLine = z
  .object({
    zh: z.string(),
    pinyin: z.string(),
    en: z.string(),
    audio: Hash16.nullable(),
    speaker: KebabId,
  })
  .strict();

export const RegionKind = z.enum(["hotspot", "npc"]);

/** A clickable area on a frame. Its `id` is the locked cache-key component (§4.5.2). */
export const Region = z
  .object({
    id: KebabId,
    /** Stable across frames; the v2 language layer keys on it (D11). */
    objectId: KebabId.nullish(),
    kind: RegionKind,
    /** npcId when `kind === "npc"`, else null. */
    npc: KebabId.nullable(),
    polygon: z.array(z.tuple([z.number(), z.number()])).min(3).max(40),
    /** x, y, w, h */
    bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
    labelEn: z.string(),
    tags: z.array(Tag),
    dialogue: z.array(DialogueLine),
  })
  .strict()
  .refine((r) => (r.kind === "npc" ? r.npc !== null : r.npc === null), {
    message: 'region.npc must be set exactly when kind is "npc"',
    path: ["npc"],
  });

/** A node in the graph (§5.3). */
export const Frame = z
  .object({
    hash: Hash16,
    location: KebabId,
    width: z.int().positive(),
    height: z.int().positive(),
    still: z.object({ png: Hash16, jpg: Hash16 }).strict(),
    regions: z.array(Region),
    /** regionId → clipId. THE cache; key is (frameHash, regionId). */
    edges: z.record(KebabId, Hash16),
  })
  .strict()
  .refine((f) => new Set(f.regions.map((r) => r.id)).size === f.regions.length, {
    message: "region ids must be unique within a frame",
    path: ["regions"],
  });

/** An edge in the graph (§5.4). */
export const Clip = z
  .object({
    id: Hash16,
    from: Hash16,
    region: KebabId,
    to: Hash16,
    durationS: z.number().positive(),
    prompt: z.string(),
    h3: z
      .object({
        quality: z.string(),
        seed: z.int(),
        /** null means unscored, not 0.0 (errata #16). */
        firstFrameSimilarity: z.number().nullable(),
      })
      .strict(),
    approvedAt: z.iso.datetime().nullable(),
  })
  .strict();

export const Location = z
  .object({
    id: KebabId,
    nameEn: z.string(),
    nameZh: z.string(),
    pinyin: z.string(),
    /** Hash of a loop under `audio/`, or null; the player degrades to silence. */
    ambientAudio: Hash16.nullable(),
  })
  .strict();

export const Npc = z
  .object({
    id: KebabId,
    nameEn: z.string(),
    nameZh: z.string(),
    pinyin: z.string(),
    portrait: Hash16,
    blurbEn: z.string(),
    dialogue: z.array(DialogueLine),
  })
  .strict();

export const ManifestMeta = z
  .object({
    title: z.string(),
    titleZh: z.string(),
    /** R2 public base, or "/placeholder" in dev. No trailing slash. */
    mediaBase: z.string().min(1).refine((s) => !s.endsWith("/"), {
      message: "mediaBase must not end with a slash",
    }),
    start: z.object({ frame: Hash16 }).strict(),
  })
  .strict();

export const Manifest = z
  .object({
    schemaVersion: z.literal(1),
    meta: ManifestMeta,
    locations: z.array(Location),
    frames: z.record(Hash16, Frame),
    clips: z.record(Hash16, Clip),
    npcs: z.record(KebabId, Npc),
  })
  .strict();

export type Tag = z.infer<typeof Tag>;
export type DialogueLine = z.infer<typeof DialogueLine>;
export type RegionKind = z.infer<typeof RegionKind>;
export type Region = z.infer<typeof Region>;
export type Frame = z.infer<typeof Frame>;
export type Clip = z.infer<typeof Clip>;
export type Location = z.infer<typeof Location>;
export type Npc = z.infer<typeof Npc>;
export type ManifestMeta = z.infer<typeof ManifestMeta>;
export type Manifest = z.infer<typeof Manifest>;

/** Throws a zod error listing every field that failed. */
export function parseManifest(data: unknown): Manifest {
  return Manifest.parse(data);
}

export function safeParseManifest(data: unknown) {
  return Manifest.safeParse(data);
}

/**
 * Referential integrity across the graph — the things a per-field schema
 * cannot see. Returns one message per problem, each naming the offending id;
 * an empty array means the graph is sound.
 */
export function validateGraph(manifest: Manifest): string[] {
  const errors: string[] = [];
  const locationIds = new Set(manifest.locations.map((l) => l.id));

  if (locationIds.size !== manifest.locations.length) {
    const seen = new Set<string>();
    for (const l of manifest.locations) {
      if (seen.has(l.id)) errors.push(`location "${l.id}": duplicate location id`);
      seen.add(l.id);
    }
  }

  if (!manifest.frames[manifest.meta.start.frame]) {
    errors.push(`meta.start.frame "${manifest.meta.start.frame}": no such frame`);
  }

  for (const [frameHash, frame] of Object.entries(manifest.frames)) {
    if (frame.hash !== frameHash) {
      errors.push(`frame "${frameHash}": hash field is "${frame.hash}"`);
    }
    if (!locationIds.has(frame.location)) {
      errors.push(`frame "${frameHash}": unknown location "${frame.location}"`);
    }

    const regionIds = new Set(frame.regions.map((r) => r.id));
    for (const region of frame.regions) {
      if (region.kind === "npc" && region.npc && !manifest.npcs[region.npc]) {
        errors.push(`frame "${frameHash}" region "${region.id}": unknown npc "${region.npc}"`);
      }
    }

    for (const [regionId, clipId] of Object.entries(frame.edges)) {
      if (!regionIds.has(regionId)) {
        errors.push(`frame "${frameHash}": edge from unknown region "${regionId}"`);
      }
      const clip = manifest.clips[clipId];
      if (!clip) {
        errors.push(
          `frame "${frameHash}" region "${regionId}": dangling edge to missing clip "${clipId}"`,
        );
        continue;
      }
      if (clip.from !== frameHash) {
        errors.push(`clip "${clipId}": from is "${clip.from}" but it is an edge of "${frameHash}"`);
      }
      if (clip.region !== regionId) {
        errors.push(`clip "${clipId}": region is "${clip.region}" but it is the edge of "${regionId}"`);
      }
    }
  }

  for (const [clipId, clip] of Object.entries(manifest.clips)) {
    if (clip.id !== clipId) errors.push(`clip "${clipId}": id field is "${clip.id}"`);
    if (!manifest.frames[clip.to]) {
      errors.push(`clip "${clipId}": to points at missing frame "${clip.to}"`);
    }
    if (!manifest.frames[clip.from]) {
      errors.push(`clip "${clipId}": from points at missing frame "${clip.from}"`);
    }
  }

  for (const [npcId, npc] of Object.entries(manifest.npcs)) {
    if (npc.id !== npcId) errors.push(`npc "${npcId}": id field is "${npc.id}"`);
  }

  return errors;
}

/** Parse + graph-check in one step; throws on either failure. */
export function loadManifest(data: unknown): Manifest {
  const manifest = parseManifest(data);
  const errors = validateGraph(manifest);
  if (errors.length > 0) {
    throw new Error(`manifest graph is broken:\n  ${errors.join("\n  ")}`);
  }
  return manifest;
}
