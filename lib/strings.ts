/**
 * All player-facing UI copy in one place (§4.2: "English UI (locked). All
 * strings in one `web/lib/strings.ts` so v2+ can localize without a hunt.").
 */
export const STRINGS = {
  title: {
    en: "Lantern River Town",
    zh: "河灯小镇",
    begin: "Begin",
  },
  menu: {
    open: "Menu",
    close: "Close menu",
    unknownLocation: "Somewhere in the mist",
    moves: (n: number) => `${n} ${n === 1 ? "step" : "steps"}`,
    hints: "Hints",
    mute: "Mute",
    unmute: "Unmute",
    fullscreen: "Full screen",
    exitFullscreen: "Exit full screen",
    // One short footnote line — the menu must fit landscape dvh with no scroll.
    fullscreenUnavailable: "Add to Home Screen to play full screen.",
    path: "Path",
    addPath: "Add path",
    pathBack: "Back",
    pathStart: "The beginning",
    pathHere: "here",
    pathJumpTo: (name: string) => `Go back to ${name}`,
    reset: "Reset",
    resetConfirm: "Forget your progress?",
    resetConfirmYes: "Yes, reset",
    resetConfirmNo: "Cancel",
  },
  npcCard: {
    close: "Close",
  },
  /** The "Add path" draw mode — an authoring utility, not player UI. */
  authoring: {
    hint: "Drag a box over the painting",
    done: "Done",
    copied: "Copied",
    copiedCold: "Copied — no video on this tap yet.",
    overlap: "Overlaps an existing tap — pick empty space.",
    copyFallback: "Clipboard blocked — copy this by hand:",
    close: "Close",
    exit: "Exit draw mode",
  },
  foggyToast: {
    message: "The path is foggy…",
  },
  worldEdge: {
    title: "This is as far as the town goes, for now",
    body: "Beyond here is still being painted. Open the menu and follow your Path back the way you came.",
  },
  hotspot: {
    npcHint: (nameEn: string) => nameEn,
  },
} as const;
