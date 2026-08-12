import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getWhopClient, whopPlanId, type PlanKey } from "@/lib/whop";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(codes);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const code = (body.code || "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Code is required." }, { status: 400 });

  const existing = await prisma.discountCode.findUnique({ where: { code } });
  if (existing) return NextResponse.json({ error: "That code already exists." }, { status: 409 });

  const planKeys: string[] = Array.isArray(body.planKeys) && body.planKeys.length > 0 ? body.planKeys : ["monthly", "lifetime"];
  const percentOff = body.percentOff ? Number(body.percentOff) : null;
  const amountOffCents = body.amountOffCents ? Number(body.amountOffCents) : null;

  // Without a real Whop promo code behind it, this discount would only ever show
  // in our own UI — Whop's actual checkout charge would stay full price. Create one
  // by default unless the caller explicitly opts out (e.g. a display-only code).
  let whopPromoCodeId: string | null = null;
  if (body.createWhopPromoCode !== false && (percentOff || amountOffCents)) {
    const planIds = planKeys.map((k) => whopPlanId(k as PlanKey)).filter((id): id is string => Boolean(id));
    if (!planIds.length || !process.env.WHOP_COMPANY_ID) {
      return NextResponse.json({ error: "Whop isn't configured yet — set WHOP_COMPANY_ID and the plan ID env vars first." }, { status: 503 });
    }
    try {
      const client = getWhopClient();
      const promo = await client.promoCodes.create({
        code,
        amount_off: percentOff ?? amountOffCents! / 100,
        promo_type: percentOff ? "percentage" : "flat_amount",
        base_currency: "usd",
        company_id: process.env.WHOP_COMPANY_ID,
        new_users_only: false,
        unlimited_stock: true,
        promo_duration_months: 999,
        plan_ids: planIds,
      });
      whopPromoCodeId = promo.id;
    } catch (err: any) {
      console.error("Failed to create Whop promo code", err);
      return NextResponse.json({ error: `Couldn't create the Whop promo code: ${err?.message || "unknown error"}` }, { status: 502 });
    }
  }

  const created = await prisma.discountCode.create({
    data: {
      code,
      percentOff,
      amountOffCents,
      maxRedemptions: body.maxRedemptions ? Number(body.maxRedemptions) : null,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      planKeys: JSON.stringify(planKeys),
      whopPromoCodeId,
    },
  });

  return NextResponse.json(created);
}
