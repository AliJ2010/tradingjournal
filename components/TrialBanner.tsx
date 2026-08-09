import Link from "next/link";
import { getPlanStatus } from "@/lib/plan";

export default function TrialBanner({ user }: { user: { plan: string; trialEndsAt: Date | null } }) {
  const status = getPlanStatus(user);

  if (status.plan === "monthly" || status.plan === "lifetime") return null;

  if (status.isExpired) {
    return (
      <div className="bg-pill-orange-bg/15 border-b border-pill-orange-bg/40 px-6 py-2 text-sm flex items-center gap-2">
        <span>🟠</span>
        <span>Your free trial has ended. Billing isn't live yet, so you still have full access for now.</span>
        <Link href="/pricing" className="text-accent hover:underline ml-auto">
          See pricing
        </Link>
      </div>
    );
  }

  if (status.daysLeft !== null && status.daysLeft <= 5) {
    return (
      <div className="bg-brand-gradient-soft border-b border-accent/30 px-6 py-2 text-sm flex items-center gap-2">
        <span>✨</span>
        <span>
          {status.daysLeft} day{status.daysLeft === 1 ? "" : "s"} left in your free trial.
        </span>
        <Link href="/pricing" className="text-accent hover:underline ml-auto">
          See pricing
        </Link>
      </div>
    );
  }

  return null;
}
