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
    fullscreenUnavailable:
      "Safari can't hide the address bar. Add to Home Screen (Share menu) to play full screen.",
    path: "Path",
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
