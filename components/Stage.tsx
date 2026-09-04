"use client";

import { useEffect, useRef, useState } from "react";
import { applyClipEnd, isWorldEdge, resolveClick, type PlayerState } from "@/lib/engine";
import type { Manifest, Npc } from "@/lib/manifest";
import { bufferedProgress, clipUrl, stillUrl } from "@/lib/media";
import { idlePlayback, onClick as onPlaybackClick, onEnded, onFailure, onPlaying } from "@/lib/playback";
import { addPathBlock } from "@/lib/authoring";
import { STRINGS } from "@/lib/strings";
import HotspotLayer from "./HotspotLayer";
import ProgressBar from "./ProgressBar";
import WorldEdgeBanner from "./WorldEdgeBanner";

export default function Stage({
  manifest,
  state,
  interactionEnabled,
  hintSignal,
  onAdvance,
  onNpcClick,
  onFoggy,
  onGesture,
}: {
  manifest: Manifest;
  state: PlayerState;
  /** False while a modal (NpcCard) has focus — hotspots stay locked. */
  interactionEnabled: boolean;
  /** Bumped by the HUD Hints button; HotspotLayer flashes the hint glow. */
  hintSignal: number;
  onAdvance: (next: PlayerState) => void;
  onNpcClick: (npc: Npc) => void;
  onFoggy: () => void;
  onGesture: () => void;
}) {
  const [playback, setPlayback] = useState(idlePlayback);
  const [progress, setProgress] = useState(0);
  // The still stays painted underneath at all times; the video sits on top
  // and is only revealed once it is actually rendering frames ("playing"
  // event), then held through the frame advance until the next still has
  // loaded. This is what prevents the tap→black-screen gap on slow networks.
  const [videoVisible, setVideoVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeClipIdRef = useRef<string | null>(null);
  const stateRef = useRef(state);
  const retriedRef = useRef(false);
  stateRef.current = state;

  const frame = manifest.frames[state.currentFrame];

  function handlePlaybackFailure() {
    const video = videoRef.current;
    const clipId = activeClipIdRef.current;
    if (!video || !clipId) return;
    setVideoVisible(false);
    const { state: next, retry } = onFailure({ ...idlePlayback, retried: retriedRef.current });
    setPlayback((prev) => ({ ...next, phase: retry ? prev.phase : "still" }));
    if (retry) {
      retriedRef.current = true;
      video.src = clipUrl(manifest.meta.mediaBase, clipId);
      video.play().catch(handlePlaybackFailure);
      return;
    }
    retriedRef.current = false;
    activeClipIdRef.current = null;
    setProgress(0);
    onFoggy();
  }

  function handleRegionClick(regionId: string) {
    if (playback.phase !== "still") return;
    const result = resolveClick(manifest, state, regionId);
    if (!result) return;
    onGesture();

    if (result.kind === "npc") {
      onNpcClick(result.npc);
      return;
    }

    if (result.kind === "cold") {
      const location = manifest.locations.find((l) => l.id === frame.location);
      const text = addPathBlock({
        frameHash: frame.hash,
        locationId: frame.location,
        locationName: location?.nameEn,
        stillWidth: frame.width,
        stillHeight: frame.height,
        bbox: result.region.bbox,
        regionId: result.regionId,
        labelEn: result.region.labelEn,
      });
      const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
      if (clipboard?.writeText) {
        clipboard.writeText(text).then(
          () => setCopied(true),
          () => setCopied(true),
        );
      } else {
        setCopied(true);
      }
      window.setTimeout(() => setCopied(false), 1800);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    activeClipIdRef.current = result.clip.id;
    retriedRef.current = false;
    setPlayback(onPlaybackClick());
    setProgress(0);
    // Hide the video before resetting src (a src change blanks the element),
    // leaving the current still visible while the clip buffers. The video is
    // revealed by the "playing" event, not here.
    setVideoVisible(false);
    video.src = clipUrl(manifest.meta.mediaBase, result.clip.id);
    // video.play() must run synchronously inside this click handler — not
    // after an await — or mobile browsers refuse the autoplay (errata #4).
    const playPromise = video.play();
    playPromise?.catch(handlePlaybackFailure);
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function onProgress() {
      if (!video) return;
      setProgress(bufferedProgress(video.buffered, video.duration));
    }
    function onVideoPlaying() {
      // First rendered frame is ready — safe to reveal without a black flash.
      setPlayback((prev) => onPlaying(prev));
      setVideoVisible(true);
    }
    function onVideoEnded() {
      const clipId = activeClipIdRef.current;
      if (clipId) {
        const next = applyClipEnd(manifest, stateRef.current, clipId);
        onAdvance(next);
      }
      activeClipIdRef.current = null;
      retriedRef.current = false;
      // Keep the video's last frame up; the new still's onLoad releases it.
      setPlayback(onEnded());
      setProgress(0);
    }
    function onVideoError() {
      handlePlaybackFailure();
    }

    video.addEventListener("progress", onProgress);
    video.addEventListener("playing", onVideoPlaying);
    video.addEventListener("ended", onVideoEnded);
    video.addEventListener("error", onVideoError);
    return () => {
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("playing", onVideoPlaying);
      video.removeEventListener("ended", onVideoEnded);
      video.removeEventListener("error", onVideoError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest]);

  if (!frame) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-zinc-400">
        Unknown frame: {state.currentFrame}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full touch-manipulation overflow-hidden bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={stillUrl(manifest.meta.mediaBase, frame.hash, "jpg")}
        alt=""
        onLoad={() => setVideoVisible(false)}
        className="absolute inset-0 h-full w-full object-contain"
      />
      <video
        ref={videoRef}
        playsInline
        preload="auto"
        disablePictureInPicture
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-200 ${
          videoVisible ? "opacity-100" : "opacity-0"
        }`}
      />
      {playback.phase === "still" && (
        <HotspotLayer
          manifest={manifest}
          frame={frame}
          interactive={interactionEnabled}
          hintSignal={hintSignal}
          onRegionClick={handleRegionClick}
        />
      )}
      {playback.phase === "still" && interactionEnabled && isWorldEdge(manifest, frame) && (
        <WorldEdgeBanner hintSignal={hintSignal} />
      )}
      {copied && (
        <div
          role="status"
          className="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center"
        >
          <p className="rounded-full bg-black/80 px-3 py-1 text-xs text-amber-100">
            {STRINGS.authoring.copiedCold}
          </p>
        </div>
      )}
      {(playback.phase === "loading" || playback.phase === "playing") && (
        <div className="absolute inset-x-0 bottom-0 z-10">
          <ProgressBar progress={progress} />
        </div>
      )}
    </div>
  );
}
