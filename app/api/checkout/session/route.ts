import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getWhopClient, isWhopConfigured, whopPlanId, type PlanKey } from "@/lib/whop";
import { resolveEffectivePrice, PLAN_PRICES } from "@/lib/pricing";
import { rateLimit } from "@/lib/rateLimit";
import { getBaseUrl } from "@/lib/email";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!rateLimit(`checkout:${user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many checkout attempts — try again in a minute." }, { status: 429 });
  }

  if (!isWhopConfigured()) {
    return NextResponse.json({ error: "Billing isn't configured yet." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const planKey = body.planKey as PlanKey;
  const code = typeof body.code === "string" ? body.code : undefined;

  if (planKey !== "monthly" && planKey !== "lifetime") {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  if (user.plan === "lifetime") {
    return NextResponse.json({ error: "You already have lifetime access." }, { status: 400 });
  }
  if (user.plan === "monthly" && planKey === "monthly") {
    return NextResponse.json({ error: "You already have an active monthly subscription." }, { status: 400 });
  }

  const planId = whopPlanId(planKey);
  if (!planId) return NextResponse.json({ error: "Billing isn't configured yet." }, { status: 503 });

  const resolved = await resolveEffectivePrice(planKey, code);

  try {
    const client = getWhopClient();
    const config = await client.checkoutConfigurations.create({
      plan_id: planId,
      redirect_url: `${getBaseUrl()}/checkout/success?plan=${planKey}`,
      affiliate_code: resolved.source === "creator" ? resolved.whopAffiliateCode || undefined : undefined,
      metadata: {
        optictrader_user_id: user.id,
        email: user.email,
        plan_key: planKey,
        creator_code: resolved.source === "creator" ? resolved.code : null,
      },
    });

    return NextResponse.json({
      sessionId: config.id,
      planId,
      promoCode: resolved.whopPromoCode,
      pricePreview: {
        listed: resolved.listed,
        price: resolved.price,
        source: resolved.source,
        code: resolved.code,
      },
    });
  } catch (err: any) {
    console.error("Whop checkout configuration failed", err);
    return NextResponse.json({ error: "Couldn't start checkout — try again." }, { status: 502 });
  }
}

export async function GET() {
  return NextResponse.json({ plans: PLAN_PRICES });
}
