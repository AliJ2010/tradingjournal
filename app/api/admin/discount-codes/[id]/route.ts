import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getWhopClient, whopPlanId, type PlanKey } from "@/lib/whop";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (typeof body.active === "boolean") data.active = body.active;

  if (body.createWhopPromoCode) {
    const code = await prisma.discountCode.findUnique({ where: { id: params.id } });
    if (!code) return NextResponse.json({ error: "Discount code not found." }, { status: 404 });
    if (code.whopPromoCodeId) return NextResponse.json({ error: "Already has a Whop promo code." }, { status: 409 });

    let planKeys: string[] = [];
    try {
      planKeys = JSON.parse(code.planKeys || "[]");
    } catch {}
    const planIds = planKeys.map((k) => whopPlanId(k as PlanKey)).filter((id): id is string => Boolean(id));
    if (!planIds.length || !process.env.WHOP_COMPANY_ID) {
      return NextResponse.json({ error: "This code has no valid plans to scope the promo to, or Whop isn't configured yet." }, { status: 503 });
    }

    try {
      const client = getWhopClient();
      const promo = await client.promoCodes.create({
        code: code.code,
        amount_off: code.percentOff ?? (code.amountOffCents ? code.amountOffCents / 100 : 0),
        promo_type: code.percentOff ? "percentage" : "flat_amount",
        base_currency: "usd",
        company_id: process.env.WHOP_COMPANY_ID,
        new_users_only: false,
        promo_duration_months: 999,
        plan_ids: planIds,
      });
      data.whopPromoCodeId = promo.id;
    } catch (err) {
      console.error("Failed to create Whop promo code", err);
      return NextResponse.json({ error: "Couldn't create the Whop promo code — check it doesn't already exist in Whop." }, { status: 502 });
    }
  }

  const updated = await prisma.discountCode.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.discountCode.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
