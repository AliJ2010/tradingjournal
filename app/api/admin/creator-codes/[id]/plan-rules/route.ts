import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getWhopClient, whopPlanId, type PlanKey } from "@/lib/whop";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const creatorCode = await prisma.creatorCode.findUnique({ where: { id: params.id } });
  if (!creatorCode) return NextResponse.json({ error: "Creator not found." }, { status: 404 });

  const body = await req.json();
  const planKey = body.planKey as PlanKey;
  if (planKey !== "monthly" && planKey !== "lifetime") {
    return NextResponse.json({ error: "planKey must be 'monthly' or 'lifetime'." }, { status: 400 });
  }

  const discountType = body.discountType === "flat" ? "flat" : "percent";
  const discountValue = Number(body.discountValue);
  const commissionType = body.commissionType === "flat" ? "flat" : "percent";
  const commissionValue = Number(body.commissionValue);
  const commissionDuration = body.commissionDuration === "all_payments" ? "all_payments" : "first_payment";
  const createWhopPromoCode = Boolean(body.createWhopPromoCode);

  if (!Number.isFinite(discountValue) || !Number.isFinite(commissionValue)) {
    return NextResponse.json({ error: "discountValue and commissionValue must be numbers." }, { status: 400 });
  }

  // Commission fields are purely informational on our side (the real payout is
  // controlled by a separate Whop Affiliate Override) — always editable. The
  // discount amount maps to a real Whop promo code once created, and Whop doesn't
  // support changing a promo's amount_off after the fact, so editing it here would
  // silently desync what we display from what Whop actually charges.
  const existingRule = await prisma.creatorPlanRule.findUnique({
    where: { creatorCodeId_planKey: { creatorCodeId: creatorCode.id, planKey } },
  });
  if (existingRule?.whopPromoCodeId && !createWhopPromoCode && (existingRule.discountType !== discountType || existingRule.discountValue !== discountValue)) {
    return NextResponse.json(
      { error: "Can't change the discount amount once it's linked to a real Whop promo code — delete and recreate this creator code instead." },
      { status: 409 }
    );
  }

  let whopPromoCodeId: string | null = null;
  if (createWhopPromoCode) {
    const planId = whopPlanId(planKey);
    if (!planId || !process.env.WHOP_COMPANY_ID) {
      return NextResponse.json({ error: "Whop isn't configured yet — set WHOP_COMPANY_ID and the plan ID env vars first." }, { status: 503 });
    }
    try {
      const client = getWhopClient();
      const promo = await client.promoCodes.create({
        code: creatorCode.code,
        amount_off: discountValue,
        promo_type: discountType === "percent" ? "percentage" : "flat_amount",
        base_currency: "usd",
        company_id: process.env.WHOP_COMPANY_ID,
        new_users_only: false,
        unlimited_stock: true,
        // The customer's discounted price is meant to persist for the life of their
        // subscription (their "locked-in" rate) — independent of commissionDuration,
        // which only controls how long the *creator* keeps earning on it.
        promo_duration_months: 999,
        plan_ids: [planId],
      });
      whopPromoCodeId = promo.id;
    } catch (err: any) {
      console.error("Failed to create Whop promo code", err);
      return NextResponse.json({ error: `Couldn't create the Whop promo code: ${err?.message || "unknown error"}` }, { status: 502 });
    }
  }

  const rule = await prisma.creatorPlanRule.upsert({
    where: { creatorCodeId_planKey: { creatorCodeId: creatorCode.id, planKey } },
    create: {
      creatorCodeId: creatorCode.id,
      planKey,
      whopPromoCode: creatorCode.code,
      whopPromoCodeId,
      discountType,
      discountValue,
      commissionType,
      commissionValue,
      commissionDuration,
    },
    update: {
      discountType,
      discountValue,
      commissionType,
      commissionValue,
      commissionDuration,
      ...(whopPromoCodeId ? { whopPromoCodeId } : {}),
    },
  });

  return NextResponse.json(rule);
}
