"use client";

import { useEffect, useRef, useState } from "react";
import AddPathOverlay from "@/components/AddPathOverlay";
import FoggyToast from "@/components/FoggyToast";
import MenuFab from "@/components/MenuFab";
import NpcCard from "@/components/NpcCard";
import Stage from "@/components/Stage";
import { initialState, jumpToTrailStep, type PlayerState } from "@/lib/engine";
import type { Manifest, Npc } from "@/lib/manifest";
import { audioUrl, prefetchFrame } from "@/lib/media";
import { clearSave, loadSave, saveState } from "@/lib/save";

export default function PlayPage() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [state, setState] = useState<PlayerState | null>(null);
  const [npc, setNpc] = useState<Npc | null>(null);
  const [foggy, setFoggy] = useState(false);
  const [gestured, setGestured] = useState(false);
  // "Add path" draw mode (authoring utility) — locks hotspots, arms the overlay.
  const [authoring, setAuthoring] = useState(false);
  // Monotonic counter; each bump asks HotspotLayer to flash the hint glow.
  const [hintSignal, setHintSignal] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/manifest.json")
      .then((res) => res.json())
      .then((data: Manifest) => {
        if (cancelled) return;
        setManifest(data);
        setState(loadSave(data));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!manifest || !state) return;
    saveState(state);
    void prefetchFrame(manifest, state.currentFrame);
  }, [manifest, state]);

  const frame = manifest && state ? manifest.frames[state.currentFrame] : undefined;
  const location = frame ? manifest?.locations.find((l) => l.id === frame.location) : undefined;
  const ambient = location?.ambientAudio && manifest ? audioUrl(manifest.meta.mediaBase, location.ambientAudio) : null;

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !ambient) return;
    el.volume = 0.25;
    if (state?.muted || !gestured) {
      el.pause();
      return;
    }
    void el.play().catch(() => undefined);
  }, [ambient, state?.muted, gestured]);

  if (!manifest || !state) {
    return (
      <main className="flex h-dvh items-center justify-center bg-black text-zinc-400">
        Loading…
      </main>
    );
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-black pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]">
      {/* Portrait: the stage box hugs the 7:4 art (width-driven) and pins to
          the top so the letterbox void falls below the painting, not around
          it. Landscape keeps the height-filling centered box. Never crops:
          the box matches the art's aspect, media stays object-contain. */}
      <div className="flex min-h-0 w-full flex-1 items-center justify-center portrait:items-start">
        <div className="relative h-full max-h-[768px] w-full max-w-[1344px] portrait:aspect-[7/4] portrait:h-auto portrait:max-h-full">
          <Stage
            manifest={manifest}
            state={state}
            interactionEnabled={!npc && !authoring}
            hintSignal={hintSignal}
            onAdvance={(next) => setState(next)}
            onNpcClick={setNpc}
            onFoggy={() => setFoggy(true)}
            onGesture={() => setGestured(true)}
          />
          {npc ? (
            <NpcCard npc={npc} mediaBase={manifest.meta.mediaBase} onClose={() => setNpc(null)} />
          ) : null}
          {foggy ? <FoggyToast onDismiss={() => setFoggy(false)} /> : null}
          {authoring && frame ? (
            <AddPathOverlay
              manifest={manifest}
              frame={frame}
              locationId={frame.location}
              locationName={location?.nameEn}
              onExit={() => setAuthoring(false)}
            />
          ) : null}
        </div>
      </div>
      <MenuFab
        manifest={manifest}
        state={state}
        authoring={authoring}
        onAddPath={() => {
          setNpc(null);
          setAuthoring(true);
        }}
        onExitAuthoring={() => setAuthoring(false)}
        onToggleMute={() => setState((s) => (s ? { ...s, muted: !s.muted } : s))}
        onHints={() => setHintSignal((n) => n + 1)}
        onJumpTo={(index) => setState((s) => (s ? jumpToTrailStep(manifest, s, index) : s))}
        onReset={() => {
          clearSave();
          setNpc(null);
          setState({ ...initialState(manifest), muted: state.muted });
        }}
      />
      {ambient ? <audio ref={audioRef} src={ambient} loop /> : null}
    </main>
  );
}
