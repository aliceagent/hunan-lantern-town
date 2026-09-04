/**
 * The navigation engine (§6). Pure functions over the manifest and player
 * state — no DOM, no React, no fetch, no storage. Everything the player does
 * to decide "what happens on this click" and "where does this clip land"
 * lives here so it can be tested without a browser.
 */
import type { Clip, Frame, Manifest, Npc, Region } from "./manifest";

/** The whole of v1 story state (§6). */
export interface PlayerState {
  currentFrame: string;
  moves: number;
  visitedLocations: string[];
  muted: boolean;
}

export type ClickResult =
  | { kind: "clip"; regionId: string; clip: Clip }
  | { kind: "npc"; regionId: string; npc: Npc }
  | null;

export function initialState(manifest: Manifest): PlayerState {
  const start = manifest.meta.start.frame;
  const location = manifest.frames[start]?.location;
  return {
    currentFrame: start,
    moves: 0,
    visitedLocations: location ? [location] : [],
    muted: false,
  };
}

/**
 * A region is interactive when it is a warm hotspot (has an approved clip) or
 * an NPC the manifest knows (errata #3). Cold regions are inert: cache-only
 * means no dead-end clicks, ever.
 */
export function isInteractive(manifest: Manifest, frame: Frame, region: Region): boolean {
  if (region.kind === "npc") return region.npc !== null && manifest.npcs[region.npc] !== undefined;
  const clipId = frame.edges[region.id];
  return clipId !== undefined && manifest.clips[clipId] !== undefined;
}

/**
 * What a click on `regionId` of the current frame means. NPC regions open
 * their card (§6.2, "no video edge required"); a hotspot resolves through
 * `frames[hash].edges` — the locked (frameHash, regionId) cache key. Anything
 * cold, unknown, or off-frame is null: the caller does nothing.
 */
export function resolveClick(
  manifest: Manifest,
  state: PlayerState,
  regionId: string,
): ClickResult {
  const frame = manifest.frames[state.currentFrame];
  if (!frame) return null;

  const region = frame.regions.find((r) => r.id === regionId);
  if (!region) return null;

  if (region.kind === "npc" && region.npc) {
    const npc = manifest.npcs[region.npc];
    if (npc) return { kind: "npc", regionId, npc };
  }

  const clipId = frame.edges[regionId];
  if (!clipId) return null;
  const clip = manifest.clips[clipId];
  if (!clip) return null;

  return { kind: "clip", regionId, clip };
}

/**
 * The chain step (§6.6): a clip finished, so the destination frame becomes
 * current and the move counter advances. A clip that does not start from the
 * current frame, or lands nowhere, leaves state untouched.
 */
export function applyClipEnd(
  manifest: Manifest,
  state: PlayerState,
  clipId: string,
): PlayerState {
  const clip = manifest.clips[clipId];
  if (!clip || clip.from !== state.currentFrame) return state;

  const destination = manifest.frames[clip.to];
  if (!destination) return state;

  const visitedLocations = state.visitedLocations.includes(destination.location)
    ? state.visitedLocations
    : [...state.visitedLocations, destination.location];

  return {
    ...state,
    currentFrame: clip.to,
    moves: state.moves + 1,
    visitedLocations,
  };
}
