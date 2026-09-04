"use client";

import { useEffect, useState } from "react";
import type { PlayerState } from "@/lib/engine";
import type { Manifest } from "@/lib/manifest";
import { STRINGS } from "@/lib/strings";
import PathCarousel from "./PathCarousel";

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
 * everything the old top HUD row held. The trail lives one level down, in
 * the Path sub-view (PathCarousel), so the main menu stays five short rows.
 * Always mounted, even during clips, so the painting keeps the whole
 * viewport.
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
  // The popover is two views: the short main menu, and the Path carousel.
  const [view, setView] = useState<"menu" | "path">("menu");
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // True when launched chrome-less from the Home Screen — no hint needed then.
  const [standalone, setStandalone] = useState(false);

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
      setView("menu");
      setConfirmingReset(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    setView("menu");
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
        /* Bottom-anchored above the FAB, growing upward. The max-height cap —
           dvh minus both safe areas minus the FAB zone (4.5rem) minus a
           0.75rem top margin — is what keeps landscape Safari from clipping
           the top of the menu; anything that doesn't fit scrolls inside. */
        <div
          className={`fixed right-[calc(env(safe-area-inset-right)+0.75rem)] bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-30 flex max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-5.25rem)] flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950/95 shadow-xl backdrop-blur ${
            view === "path"
              ? "w-[min(24rem,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)-1.5rem))]"
              : "w-60"
          }`}
        >
          {view === "path" ? (
            <PathCarousel
              manifest={manifest}
              state={state}
              onBack={() => setView("menu")}
              onJumpTo={(index) => {
                onJumpTo(index);
                close();
              }}
            />
          ) : (
            <div className="min-h-0 overflow-y-auto overscroll-contain py-1">
              <button
                type="button"
                onClick={() => {
                  setConfirmingReset(false);
                  setView("path");
                }}
                className={`${itemClass} justify-between gap-2`}
              >
                <span>{STRINGS.menu.path}</span>
                <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-500">
                  {STRINGS.menu.moves(state.moves)}
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M10 6l6 6-6 6" />
                  </svg>
                </span>
              </button>
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
