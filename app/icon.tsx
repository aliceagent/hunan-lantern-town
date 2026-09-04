import { ImageResponse } from "next/og";
import { LanternIcon } from "@/lib/lantern-icon";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<LanternIcon size={size.width} />, size);
}
