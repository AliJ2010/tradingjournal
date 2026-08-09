export type PlanStatus = {
  plan: string;
  isTrialActive: boolean;
  isExpired: boolean;
  daysLeft: number | null;
};

export function getPlanStatus(user: { plan: string; trialEndsAt: Date | string | null }): PlanStatus {
  if (user.plan === "monthly" || user.plan === "lifetime") {
    return { plan: user.plan, isTrialActive: false, isExpired: false, daysLeft: null };
  }

  if (!user.trialEndsAt) {
    return { plan: "trial", isTrialActive: true, isExpired: false, daysLeft: null };
  }

  const msLeft = new Date(user.trialEndsAt).getTime() - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

  if (msLeft <= 0) {
    return { plan: "trial", isTrialActive: false, isExpired: true, daysLeft: 0 };
  }

  return { plan: "trial", isTrialActive: true, isExpired: false, daysLeft };
}

export const TRIAL_DAYS = 5;
