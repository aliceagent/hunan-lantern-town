"use client";

import { useEffect, useState } from "react";
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
  onRegionClick,
}: {
  manifest: Manifest;
  frame: Frame;
  /** False while a clip is loading/playing or a modal is open — input is locked. */
  interactive: boolean;
  onRegionClick: (regionId: string) => void;
}) {
  const hintActive = useHintPulse(frame.hash);
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
                d={polygonToPath(region.polygon)}
                vectorEffect="non-scaling-stroke"
                className="hotspot-hint-glow pointer-events-none"
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
