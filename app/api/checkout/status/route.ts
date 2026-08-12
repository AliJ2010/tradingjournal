import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPremiumAccess } from "@/lib/entitlements";

// Polled by the checkout success page — entitlement only ever flips server-side
// via the Whop webhook, never from a frontend redirect alone.
export async function GET() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { plan: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ plan: user.plan, ready: hasPremiumAccess(user) });
}
