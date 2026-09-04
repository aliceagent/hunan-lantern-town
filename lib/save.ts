/**
 * Save state (§6). Story progress is private and lives only in the browser
 * under a versioned key; anything unreadable, stale, or pointing at a frame
 * this manifest no longer contains falls back to a fresh start rather than
 * stranding the player.
 */
import { initialState, trailFor, type PlayerState, type TrailStep } from "./engine";
import type { Manifest } from "./manifest";

/** The storage slot; the payload's `v` field carries the shape version. */
export const SAVE_KEY = "lantern-town.save.v1";
/** Mute is a device preference, not story state (§6.1 persists the first three fields). */
export const MUTE_KEY = "lantern-town.muted.v1";

const SAVE_VERSION = 2;

/** v2 added `trail`; v1 payloads (no trail) still load, trail rebuilt. */
interface SavePayload {
  v: number;
  currentFrame: string;
  moves: number;
  visitedLocations: string[];
  trail: TrailStep[];
}

type LegacyV1Payload = Omit<SavePayload, "trail">;

/** The slice of the Web Storage API this module uses; injectable for tests. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** null during SSR or when the browser blocks storage (private mode, quota). */
export function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function hasStoryFields(value: unknown): value is LegacyV1Payload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.currentFrame === "string" &&
    typeof v.moves === "number" &&
    Number.isFinite(v.moves) &&
    v.moves >= 0 &&
    Array.isArray(v.visitedLocations) &&
    v.visitedLocations.every((l) => typeof l === "string")
  );
}

function isTrailStep(value: unknown): value is TrailStep {
  if (typeof value !== "object" || value === null) return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.frame === "string" &&
    (s.clip === null || typeof s.clip === "string") &&
    typeof s.location === "string"
  );
}

function isSavePayload(value: unknown): value is SavePayload {
  if (!hasStoryFields(value)) return false;
  const v = value as unknown as Record<string, unknown>;
  return v.v === SAVE_VERSION && Array.isArray(v.trail) && v.trail.every(isTrailStep);
}

function isLegacyV1Payload(value: unknown): value is LegacyV1Payload {
  return hasStoryFields(value) && (value as unknown as Record<string, unknown>).v === 1;
}

/**
 * A trail is only trusted whole: every frame still in this manifest and the
 * last step standing on `currentFrame`. Anything else (a v1 save, a frame
 * pruned by a newer manifest) is repaired to just the current still rather
 * than discarding the save.
 */
function sanitizeTrail(manifest: Manifest, trail: TrailStep[], currentFrame: string): TrailStep[] {
  const intact =
    trail.length > 0 &&
    trail[trail.length - 1].frame === currentFrame &&
    trail.every((step) => manifest.frames[step.frame] !== undefined);
  return intact ? trail : trailFor(manifest, currentFrame);
}

/**
 * Resolve the player's starting state: the save if it is intact and still
 * addressable in this manifest, otherwise `meta.start` (§6.1).
 */
export function loadSave(
  manifest: Manifest,
  storage: StorageLike | null = defaultStorage(),
): PlayerState {
  const fresh = initialState(manifest);
  if (!storage) return fresh;

  // Mute is a device preference: it survives a missing, corrupt or reset save.
  const muted = loadMuted(storage);

  let raw: string | null;
  try {
    raw = storage.getItem(SAVE_KEY);
  } catch {
    return fresh;
  }
  if (raw === null) return { ...fresh, muted };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ...fresh, muted };
  }

  if ((!isSavePayload(parsed) && !isLegacyV1Payload(parsed)) || !manifest.frames[parsed.currentFrame]) {
    return { ...fresh, muted };
  }

  const trail = isSavePayload(parsed) ? parsed.trail : [];
  return {
    currentFrame: parsed.currentFrame,
    moves: parsed.moves,
    visitedLocations: parsed.visitedLocations,
    trail: sanitizeTrail(manifest, trail, parsed.currentFrame),
    muted,
  };
}

export function saveState(
  state: PlayerState,
  storage: StorageLike | null = defaultStorage(),
): void {
  if (!storage) return;
  const payload: SavePayload = {
    v: SAVE_VERSION,
    currentFrame: state.currentFrame,
    moves: state.moves,
    visitedLocations: state.visitedLocations,
    trail: state.trail,
  };
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(payload));
    storage.setItem(MUTE_KEY, state.muted ? "1" : "0");
  } catch {
    // A full or blocked quota costs the player their progress, not their game.
  }
}

/** The HUD reset button (§6.9): forget the story, keep the mute preference. */
export function clearSave(storage: StorageLike | null = defaultStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    // nothing to do — the caller resets to meta.start regardless
  }
}

export function loadMuted(storage: StorageLike | null = defaultStorage()): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}
