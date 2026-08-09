export const PRICING = {
  monthly: {
    listed: 40,
    discounted: 30, // launch price (temporary) and creator-code price (forever)
    messagesPerMonth: 150,
  },
  lifetime: {
    listed: 250,
    discounted: 200, // launch price (temporary) and creator-code price (forever)
  },
};

export const LAUNCH_DISCOUNT_MONTHS = 2;
export const CREATOR_COMMISSION_PERCENT = 20; // of the $30 discounted monthly price -> $6/mo
export const CREATOR_MONTHLY_COMMISSION = (PRICING.monthly.discounted * CREATOR_COMMISSION_PERCENT) / 100;
