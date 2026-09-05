/**
 * Pure keyboard mapping for /play. No DOM, no React.
 */
import { isInteractive } from "./engine";
import type { Frame, Manifest, Region } from "./manifest";
import type { PlaybackPhase } from "./playback";
import { polygonCentroid } from "./svg";

export type KeyboardMode = "authoring" | "npc" | "menu" | "clip" | "explore";

export type KeyAction =
  | { type: "back" }
  | { type: "select"; ordinal: number }
  | { type: "toggleNumbers" }
  | { type: "toggleMute" }
  | { type: "hint" }
  | { type: "openMenu" }
  | { type: "closeTop" }
  | { type: "openPath" }
  | { type: "fullscreen" };

export function deriveMode(input: {
  authoring: boolean;
  npcOpen: boolean;
  menuOpen: boolean;
  phase: PlaybackPhase;
}): KeyboardMode {
  if (input.authoring) return "authoring";
  if (input.npcOpen) return "npc";
  if (input.menuOpen) return "menu";
  if (input.phase !== "still") return "clip";
  return "explore";
}

export function keyToAction(
  event: {
    key: string;
    metaKey: boolean;
    ctrlKey: boolean;
    altKey: boolean;
    repeat: boolean;
    targetIsEditable: boolean;
  },
  mode: KeyboardMode,
): KeyAction | null {
  if (event.targetIsEditable || event.metaKey || event.ctrlKey || event.altKey) return null;
  if (mode === "authoring") return null;

  const key = event.key;
  const mute = key === "m" || key === "M";

  if (mode === "clip") {
    if (mute) return { type: "toggleMute" };
    return null;
  }

  if (mode === "npc" || mode === "menu") {
    if (key === "Escape") return { type: "closeTop" };
    if (mode === "menu" && (key === "p" || key === "P")) return { type: "closeTop" };
    return null;
  }

  // explore
  if (event.repeat && (key === "Backspace" || key === "[" || /^[0-9]$/.test(key))) return null;
  if (key === "Backspace" || key === "[") return { type: "back" };
  if (key === "`") return { type: "toggleNumbers" };
  if (key === "Escape") return { type: "openMenu" };
  if (mute) return { type: "toggleMute" };
  if (key === "h" || key === "H") return { type: "hint" };
  if (key === "p" || key === "P") return { type: "openPath" };
  if (key === "f" || key === "F") return { type: "fullscreen" };
  if (/^[1-9]$/.test(key)) return { type: "select", ordinal: Number(key) };
  if (key === "0") return { type: "select", ordinal: 10 };
  return null;
}

const ROW_BAND = 0.12;

export function orderedHotspots(manifest: Manifest, frame: Frame): Region[] {
  const warm = frame.regions.filter((region) => isInteractive(manifest, frame, region));
  const band = Math.max(1, frame.height * ROW_BAND);
  return [...warm].sort((a, b) => {
    const [ax, ay] = polygonCentroid(a.polygon);
    const [bx, by] = polygonCentroid(b.polygon);
    const ra = Math.floor(ay / band);
    const rb = Math.floor(by / band);
    if (ra !== rb) return ra - rb;
    return ax - bx;
  });
}

export function hotspotForOrdinal(manifest: Manifest, frame: Frame, ordinal: number): Region | null {
  const list = orderedHotspots(manifest, frame);
  if (ordinal < 1 || ordinal > list.length) return null;
  return list[ordinal - 1] ?? null;
}

export function badgeLabel(ordinal: number): string {
  if (ordinal >= 1 && ordinal <= 9) return String(ordinal);
  if (ordinal === 10) return "0";
  return String(ordinal);
}
