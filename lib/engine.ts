/**
 * The navigation engine (§6). Pure functions over the manifest and player
 * state — no DOM, no React, no fetch, no storage. Everything the player does
 * to decide "what happens on this click" and "where does this clip land"
 * lives here so it can be tested without a browser.
 */
import type { Clip, Frame, Manifest, Npc, Region } from "./manifest";

/**
 * One entry in the path trail: enough to put the player back on that still.
 * `clip` is the edge that led here (null for the start step) — kept so a
 * future UI can label the step by what was clicked, not just where it landed.
 */
export interface TrailStep {
  frame: string;
  clip: string | null;
  location: string;
}

/** The whole of v1 story state (§6). */
export interface PlayerState {
  currentFrame: string;
  moves: number;
  visitedLocations: string[];
  /** Ordered stills since the start; the last step is `currentFrame`. */
  trail: TrailStep[];
  muted: boolean;
}

/** The trail a fresh (or repaired) state gets: the current still, alone. */
export function trailFor(manifest: Manifest, frameHash: string): TrailStep[] {
  const frame = manifest.frames[frameHash];
  return [{ frame: frameHash, clip: null, location: frame?.location ?? "" }];
}

export type ClickResult =
  | { kind: "clip"; regionId: string; clip: Clip }
  | { kind: "npc"; regionId: string; npc: Npc }
  | { kind: "cold"; regionId: string; region: Region }
  | null;

export function initialState(manifest: Manifest): PlayerState {
  const start = manifest.meta.start.frame;
  const location = manifest.frames[start]?.location;
  return {
    currentFrame: start,
    moves: 0,
    visitedLocations: location ? [location] : [],
    trail: trailFor(manifest, start),
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
 * The end of the visual world: nothing on this still can be tapped — no
 * warm hotspot, no known NPC, no defined (even cold) region. Cold boxes
 * copy their details; they are not a dead painting.
 */
export function isWorldEdge(manifest: Manifest, frame: Frame): boolean {
  if (frame.regions.length === 0) return true;
  return !frame.regions.some(
    (region) => isInteractive(manifest, frame, region) || region.kind !== "npc",
  );
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
  const clip = clipId ? manifest.clips[clipId] : undefined;
  if (clip) return { kind: "clip", regionId, clip };

  // Defined box, no video yet: authoring copy, not a foggy miss.
  return { kind: "cold", regionId, region };
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
    trail: [...state.trail, { frame: clip.to, clip: clipId, location: destination.location }],
  };
}

/**
 * Jump back to an earlier still on the trail and truncate everything after
 * it, so the player can pick a different branch from there. Restoration only:
 * no clip plays, `moves` keeps counting every clip ever watched, and visited
 * locations stay visited. The last step (where the player already stands),
 * an unknown index, or a frame this manifest no longer carries are all no-ops.
 */
export function jumpToTrailStep(
  manifest: Manifest,
  state: PlayerState,
  index: number,
): PlayerState {
  if (index < 0 || index >= state.trail.length - 1) return state;
  const step = state.trail[index];
  if (!manifest.frames[step.frame]) return state;

  return {
    ...state,
    currentFrame: step.frame,
    trail: state.trail.slice(0, index + 1),
  };
}
