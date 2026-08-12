import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendMonthlyWelcomeEmail, sendLifetimeWelcomeEmail, sendChurnEmail } from "@/lib/email";

const VALID_ROLES = ["user", "admin", "creator"];
const VALID_PLANS = ["trial", "monthly", "lifetime", "expired"];
const PAID_PLANS = ["monthly", "lifetime"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, any> = {};
  if (VALID_ROLES.includes(body.role)) data.role = body.role;
  if (VALID_PLANS.includes(body.plan)) data.plan = body.plan;

  // An admin can't demote themselves — role is a single-select, so this would
  // otherwise silently lock them out of /admin with no one else able to undo it.
  if (params.id === user.id && data.role && data.role !== "admin") {
    return NextResponse.json({ error: "You can't remove your own admin access — have another admin do it." }, { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id: params.id }, data });

  const oldPlan = existing.plan;
  const newPlan = updated.plan;
  if (oldPlan !== newPlan) {
    if (newPlan === "monthly") sendMonthlyWelcomeEmail(updated.email, updated.displayName).catch(() => {});
    else if (newPlan === "lifetime") sendLifetimeWelcomeEmail(updated.email, updated.displayName).catch(() => {});
    else if (PAID_PLANS.includes(oldPlan) && !PAID_PLANS.includes(newPlan)) {
      sendChurnEmail(updated.email, updated.displayName).catch(() => {});
    }
  }

  return NextResponse.json({ id: updated.id, role: updated.role, plan: updated.plan });
}
