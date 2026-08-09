import { prisma } from "./db";
import { sendTrialEndingEmail } from "./email";

export type PlanStatus = {
  plan: string;
  isTrialActive: boolean;
  isExpired: boolean;
  daysLeft: number | null;
};

export function getPlanStatus(user: { plan: string; trialEndsAt: Date | string | null }): PlanStatus {
  if (user.plan === "basic" || user.plan === "monthly" || user.plan === "lifetime") {
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

const COACH_MESSAGE_LIMITS: Record<string, number> = {
  trial: 50,
  basic: 50,
  monthly: 200,
  lifetime: Infinity,
  expired: 10,
};

export function getCoachMessageLimit(plan: string): number {
  return COACH_MESSAGE_LIMITS[plan] ?? 50;
}

export async function maybeSendTrialReminder(user: {
  id: string;
  email: string;
  displayName: string;
  plan: string;
  trialEndsAt: Date | null;
  trialReminderSentAt: Date | null;
}) {
  if (user.plan !== "trial" || user.trialReminderSentAt) return;

  const status = getPlanStatus(user);
  if (!status.isTrialActive || status.daysLeft === null || status.daysLeft > 1) return;

  await prisma.user.update({ where: { id: user.id }, data: { trialReminderSentAt: new Date() } });
  await sendTrialEndingEmail(user.email, user.displayName, status.daysLeft).catch(() => {});
}
