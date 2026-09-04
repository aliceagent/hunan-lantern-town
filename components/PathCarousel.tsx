"use client";

import { useEffect, useRef } from "react";
import type { PlayerState } from "@/lib/engine";
import type { Manifest } from "@/lib/manifest";
import { stillUrl } from "@/lib/media";
import { STRINGS } from "@/lib/strings";

/**
 * The Path sub-view of the menu popover: the trail as a horizontal carousel
 * of still thumbnails, newest last. Horizontal because a landscape phone has
 * width to spare and almost no height; thumbnails because titles alone can't
 * tell two stills in the same location apart. Tapping an earlier card jumps
 * back (the engine truncates what follows); the current card is inert.
 */
export default function PathCarousel({
  manifest,
  state,
  onJumpTo,
  onBack,
}: {
  manifest: Manifest;
  state: PlayerState;
  /** Jump back to trail step `index` (the engine truncates what follows). */
  onJumpTo: (index: number) => void;
  onBack: () => void;
}) {
  const scrollerRef = useRef<HTMLOListElement>(null);

  const locationName = (id: string) =>
    manifest.locations.find((l) => l.id === id)?.nameEn ?? STRINGS.menu.unknownLocation;

  const currentStep = state.trail[state.trail.length - 1];

  useEffect(() => {
    // Newest step last: land with the current card in view.
    const el = scrollerRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [state.trail.length]);

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center gap-1.5 border-b border-zinc-800 pr-4">
        <button
          type="button"
          aria-label={STRINGS.menu.pathBack}
          onClick={onBack}
          className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center text-zinc-300 hover:bg-zinc-800 active:bg-zinc-800"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 6l-6 6 6 6" />
          </svg>
        </button>
        <span className="truncate text-xs font-medium text-zinc-200">
          {currentStep ? locationName(currentStep.location) : STRINGS.menu.unknownLocation}
        </span>
        <span className="shrink-0 text-xs text-zinc-400">
          · {STRINGS.menu.moves(state.moves)}
        </span>
      </div>
      <ol
        ref={scrollerRef}
        className="no-scrollbar flex min-h-0 gap-2 overflow-x-auto overscroll-contain p-3"
      >
        {state.trail.map((step, index) => {
          const name = index === 0 ? STRINGS.menu.pathStart : locationName(step.location);
          const current = index === state.trail.length - 1;
          const thumb = stillUrl(manifest.meta.mediaBase, step.frame, "jpg");
          return (
            <li key={`${index}-${step.frame}`} className="w-28 shrink-0">
              {current ? (
                <div aria-current="step" className="flex w-full flex-col gap-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumb}
                    alt=""
                    className="aspect-[7/4] w-full rounded-lg border border-amber-300/70 bg-zinc-900 object-cover"
                  />
                  <span className="flex items-baseline gap-1 text-xs text-amber-200">
                    <span className="truncate">{name}</span>
                    <span className="shrink-0 text-[11px] text-zinc-500">
                      {STRINGS.menu.pathHere}
                    </span>
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  aria-label={STRINGS.menu.pathJumpTo(name)}
                  onClick={() => onJumpTo(index)}
                  className="flex w-full touch-manipulation flex-col gap-1 text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumb}
                    alt=""
                    className="aspect-[7/4] w-full rounded-lg border border-zinc-700 bg-zinc-900 object-cover"
                  />
                  <span className="truncate text-xs text-zinc-300">{name}</span>
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
