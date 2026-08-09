import { ImageResponse } from "next/og";
import { AppIconElement } from "@/lib/appIconElement";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AppIconElement size={180} />, size);
}
