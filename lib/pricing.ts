import { prisma } from "./db";

export const PLAN_PRICES = {
  monthly: { listed: 40, messagesPerMonth: 150 },
  lifetime: { listed: 250 },
} as const;

export type PlanKey = keyof typeof PLAN_PRICES;

export function applyDiscount(listed: number, percentOff?: number | null, amountOffCents?: number | null): number {
  if (percentOff) return Math.max(0, listed - (listed * percentOff) / 100);
  if (amountOffCents) return Math.max(0, listed - amountOffCents / 100);
  return listed;
}

// The general launch promo — active automatically (no code needed) while it's within
// its own startsAt/endsAt window and scoped to the given plan. A creator code, when
// present, takes priority over this (never both).
export async function getActiveLaunchDiscount(planKey: PlanKey) {
  const now = new Date();
  const codes = await prisma.discountCode.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } });
  for (const c of codes) {
    let keys: string[] = [];
    try {
      keys = JSON.parse(c.planKeys || "[]");
    } catch {}
    if (!keys.includes(planKey)) continue;
    if (c.startsAt && c.startsAt > now) continue;
    if (c.endsAt && c.endsAt < now) continue;
    return c;
  }
  return null;
}

export async function getCreatorPlanRule(code: string, planKey: PlanKey) {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  const creatorCode = await prisma.creatorCode.findUnique({
    where: { code: clean },
    include: { creator: { select: { id: true, username: true, displayName: true } }, planRules: true },
  });
  if (!creatorCode || !creatorCode.active) return null;
  const rule = creatorCode.planRules.find((r) => r.planKey === planKey && r.active);
  if (!rule) return null;
  return { creatorCode, rule };
}

// Resolves the single effective discount for a plan given an optional entered code.
// A creator code always wins over the general launch discount — never both.
export async function resolveEffectivePrice(planKey: PlanKey, code?: string | null) {
  const listed = PLAN_PRICES[planKey].listed;

  if (code && code.trim()) {
    const found = await getCreatorPlanRule(code, planKey);
    if (found) {
      const { creatorCode, rule } = found;
      const price = applyDiscount(listed, rule.discountType === "percent" ? rule.discountValue : null, rule.discountType === "flat" ? rule.discountValue * 100 : null);
      return {
        listed,
        price,
        source: "creator" as const,
        code: creatorCode.code,
        creatorCodeId: creatorCode.id,
        whopAffiliateCode: creatorCode.whopAffiliateCode,
        whopPromoCode: rule.whopPromoCode,
      };
    }
  }

  const launch = await getActiveLaunchDiscount(planKey);
  if (launch) {
    const price = applyDiscount(listed, launch.percentOff, launch.amountOffCents);
    return {
      listed,
      price,
      source: "launch" as const,
      code: launch.code,
      creatorCodeId: null,
      whopAffiliateCode: null,
      whopPromoCode: launch.code,
    };
  }

  return { listed, price: listed, source: "none" as const, code: null, creatorCodeId: null, whopAffiliateCode: null, whopPromoCode: null };
}
