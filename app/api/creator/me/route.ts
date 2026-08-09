import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "creator" && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const creatorCode = await prisma.creatorCode.findUnique({
    where: { creatorUserId: user.id },
    include: { referrals: { include: { referredUser: { select: { displayName: true, createdAt: true, plan: true } } } } },
  });

  return NextResponse.json({ creatorCode });
}
