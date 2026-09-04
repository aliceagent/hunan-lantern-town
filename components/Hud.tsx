"use client";

import { useState } from "react";
import type { PlayerState } from "@/lib/engine";
import type { Manifest } from "@/lib/manifest";
import { STRINGS } from "@/lib/strings";

export default function Hud({
  manifest,
  state,
  onToggleMute,
  onReset,
}: {
  manifest: Manifest;
  state: PlayerState;
  onToggleMute: () => void;
  onReset: () => void;
}) {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const frame = manifest.frames[state.currentFrame];
  const location = frame ? manifest.locations.find((l) => l.id === frame.location) : undefined;

  return (
    <div className="mx-auto flex w-full max-w-[1344px] shrink-0 items-center justify-between gap-2 px-3 py-1 text-sm text-zinc-200">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate font-medium">{location?.nameEn ?? STRINGS.hud.unknownLocation}</span>
        <span className="text-zinc-500">·</span>
        <span className="shrink-0 text-zinc-400">{STRINGS.hud.moves(state.moves)}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleMute}
          aria-pressed={state.muted}
          className="min-h-11 touch-manipulation rounded-full border border-zinc-600 px-3.5 text-zinc-300 hover:bg-zinc-800"
        >
          {state.muted ? STRINGS.hud.unmute : STRINGS.hud.mute}
        </button>
        {confirmingReset ? (
          <span className="flex items-center gap-1.5">
            <span className="hidden text-zinc-400 sm:inline">{STRINGS.hud.resetConfirm}</span>
            <button
              type="button"
              onClick={() => {
                setConfirmingReset(false);
                onReset();
              }}
              className="min-h-11 touch-manipulation rounded-full border border-amber-500 px-3.5 text-amber-300 hover:bg-amber-500/10"
            >
              {STRINGS.hud.resetConfirmYes}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingReset(false)}
              className="min-h-11 touch-manipulation rounded-full border border-zinc-600 px-3.5 text-zinc-400 hover:bg-zinc-800"
            >
              {STRINGS.hud.resetConfirmNo}
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingReset(true)}
            className="min-h-11 touch-manipulation rounded-full border border-zinc-600 px-3.5 text-zinc-300 hover:bg-zinc-800"
          >
            {STRINGS.hud.reset}
          </button>
        )}
      </div>
    </div>
  );
}
