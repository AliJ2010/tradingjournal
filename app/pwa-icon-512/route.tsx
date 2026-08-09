import { ImageResponse } from "next/og";
import { AppIconElement } from "@/lib/appIconElement";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(<AppIconElement size={512} />, { width: 512, height: 512 });
}
