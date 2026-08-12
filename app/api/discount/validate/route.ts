import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { resolveEffectivePrice, PLAN_PRICES, type PlanKey } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, planKey } = await req.json();
  const clean = (code || "").trim().toUpperCase();
  const plan: PlanKey = planKey === "lifetime" ? "lifetime" : "monthly";

  if (!clean) {
    const fallback = await resolveEffectivePrice(plan, null);
    return NextResponse.json({ valid: false, ...fallback });
  }

  const resolved = await resolveEffectivePrice(plan, clean);
  if (resolved.source !== "creator") {
    return NextResponse.json({ valid: false, listed: PLAN_PRICES[plan].listed });
  }

  return NextResponse.json({ valid: true, ...resolved });
}
