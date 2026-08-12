import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPlanStatus } from "@/lib/plan";
import { getWhopClient, isWhopConfigured } from "@/lib/whop";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.plan === "monthly" && isWhopConfigured() && user.whopMembershipId) {
    // Schedules cancellation at period end. Whop has no webhook for this specific
    // change (only membership.activated/deactivated), so we optimistically flag it
    // locally — membership.deactivated is still what actually revokes access once
    // the current paid period truly ends.
    try {
      await getWhopClient().memberships.cancel(user.whopMembershipId);
    } catch (err) {
      console.error("Failed to cancel Whop membership", err);
      return NextResponse.json({ error: "Couldn't cancel your subscription — try again or contact support." }, { status: 502 });
    }
    await prisma.subscription
      .update({ where: { whopMembershipId: user.whopMembershipId }, data: { cancelAtPeriodEnd: true } })
      .catch(() => {});
    return NextResponse.json({ billing: getPlanStatus(user), cancelAtPeriodEnd: true });
  }

  // No real Whop membership on file (e.g. a manually-set plan) — fall back to the
  // direct downgrade so the account isn't stuck.
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { plan: "expired", trialEndsAt: new Date() },
  });

  return NextResponse.json({ billing: getPlanStatus(updated) });
}
