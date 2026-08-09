import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPlanStatus } from "@/lib/plan";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { plan: "expired", trialEndsAt: new Date() },
  });

  return NextResponse.json({ billing: getPlanStatus(updated) });
}
