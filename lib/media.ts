/**
 * URL assembly for content-addressed media. The manifest carries bare hashes;
 * every path is built here so switching CDN is a one-file change (§4.4).
 *
 * The manifest *types* live in `lib/manifest.ts` — the zod source of truth —
 * and are re-exported here only so existing importers keep working.
 */
import type { Manifest } from "./manifest";

export type {
  Clip,
  Frame,
  Location,
  Manifest,
  ManifestMeta,
  Npc,
  Region,
  RegionKind,
} from "./manifest";

export function stillUrl(mediaBase: string, frameHash: string, ext: "png" | "jpg" = "jpg"): string {
  return `${mediaBase}/frames/${frameHash}.${ext}`;
}

export function clipUrl(mediaBase: string, clipId: string): string {
  return `${mediaBase}/clips/${clipId}.mp4`;
}

export function audioUrl(mediaBase: string, audioHash: string): string {
  return `${mediaBase}/audio/${audioHash}.mp3`;
}

/** Test seam: override the fetch used and/or the `saveData` signal. */
export interface PrefetchDeps {
  fetch?: typeof fetch;
  /** Overrides `navigator.connection?.saveData` — set in tests. */
  saveData?: boolean;
}

function detectSaveData(): boolean {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
    .connection;
  return connection?.saveData === true;
}

/**
 * Warm the cache for the frame the player just landed on (§6 step 7): every
 * warm-edge clip plus its destination still, in manifest (region) order, at
 * most 4 requests in flight at once. Best-effort — a failed prefetch is not
 * an error, the real fetch on click will simply be a cache miss. Skipped
 * entirely when the browser signals `saveData`.
 */
export async function prefetchFrame(
  manifest: Manifest,
  frameHash: string,
  deps: PrefetchDeps = {},
): Promise<void> {
  if (deps.saveData ?? detectSaveData()) return;

  const frame = manifest.frames[frameHash];
  if (!frame) return;

  const fetchFn = deps.fetch ?? (typeof fetch === "undefined" ? undefined : fetch);
  if (!fetchFn) return;
  const doFetch = fetchFn;

  const urls: string[] = [];
  for (const region of frame.regions) {
    const clipId = frame.edges[region.id];
    if (!clipId) continue;
    const clip = manifest.clips[clipId];
    if (!clip) continue;
    urls.push(clipUrl(manifest.meta.mediaBase, clipId));
    urls.push(stillUrl(manifest.meta.mediaBase, clip.to, "jpg"));
  }
  if (urls.length === 0) return;

  const CONCURRENCY = 4;
  let next = 0;
  async function worker() {
    while (next < urls.length) {
      const url = urls[next++];
      try {
        await doFetch(url);
      } catch {
        // Best-effort cache warming only; the real click-time fetch retries.
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, urls.length) }, () => worker()),
  );
}

export interface BufferedLike {
  length: number;
  start(index: number): number;
  end(index: number): number;
}

/**
 * Honest load progress for a <video> element: fraction of its duration that
 * has actually buffered, derived from the media element's own buffered
 * ranges rather than a separate fetch of the whole file.
 */
export function bufferedProgress(buffered: BufferedLike, duration: number): number {
  if (!duration || !Number.isFinite(duration) || duration <= 0) return 0;
  if (buffered.length === 0) return 0;
  const end = buffered.end(buffered.length - 1);
  return Math.min(1, Math.max(0, end / duration));
}
