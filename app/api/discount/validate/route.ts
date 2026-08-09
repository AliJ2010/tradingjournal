import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PRICING } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();
  const clean = (code || "").trim().toUpperCase();
  if (!clean) return NextResponse.json({ valid: false });

  const creatorCode = await prisma.creatorCode.findUnique({
    where: { code: clean },
    include: { creator: { select: { username: true, displayName: true } } },
  });
  if (creatorCode) {
    return NextResponse.json({
      valid: true,
      type: "creator",
      creatorUsername: creatorCode.creator.username,
      monthlyPrice: PRICING.monthly.discounted,
      lifetimePrice: PRICING.lifetime.discounted,
    });
  }

  const discount = await prisma.discountCode.findUnique({ where: { code: clean } });
  if (!discount || !discount.active) return NextResponse.json({ valid: false });
  if (discount.maxRedemptions && discount.timesRedeemed >= discount.maxRedemptions) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({
    valid: true,
    type: "generic",
    percentOff: discount.percentOff,
    amountOffCents: discount.amountOffCents,
  });
}
