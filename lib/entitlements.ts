import { isWhopConfigured } from "./whop";

export function hasPremiumAccess(user: { plan: string }): boolean {
  return user.plan === "monthly" || user.plan === "lifetime";
}

// The hard paywall only activates once Whop is actually configured — otherwise
// expired-trial users would hit a paywall with no working checkout behind it.
export function shouldEnforcePaywall(): boolean {
  return isWhopConfigured();
}
