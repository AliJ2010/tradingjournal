import Whop from "@whop/sdk";

let client: Whop | null = null;

// Reads WHOP_API_KEY / WHOP_WEBHOOK_SECRET from process.env automatically.
export function getWhopClient(): Whop {
  if (!client) client = new Whop();
  return client;
}

export function isWhopConfigured(): boolean {
  return Boolean(process.env.WHOP_API_KEY && process.env.WHOP_MONTHLY_PLAN_ID && process.env.WHOP_LIFETIME_PLAN_ID);
}

export type PlanKey = "monthly" | "lifetime";

export function whopPlanId(planKey: PlanKey): string | undefined {
  return planKey === "monthly" ? process.env.WHOP_MONTHLY_PLAN_ID : process.env.WHOP_LIFETIME_PLAN_ID;
}

export function planKeyForWhopPlanId(planId: string | null | undefined): PlanKey | null {
  if (!planId) return null;
  if (planId === process.env.WHOP_MONTHLY_PLAN_ID) return "monthly";
  if (planId === process.env.WHOP_LIFETIME_PLAN_ID) return "lifetime";
  return null;
}
