import type { MetadataRoute } from "next";

/**
 * Add to Home Screen is the only honest fullscreen on iPhone (see
 * docs/phone-ux-review.md, Round 4): Safari never got the element Fullscreen
 * API there, so a chrome-less launch has to come from an installed web app.
 * `display: fullscreen` is real on Android; iOS falls back to standalone,
 * which with the existing black-translucent status bar is exactly what we
 * want. Icons come from the generated app/icon.tsx and app/apple-icon.tsx.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lantern River Town — 河灯小镇",
    short_name: "河灯小镇",
    description: "A misty riverside town in western Hunan, told one clip at a time.",
    start_url: "/play",
    display: "fullscreen",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
