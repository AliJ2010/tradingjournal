import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { resolveEffectivePrice, type PlanKey } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, planKey } = await req.json();
  const clean = (code || "").trim().toUpperCase();
  const plan: PlanKey = planKey === "lifetime" ? "lifetime" : "monthly";

  // Always resolve through the same fallback chain the checkout page uses (creator
  // code > automatic launch discount > listed price), so the response shape never
  // varies — a typed code that doesn't match a creator is treated the same as no
  // code at all for pricing purposes, just flagged invalid for messaging.
  const resolved = await resolveEffectivePrice(plan, clean || null);
  const valid = clean ? resolved.source === "creator" : true;

  return NextResponse.json({ valid, ...resolved });
}
