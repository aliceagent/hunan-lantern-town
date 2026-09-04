"use client";

import { useEffect, useRef, useState } from "react";
import { isInteractive } from "@/lib/engine";
import type { Frame, Manifest } from "@/lib/manifest";
import { polygonCentroid, polygonToPath } from "@/lib/svg";

/**
 * The 1.5 s lantern-glow hint (§10-S3): always on mobile (no hover to teach
 * the player where to look), and on desktop only after 8 s with no pointer
 * movement (don't nag someone who is already exploring).
 */
function useHintPulse(frameKey: string): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(false);
    const isTouch =
      typeof window !== "undefined" &&
      window.matchMedia?.("(hover: none), (pointer: coarse)").matches;

    let pulseTimer: ReturnType<typeof setTimeout> | undefined;
    function firePulse() {
      setActive(true);
      pulseTimer = setTimeout(() => setActive(false), 1500);
    }

    if (isTouch) {
      firePulse();
      return () => pulseTimer && clearTimeout(pulseTimer);
    }

    let moved = false;
    function onMove() {
      moved = true;
    }
    window.addEventListener("pointermove", onMove, { once: true });
    const idleTimer = setTimeout(() => {
      if (!moved) firePulse();
    }, 8000);

    return () => {
      window.removeEventListener("pointermove", onMove);
      clearTimeout(idleTimer);
      if (pulseTimer) clearTimeout(pulseTimer);
    };
  }, [frameKey]);

  return active;
}

export default function HotspotLayer({
  manifest,
  frame,
  interactive,
  hintSignal,
  onRegionClick,
}: {
  manifest: Manifest;
  frame: Frame;
  /** False while a clip is loading/playing or a modal is open — input is locked. */
  interactive: boolean;
  /** Counter bumped by the HUD Hints button; each bump flashes the glow. */
  hintSignal: number;
  onRegionClick: (regionId: string) => void;
}) {
  const autoHintActive = useHintPulse(frame.hash);
  const [manualHintActive, setManualHintActive] = useState(false);
  // Read through a ref so a signal bump fires only in the moment it happens;
  // hotspots unlocking later must not replay a stale press.
  const interactiveRef = useRef(interactive);
  useEffect(() => {
    interactiveRef.current = interactive;
  }, [interactive]);

  useEffect(() => {
    // No-op while a clip is loading/playing or a modal is open (hotspots are
    // locked then, so glowing them would advertise dead targets).
    if (hintSignal === 0 || !interactiveRef.current) return;
    setManualHintActive(true);
    const timer = setTimeout(() => setManualHintActive(false), 2000);
    return () => {
      clearTimeout(timer);
      setManualHintActive(false);
    };
  }, [hintSignal]);

  const hintActive = autoHintActive || manualHintActive;
  const [hoveredNpc, setHoveredNpc] = useState<string | null>(null);

  const warmRegions = frame.regions.filter((region) => isInteractive(manifest, frame, region));

  return (
    <svg
      viewBox={`0 0 ${frame.width} ${frame.height}`}
      className="absolute inset-0 h-full w-full"
      style={{ pointerEvents: interactive ? "auto" : "none" }}
    >
      {warmRegions.map((region) => {
        const isNpc = region.kind === "npc";
        const npc = isNpc && region.npc ? manifest.npcs[region.npc] : undefined;
        const [cx, cy] = polygonCentroid(region.polygon);
        return (
          <g key={region.id}>
            {hintActive && (
              <path
                // Keyed on the signal so a re-tap of Hints remounts the path
                // and the pulse animation replays instead of staying finished.
                key={`hint-${hintSignal}`}
                d={polygonToPath(region.polygon)}
                vectorEffect="non-scaling-stroke"
                className={`hotspot-hint-glow pointer-events-none ${
                  manualHintActive ? "hotspot-hint-glow--long" : ""
                }`}
              />
            )}
            <path
              d={polygonToPath(region.polygon)}
              role="button"
              tabIndex={0}
              aria-label={npc ? npc.nameEn : region.labelEn}
              vectorEffect="non-scaling-stroke"
              className="hotspot-region fill-transparent stroke-transparent"
              onClick={() => onRegionClick(region.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onRegionClick(region.id);
                }
              }}
              onMouseEnter={() => npc && setHoveredNpc(region.id)}
              onMouseLeave={() => npc && setHoveredNpc((id) => (id === region.id ? null : id))}
              onFocus={() => npc && setHoveredNpc(region.id)}
              onBlur={() => npc && setHoveredNpc((id) => (id === region.id ? null : id))}
            />
            {npc && hoveredNpc === region.id && (
              <g transform={`translate(${cx}, ${cy})`} className="pointer-events-none">
                <rect x={-64} y={-46} width={128} height={28} rx={6} className="fill-black/75" />
                <text x={0} y={-26} textAnchor="middle" className="fill-amber-100 text-[14px]">
                  {npc.nameEn}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
