export const PRICING = {
  monthly: {
    listed: 40,
    discounted: 30, // 25% off — via the OPTIC code (first month only) or a creator code (forever)
    messagesPerMonth: 150,
  },
  lifetime: {
    listed: 250,
    discounted: 187.5, // 25% off — via the OPTIC code or a creator code (both one-time, so same price)
  },
};

export const OFFICIAL_DISCOUNT_CODE = "OPTIC";
export const DISCOUNT_PERCENT = 25;

export const CREATOR_COMMISSION_PERCENT = 20; // of the $30 discounted monthly price -> $6/mo
export const CREATOR_MONTHLY_COMMISSION = (PRICING.monthly.discounted * CREATOR_COMMISSION_PERCENT) / 100;
