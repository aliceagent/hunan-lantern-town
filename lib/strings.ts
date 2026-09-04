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
  hud: {
    unknownLocation: "Somewhere in the mist",
    moves: (n: number) => `${n} ${n === 1 ? "step" : "steps"}`,
    mute: "Mute",
    unmute: "Unmute",
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
  hotspot: {
    npcHint: (nameEn: string) => nameEn,
  },
} as const;
