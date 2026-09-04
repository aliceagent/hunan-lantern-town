"use client";

import { useEffect, useRef, useState } from "react";
import { addPathBlock, cssRectToStillBbox } from "@/lib/authoring";
import type { Frame } from "@/lib/manifest";
import { STRINGS } from "@/lib/strings";

interface DragRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Draw mode for the "Add path" authoring utility (Jonathan → Telegram → Alice).
 * Covers the stage box, swallows pointer input, and turns a tap-drag-release
 * into a `[x, y, w, h]` bbox in still pixel space (via lib/authoring's
 * letterbox math), copied to the clipboard as a pasteable block. Stays armed
 * after each copy so several paths can be marked on one still; exit via the
 * Done chip, Escape, or the FAB. Authoring-only: nothing is POSTed and the
 * manifest is untouched — a rect is not a hotspot until Alice ingests the
 * paste.
 */
export default function AddPathOverlay({
  frame,
  locationId,
  locationName,
  onExit,
}: {
  frame: Frame;
  locationId?: string;
  locationName?: string;
  onExit: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragRect | null>(null);
  const [copied, setCopied] = useState(false);
  // Set when the clipboard write is rejected/unavailable (Safari can decline
  // even in a gesture): a manual-copy textarea replaces silent failure.
  const [fallbackText, setFallbackText] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onExit();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onExit]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  function localPoint(event: React.PointerEvent): { x: number; y: number } | null {
    const el = boxRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (fallbackText) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const point = localPoint(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ x1: point.x, y1: point.y, x2: point.x, y2: point.y });
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const point = localPoint(event);
    if (!point) return;
    setDrag({ ...drag, x2: point.x, y2: point.y });
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    setDrag(null);
    const el = boxRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const bbox = cssRectToStillBbox(
      { x1: drag.x1, y1: drag.y1, x2: event.clientX - rect.left, y2: event.clientY - rect.top },
      rect.width,
      rect.height,
      frame.width,
      frame.height,
    );
    // A tap or a rect entirely in the letterbox void: not a path, stay armed.
    if (!bbox) return;
    const text = addPathBlock({
      frameHash: frame.hash,
      locationId,
      locationName,
      stillWidth: frame.width,
      stillHeight: frame.height,
      bbox,
    });
    // The write must start synchronously inside the pointerup gesture or
    // Safari rejects it; any rejection falls back to manual copy.
    const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
    if (clipboard?.writeText) {
      clipboard.writeText(text).then(
        () => setCopied(true),
        () => setFallbackText(text),
      );
    } else {
      setFallbackText(text);
    }
  }

  const rectStyle = drag
    ? {
        left: Math.min(drag.x1, drag.x2),
        top: Math.min(drag.y1, drag.y2),
        width: Math.abs(drag.x2 - drag.x1),
        height: Math.abs(drag.y2 - drag.y1),
      }
    : undefined;

  return (
    <div
      ref={boxRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDrag(null)}
      className="absolute inset-0 z-10 cursor-crosshair touch-none select-none"
    >
      {rectStyle && (
        <div
          style={rectStyle}
          className="pointer-events-none absolute border-2 border-amber-400 bg-amber-400/10"
        />
      )}
      <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-950/85 pl-3 text-xs text-zinc-200 shadow-lg backdrop-blur">
          <span>{STRINGS.authoring.hint}</span>
          <button
            type="button"
            onClick={onExit}
            className="min-h-10 touch-manipulation rounded-full px-3 font-medium text-amber-300 hover:bg-zinc-800 active:bg-zinc-800"
          >
            {STRINGS.authoring.done}
          </button>
        </div>
      </div>
      {copied && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center"
        >
          <span className="rounded-full border border-amber-300/40 bg-zinc-950/90 px-4 py-1.5 text-sm text-amber-200 shadow-lg">
            {STRINGS.authoring.copied}
          </span>
        </div>
      )}
      {fallbackText !== null && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-950 p-3 shadow-xl">
            <p className="pb-2 text-xs text-zinc-400">{STRINGS.authoring.copyFallback}</p>
            <textarea
              readOnly
              autoFocus
              rows={6}
              value={fallbackText}
              onFocus={(event) => event.currentTarget.select()}
              className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 p-2 font-mono text-xs text-zinc-200"
            />
            <button
              type="button"
              onClick={() => setFallbackText(null)}
              className="mt-2 flex min-h-10 w-full touch-manipulation items-center justify-center rounded-lg bg-zinc-900 text-sm text-zinc-300 hover:bg-zinc-800 active:bg-zinc-800"
            >
              {STRINGS.authoring.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
