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
    include: {
      referrals: { include: { referredUser: { select: { displayName: true, createdAt: true, plan: true } } } },
      planRules: true,
    },
  });

  if (!creatorCode) return NextResponse.json({ creatorCode: null });

  const payments = await prisma.payment.findMany({
    where: { creatorCodeId: creatorCode.id, status: "succeeded" },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { displayName: true, username: true } } },
  });

  const rulesByPlan = new Map(creatorCode.planRules.map((r) => [r.planKey, r]));
  let totalRevenueReferred = 0;
  let totalCommission = 0;
  const sales = payments.map((p) => {
    totalRevenueReferred += p.amount;
    const rule = rulesByPlan.get(p.planKey);
    const commission = rule
      ? rule.commissionType === "percent"
        ? (p.amount * rule.commissionValue) / 100
        : rule.commissionValue
      : 0;
    totalCommission += commission;
    return {
      customer: p.user.displayName,
      plan: p.planKey,
      purchaseDate: p.createdAt,
      amountPaid: p.amount,
      commission,
      status: p.status,
    };
  });

  const paidCustomers = new Set(payments.map((p) => p.userId)).size;
  const conversionRate = creatorCode.referrals.length > 0 ? (paidCustomers / creatorCode.referrals.length) * 100 : 0;

  return NextResponse.json({
    creatorCode,
    stats: {
      signups: creatorCode.referrals.length,
      paidCustomers,
      conversionRate,
      totalRevenueReferred,
      totalCommission,
    },
    sales,
  });
}
