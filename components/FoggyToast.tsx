"use client";

import { useEffect } from "react";
import { scheduleAutoDismiss } from "@/lib/playback";
import { STRINGS } from "@/lib/strings";

export default function FoggyToast({
  onDismiss,
  durationMs = 3000,
}: {
  onDismiss: () => void;
  durationMs?: number;
}) {
  useEffect(() => scheduleAutoDismiss(onDismiss, durationMs), [onDismiss, durationMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-sm text-zinc-100 shadow-lg"
    >
      {STRINGS.foggyToast.message}
    </div>
  );
}
