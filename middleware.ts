import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "referral_code";
const ATTRIBUTION_WINDOW_DAYS = 30;

// Captures ?ref=CODE into an httpOnly cookie so attribution survives signup/login
// without relying on localStorage. Never overwrites an existing cookie — first
// touch wins, matching "don't clobber a legitimate existing referral."
export function middleware(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");
  if (!ref) return NextResponse.next();

  const existing = req.cookies.get(COOKIE_NAME);
  if (existing) return NextResponse.next();

  const res = NextResponse.next();
  res.cookies.set(COOKIE_NAME, ref.trim().toUpperCase(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * ATTRIBUTION_WINDOW_DAYS,
  });
  return res;
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};
