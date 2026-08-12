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

// General discount codes (e.g. the launch promo) — like creator codes, these only
// apply when the customer actually enters the matching code. Nothing auto-applies
// without one; the pricing/checkout pages advertise that a code exists, they don't
// pre-fill it.
export async function getGeneralDiscountByCode(code: string, planKey: PlanKey) {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  const now = new Date();
  const discountCode = await prisma.discountCode.findUnique({ where: { code: clean } });
  if (!discountCode || !discountCode.active) return null;
  let keys: string[] = [];
  try {
    keys = JSON.parse(discountCode.planKeys || "[]");
  } catch {}
  if (!keys.includes(planKey)) return null;
  if (discountCode.startsAt && discountCode.startsAt > now) return null;
  if (discountCode.endsAt && discountCode.endsAt < now) return null;
  return discountCode;
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
// Nothing applies without a code that actually matches — a creator code wins over a
// general code if somehow both match the same string (never both at once).
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

    const general = await getGeneralDiscountByCode(code, planKey);
    if (general) {
      const price = applyDiscount(listed, general.percentOff, general.amountOffCents);
      return {
        listed,
        price,
        source: "launch" as const,
        code: general.code,
        creatorCodeId: null,
        whopAffiliateCode: null,
        whopPromoCode: general.code,
      };
    }
  }

  return { listed, price: listed, source: "none" as const, code: null, creatorCodeId: null, whopAffiliateCode: null, whopPromoCode: null };
}
