"use client";

import { useEffect, useRef, useState } from "react";
import { applyClipEnd, resolveClick, type PlayerState } from "@/lib/engine";
import type { Manifest, Npc } from "@/lib/manifest";
import { bufferedProgress, clipUrl, stillUrl } from "@/lib/media";
import { idlePlayback, onClick as onPlaybackClick, onEnded, onFailure, onPlaying } from "@/lib/playback";
import HotspotLayer from "./HotspotLayer";
import ProgressBar from "./ProgressBar";

export default function Stage({
  manifest,
  state,
  interactionEnabled,
  onAdvance,
  onNpcClick,
  onFoggy,
  onGesture,
}: {
  manifest: Manifest;
  state: PlayerState;
  /** False while a modal (NpcCard) has focus — hotspots stay locked. */
  interactionEnabled: boolean;
  onAdvance: (next: PlayerState) => void;
  onNpcClick: (npc: Npc) => void;
  onFoggy: () => void;
  onGesture: () => void;
}) {
  const [playback, setPlayback] = useState(idlePlayback);
  const [progress, setProgress] = useState(0);
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

    const video = videoRef.current;
    if (!video) return;

    activeClipIdRef.current = result.clip.id;
    retriedRef.current = false;
    setPlayback(onPlaybackClick());
    setProgress(0);
    video.src = clipUrl(manifest.meta.mediaBase, result.clip.id);
    // video.play() must run synchronously inside this click handler — not
    // after an await — or mobile browsers refuse the autoplay (errata #4).
    const playPromise = video.play();
    setPlayback((prev) => onPlaying(prev));
    playPromise?.catch(handlePlaybackFailure);
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function onProgress() {
      if (!video) return;
      setProgress(bufferedProgress(video.buffered, video.duration));
    }
    function onVideoEnded() {
      const clipId = activeClipIdRef.current;
      if (clipId) {
        const next = applyClipEnd(manifest, stateRef.current, clipId);
        onAdvance(next);
      }
      activeClipIdRef.current = null;
      retriedRef.current = false;
      setPlayback(onEnded());
      setProgress(0);
    }
    function onVideoError() {
      handlePlaybackFailure();
    }

    video.addEventListener("progress", onProgress);
    video.addEventListener("ended", onVideoEnded);
    video.addEventListener("error", onVideoError);
    return () => {
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("ended", onVideoEnded);
      video.removeEventListener("error", onVideoError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest]);

  if (!frame) {
    return (
      <div className="flex aspect-[7/4] w-full max-w-[1344px] items-center justify-center bg-black text-zinc-400">
        Unknown frame: {state.currentFrame}
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-[1344px] touch-manipulation overflow-hidden bg-black">
      <div className="relative aspect-[7/4] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={stillUrl(manifest.meta.mediaBase, frame.hash, "jpg")}
          alt=""
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-150 ${
            playback.phase === "playing" ? "opacity-0" : "opacity-100"
          }`}
        />
        <video
          ref={videoRef}
          playsInline
          preload="auto"
          disablePictureInPicture
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-150 ${
            playback.phase === "playing" ? "opacity-100" : "opacity-0"
          }`}
        />
        <HotspotLayer
          manifest={manifest}
          frame={frame}
          interactive={interactionEnabled && playback.phase === "still"}
          onRegionClick={handleRegionClick}
        />
      </div>
      {(playback.phase === "loading" || playback.phase === "playing") && (
        <ProgressBar progress={progress} />
      )}
    </div>
  );
}
