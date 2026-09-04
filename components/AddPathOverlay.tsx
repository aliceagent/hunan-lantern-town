"use client";

import { useEffect, useRef, useState } from "react";
import { addPathBlock, cssPointToStill, cssRectToStillBbox, overlappingRegionIds, regionContainingPoint } from "@/lib/authoring";
import { isInteractive } from "@/lib/engine";
import type { Frame, Manifest } from "@/lib/manifest";
import { STRINGS } from "@/lib/strings";
import { polygonCentroid, polygonToPath } from "@/lib/svg";

interface DragRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** A released drag that hit existing regions; nonce remounts the flash so a repeat replays. */
interface Conflict {
  ids: string[];
  nonce: number;
}

/** Show a region's label only when its box has room for it in still pixels. */
function labelFits(region: Frame["regions"][number]): boolean {
  const [, , w, h] = region.bbox;
  return region.labelEn.length > 0 && w >= region.labelEn.length * 9 && h >= 26;
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
  manifest,
  frame,
  locationId,
  locationName,
  onExit,
}: {
  manifest: Manifest;
  frame: Frame;
  locationId?: string;
  locationName?: string;
  onExit: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragRect | null>(null);
  const [copied, setCopied] = useState(false);
  const [warmTap, setWarmTap] = useState(false);
  const pendingTap = useRef<string | null>(null);
  // The last release that overlapped existing taps: flashes those regions red
  // and shows the overlap line; nothing is copied. Cleared by timer or a new drag.
  const [conflict, setConflict] = useState<Conflict | null>(null);
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

  useEffect(() => {
    if (!conflict) return;
    const timer = setTimeout(() => setConflict(null), 2000);
    return () => clearTimeout(timer);
  }, [conflict]);

  useEffect(() => {
    if (!warmTap) return;
    const timer = setTimeout(() => setWarmTap(false), 2000);
    return () => clearTimeout(timer);
  }, [warmTap]);

  function localPoint(event: React.PointerEvent): { x: number; y: number } | null {
    const el = boxRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function copyText(text: string) {
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

  function stillPointFromEvent(event: React.PointerEvent): [number, number] | null {
    const el = boxRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return cssPointToStill(
      event.clientX - rect.left,
      event.clientY - rect.top,
      rect.width,
      rect.height,
      frame.width,
      frame.height,
    );
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (fallbackText) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const point = localPoint(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setConflict(null);
    setWarmTap(false);
    const still = stillPointFromEvent(event);
    const hitId = still ? regionContainingPoint(still[0], still[1], frame.regions) : null;
    if (hitId) {
      pendingTap.current = hitId;
      setDrag(null);
      return;
    }
    pendingTap.current = null;
    setDrag({ x1: point.x, y1: point.y, x2: point.x, y2: point.y });
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const point = localPoint(event);
    if (!point) return;
    setDrag({ ...drag, x2: point.x, y2: point.y });
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const tapId = pendingTap.current;
    pendingTap.current = null;
    if (tapId) {
      setDrag(null);
      const region = frame.regions.find((r) => r.id === tapId);
      if (!region) return;
      if (isInteractive(manifest, frame, region)) {
        setCopied(false);
        setWarmTap(true);
        return;
      }
      copyText(
        addPathBlock({
          frameHash: frame.hash,
          locationId,
          locationName,
          stillWidth: frame.width,
          stillHeight: frame.height,
          bbox: region.bbox,
          regionId: region.id,
          labelEn: region.labelEn,
        }),
      );
      return;
    }
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
    if (!bbox) return;
    const overlapIds = overlappingRegionIds(bbox, frame.regions);
    if (overlapIds.length > 0) {
      setCopied(false);
      setConflict((prev) => ({ ids: overlapIds, nonce: (prev?.nonce ?? 0) + 1 }));
      return;
    }
    copyText(
      addPathBlock({
        frameHash: frame.hash,
        locationId,
        locationName,
        stillWidth: frame.width,
        stillHeight: frame.height,
        bbox,
      }),
    );
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
      {/* Every existing tappable region on this still (warm or cold), teal so
          Jonathan draws around them; the viewBox maps still pixels onto the
          letterboxed painting exactly like HotspotLayer. Player hotspots are
          separately locked while authoring — these are paint, not targets. */}
      <svg
        viewBox={`0 0 ${frame.width} ${frame.height}`}
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        {frame.regions.map((region) => {
          const flashing = conflict?.ids.includes(region.id) ?? false;
          const warm = isInteractive(manifest, frame, region);
          const [cx, cy] = polygonCentroid(region.polygon);
          const paintClass = flashing
            ? "authoring-region-conflict"
            : warm
              ? "authoring-region-warm"
              : "authoring-region";
          return (
            <g key={region.id}>
              <path
                key={flashing ? `flash-${conflict!.nonce}` : "calm"}
                d={polygonToPath(region.polygon)}
                vectorEffect="non-scaling-stroke"
                className={paintClass}
              />
              {labelFits(region) && (
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  className={`text-[14px] ${
                    flashing ? "fill-red-200" : warm ? "fill-amber-100" : "fill-teal-100"
                  }`}
                  style={{ paintOrder: "stroke", stroke: "rgb(0 0 0 / 0.7)", strokeWidth: 3 }}
                >
                  {warm ? `${region.labelEn} · video` : region.labelEn}
                </text>
              )}
            </g>
          );
        })}
      </svg>
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
      {warmTap && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4"
        >
          <span className="rounded-full border border-amber-400/50 bg-zinc-950/90 px-4 py-1.5 text-center text-sm text-amber-200 shadow-lg">
            {STRINGS.authoring.warmTap}
          </span>
        </div>
      )}
      {conflict && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4"
        >
          <span className="rounded-full border border-red-400/50 bg-zinc-950/90 px-4 py-1.5 text-center text-sm text-red-200 shadow-lg">
            {STRINGS.authoring.overlap}
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
