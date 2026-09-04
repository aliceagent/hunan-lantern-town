/**
 * Save state (§6). Story progress is private and lives only in the browser
 * under a versioned key; anything unreadable, stale, or pointing at a frame
 * this manifest no longer contains falls back to a fresh start rather than
 * stranding the player.
 */
import { initialState, type PlayerState } from "./engine";
import type { Manifest } from "./manifest";

export const SAVE_KEY = "lantern-town.save.v1";
/** Mute is a device preference, not story state (§6.1 persists the first three fields). */
export const MUTE_KEY = "lantern-town.muted.v1";

const SAVE_VERSION = 1;

interface SavePayload {
  v: number;
  currentFrame: string;
  moves: number;
  visitedLocations: string[];
}

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

function isSavePayload(value: unknown): value is SavePayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.v === SAVE_VERSION &&
    typeof v.currentFrame === "string" &&
    typeof v.moves === "number" &&
    Number.isFinite(v.moves) &&
    v.moves >= 0 &&
    Array.isArray(v.visitedLocations) &&
    v.visitedLocations.every((l) => typeof l === "string")
  );
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

  if (!isSavePayload(parsed) || !manifest.frames[parsed.currentFrame]) {
    return { ...fresh, muted };
  }

  return {
    currentFrame: parsed.currentFrame,
    moves: parsed.moves,
    visitedLocations: parsed.visitedLocations,
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
