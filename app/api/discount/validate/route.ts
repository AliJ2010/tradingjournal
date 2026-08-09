import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();
  const clean = (code || "").trim().toUpperCase();
  if (!clean) return NextResponse.json({ valid: false });

  const discount = await prisma.discountCode.findUnique({ where: { code: clean } });
  if (!discount || !discount.active) return NextResponse.json({ valid: false });
  if (discount.maxRedemptions && discount.timesRedeemed >= discount.maxRedemptions) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({
    valid: true,
    percentOff: discount.percentOff,
    amountOffCents: discount.amountOffCents,
  });
}
