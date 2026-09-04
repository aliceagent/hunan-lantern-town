/**
 * The retry-once-then-foggy policy (§6 step 8, errata #4), factored out as
 * pure state so it is testable without a `<video>` element. `Stage` is the
 * only caller: a click moves to "loading", a failure either buys one retry
 * or ends the attempt as foggy, and `ended` returns to "still".
 */

export type PlaybackPhase = "still" | "loading" | "playing";

export interface PlaybackState {
  phase: PlaybackPhase;
  /** Whether this attempt has already used its one silent retry. */
  retried: boolean;
  /** Second failure in a row: show "The path is foggy…" (caller's job). */
  foggy: boolean;
}

export const idlePlayback: PlaybackState = { phase: "still", retried: false, foggy: false };

export function onClick(): PlaybackState {
  return { phase: "loading", retried: false, foggy: false };
}

export function onPlaying(state: PlaybackState): PlaybackState {
  return { ...state, phase: "playing" };
}

/**
 * A load or decode failure. First time: silently retry (same clip, caller
 * re-issues the request). Second time: give up, land back on the still, and
 * flag foggy for the toast.
 */
export function onFailure(state: PlaybackState): { state: PlaybackState; retry: boolean } {
  if (!state.retried) {
    return { state: { ...state, retried: true }, retry: true };
  }
  return { state: { phase: "still", retried: false, foggy: true }, retry: false };
}

export function onEnded(): PlaybackState {
  return { phase: "still", retried: false, foggy: false };
}

export function dismissFoggy(state: PlaybackState): PlaybackState {
  return { ...state, foggy: false };
}

/** Schedules the foggy toast's auto-dismiss; returns a cancel function. */
export function scheduleAutoDismiss(callback: () => void, ms = 3000): () => void {
  const id = setTimeout(callback, ms);
  return () => clearTimeout(id);
}
