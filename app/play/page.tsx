"use client";

import { useEffect, useRef, useState } from "react";
import FoggyToast from "@/components/FoggyToast";
import Hud from "@/components/Hud";
import NpcCard from "@/components/NpcCard";
import Stage from "@/components/Stage";
import { initialState, type PlayerState } from "@/lib/engine";
import type { Manifest, Npc } from "@/lib/manifest";
import { audioUrl, prefetchFrame } from "@/lib/media";
import { clearSave, loadSave, saveState } from "@/lib/save";

export default function PlayPage() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [state, setState] = useState<PlayerState | null>(null);
  const [npc, setNpc] = useState<Npc | null>(null);
  const [foggy, setFoggy] = useState(false);
  const [gestured, setGestured] = useState(false);
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
      <main className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        Loading…
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-black p-2 sm:p-4">
      <Hud
        manifest={manifest}
        state={state}
        onToggleMute={() => setState((s) => (s ? { ...s, muted: !s.muted } : s))}
        onReset={() => {
          clearSave();
          setNpc(null);
          setState({ ...initialState(manifest), muted: state.muted });
        }}
      />
      <div className="relative w-full max-w-[1344px]">
        <Stage
          manifest={manifest}
          state={state}
          interactionEnabled={!npc}
          onAdvance={(next) => setState(next)}
          onNpcClick={setNpc}
          onFoggy={() => setFoggy(true)}
          onGesture={() => setGestured(true)}
        />
        {npc ? (
          <NpcCard npc={npc} mediaBase={manifest.meta.mediaBase} onClose={() => setNpc(null)} />
        ) : null}
        {foggy ? <FoggyToast onDismiss={() => setFoggy(false)} /> : null}
      </div>
      {ambient ? <audio ref={audioRef} src={ambient} loop /> : null}
    </main>
  );
}
