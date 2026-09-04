import { ImageResponse } from "next/og";
import { LanternIcon } from "@/lib/lantern-icon";

/* iOS composites its own rounded mask over an opaque square; without this
   file an Add to Home Screen install gets a page screenshot as its icon. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<LanternIcon size={size.width} />, size);
}
