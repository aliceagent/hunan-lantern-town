"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayerState } from "@/lib/engine";
import type { Manifest } from "@/lib/manifest";
import { STRINGS } from "@/lib/strings";

/* Fullscreen API with the webkit prefix iPadOS/older Safari still need.
   iPhone Safari has neither method on elements, so the menu item hides
   itself there and the h-dvh + viewport-fit=cover layout is the fallback. */
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
};
type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => void;
};

function fullscreenActive(): boolean {
  const doc = document as FullscreenDocument;
  return Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement);
}

const itemClass =
  "flex min-h-11 w-full touch-manipulation items-center px-4 text-left text-sm text-zinc-200 hover:bg-zinc-800 active:bg-zinc-800";

/**
 * The one piece of chrome on /play: a round bottom-right toggle (thumb
 * territory, clear of the home indicator) that opens a compact menu with
 * everything the old top HUD row held. Always mounted, even during clips,
 * so the painting keeps the whole viewport.
 */
export default function MenuFab({
  manifest,
  state,
  onToggleMute,
  onReset,
  onHints,
  onJumpTo,
}: {
  manifest: Manifest;
  state: PlayerState;
  onToggleMute: () => void;
  onReset: () => void;
  onHints: () => void;
  /** Jump back to trail step `index` (the engine truncates what follows). */
  onJumpTo: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // True when launched chrome-less from the Home Screen — no hint needed then.
  const [standalone, setStandalone] = useState(false);
  const trailRef = useRef<HTMLDivElement>(null);

  const frame = manifest.frames[state.currentFrame];
  const location = frame ? manifest.locations.find((l) => l.id === frame.location) : undefined;

  const locationName = (id: string) =>
    manifest.locations.find((l) => l.id === id)?.nameEn ?? STRINGS.menu.unknownLocation;

  useEffect(() => {
    const el = document.documentElement as FullscreenElement;
    setFullscreenSupported(Boolean(el.requestFullscreen ?? el.webkitRequestFullscreen));
    setStandalone(
      window.matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true,
    );
    const onChange = () => setIsFullscreen(fullscreenActive());
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      setConfirmingReset(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    // Newest step last: keep the tail of a long trail in view when opening.
    if (!open) return;
    const list = trailRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [open, state.trail.length]);

  function close() {
    setOpen(false);
    setConfirmingReset(false);
  }

  function toggleFullscreen() {
    // Must run synchronously in the tap handler — fullscreen requests
    // outside a user gesture are rejected (same rule as video.play()).
    const doc = document as FullscreenDocument;
    const el = document.documentElement as FullscreenElement;
    if (fullscreenActive()) {
      (doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(doc);
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => undefined);
    } else {
      el.webkitRequestFullscreen?.();
    }
    close();
  }

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label={STRINGS.menu.close}
          onClick={close}
          className="fixed inset-0 z-20 cursor-default"
        />
      )}
      {open && (
        <div className="fixed right-[calc(env(safe-area-inset-right)+0.75rem)] bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-30 w-60 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950/95 py-1 shadow-xl backdrop-blur">
          <div className="flex items-baseline justify-between gap-2 border-b border-zinc-800 px-4 py-2.5 text-xs">
            <span className="truncate font-medium text-zinc-200">
              {location?.nameEn ?? STRINGS.menu.unknownLocation}
            </span>
            <span className="shrink-0 text-zinc-400">{STRINGS.menu.moves(state.moves)}</span>
          </div>
          <div className="border-b border-zinc-800 py-1">
            <div className="px-4 pt-1.5 pb-0.5 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
              {STRINGS.menu.path}
            </div>
            <div ref={trailRef} className="max-h-44 overflow-y-auto overscroll-contain">
              <ol>
                {state.trail.map((step, index) => {
                  const name = index === 0 ? STRINGS.menu.pathStart : locationName(step.location);
                  const current = index === state.trail.length - 1;
                  return (
                    <li key={`${index}-${step.frame}`}>
                      {current ? (
                        <div
                          aria-current="step"
                          className="flex min-h-9 items-center gap-2 px-4 text-sm text-amber-200"
                        >
                          <span className="truncate">{name}</span>
                          <span className="shrink-0 text-xs text-zinc-500">
                            {STRINGS.menu.pathHere}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          aria-label={STRINGS.menu.pathJumpTo(name)}
                          onClick={() => {
                            onJumpTo(index);
                            close();
                          }}
                          className="flex min-h-9 w-full touch-manipulation items-center px-4 text-left text-sm text-zinc-300 hover:bg-zinc-800 active:bg-zinc-800"
                        >
                          <span className="truncate">{name}</span>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onHints();
              close();
            }}
            className={`${itemClass} text-amber-200`}
          >
            {STRINGS.menu.hints}
          </button>
          <button type="button" onClick={onToggleMute} aria-pressed={state.muted} className={itemClass}>
            {state.muted ? STRINGS.menu.unmute : STRINGS.menu.mute}
          </button>
          {fullscreenSupported ? (
            <button type="button" onClick={toggleFullscreen} className={itemClass}>
              {isFullscreen ? STRINGS.menu.exitFullscreen : STRINGS.menu.fullscreen}
            </button>
          ) : (
            !standalone && (
              <p className="px-4 py-2 text-xs leading-snug text-zinc-500">
                {STRINGS.menu.fullscreenUnavailable}
              </p>
            )
          )}
          {confirmingReset ? (
            <div className="border-t border-zinc-800">
              <div className="px-4 pt-2 text-xs text-zinc-400">{STRINGS.menu.resetConfirm}</div>
              <button
                type="button"
                onClick={() => {
                  onReset();
                  close();
                }}
                className={`${itemClass} text-amber-300`}
              >
                {STRINGS.menu.resetConfirmYes}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className={`${itemClass} text-zinc-400`}
              >
                {STRINGS.menu.resetConfirmNo}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmingReset(true)} className={itemClass}>
              {STRINGS.menu.reset}
            </button>
          )}
        </div>
      )}
      <button
        type="button"
        aria-label={open ? STRINGS.menu.close : STRINGS.menu.open}
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className="fixed right-[calc(env(safe-area-inset-right)+0.75rem)] bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-30 flex h-12 w-12 touch-manipulation items-center justify-center rounded-full border border-zinc-600 bg-black/60 text-zinc-200 shadow-lg backdrop-blur hover:bg-zinc-800/80"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {open ? (
            <>
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </>
          ) : (
            <>
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </>
          )}
        </svg>
      </button>
    </>
  );
}
