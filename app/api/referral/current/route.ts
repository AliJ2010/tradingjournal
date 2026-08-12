import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const code = cookies().get("referral_code")?.value || null;
  return NextResponse.json({ code });
}
