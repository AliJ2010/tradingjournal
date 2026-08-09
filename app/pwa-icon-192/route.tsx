import { ImageResponse } from "next/og";
import { AppIconElement } from "@/lib/appIconElement";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(<AppIconElement size={192} />, { width: 192, height: 192 });
}
