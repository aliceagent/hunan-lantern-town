"use client";

import { useEffect, useRef, useState } from "react";
import { STRINGS } from "@/lib/strings";

/**
 * The end of the visual world: shown on a leaf still (no warm hotspot, no
 * NPC — nothing generated beyond it yet). A fog bank rising from the bottom
 * of the painting, not an error and not a dialog: it blocks nothing
 * (pointer-events-none), invents no fake targets, and leaves the menu FAB —
 * and the Path jump-back behind it — fully usable.
 */
export default function WorldEdgeBanner({ hintSignal }: { hintSignal: number }) {
  // Hints must not silently no-op here (there is nothing to glow), so a
  // press replays the banner's nudge animation instead. Compare against the
  // mount-time value: a signal bumped on an earlier frame must not fire now.
  const [nudge, setNudge] = useState(0);
  const mountSignal = useRef(hintSignal);
  useEffect(() => {
    if (hintSignal !== mountSignal.current) setNudge((n) => n + 1);
  }, [hintSignal]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="world-edge-veil pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center px-6 pt-20 pb-6 text-center"
    >
      {/* Keyed so each Hints press remounts the block and the nudge replays. */}
      <div key={nudge} className={nudge > 0 ? "world-edge-nudge" : undefined}>
        <p className="text-sm font-medium text-amber-200">{STRINGS.worldEdge.title}</p>
        <p className="mt-1 text-xs leading-snug text-zinc-300">{STRINGS.worldEdge.body}</p>
      </div>
    </div>
  );
}
