"use client";

import { useEffect } from "react";
import { deriveMode, keyToAction, type KeyAction, type KeyboardMode } from "@/lib/keyboard";
import type { PlaybackPhase } from "@/lib/playback";

function targetIsEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

export default function useKeyboardControls({
  authoring,
  npcOpen,
  menuOpen,
  phase,
  onAction,
}: {
  authoring: boolean;
  npcOpen: boolean;
  menuOpen: boolean;
  phase: PlaybackPhase;
  onAction: (action: KeyAction, mode: KeyboardMode) => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const mode = deriveMode({ authoring, npcOpen, menuOpen, phase });
      const action = keyToAction(
        {
          key: event.key,
          metaKey: event.metaKey,
          ctrlKey: event.ctrlKey,
          altKey: event.altKey,
          repeat: event.repeat,
          targetIsEditable: targetIsEditable(event.target),
        },
        mode,
      );
      if (!action) return;
      event.preventDefault();
      onAction(action, mode);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [authoring, npcOpen, menuOpen, phase, onAction]);
}
