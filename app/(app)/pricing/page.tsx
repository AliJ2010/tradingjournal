"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { PLAN_PRICES } from "@/lib/pricing";

type PriceResult = { listed: number; price: number; source: "creator" | "launch" | "none"; code: string | null };

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [referralCode, setReferralCode] = useState("");
  const [showCodeBanner, setShowCodeBanner] = useState(true);
  const [monthly, setMonthly] = useState<PriceResult>({ listed: PLAN_PRICES.monthly.listed, price: PLAN_PRICES.monthly.listed, source: "none", code: null });
  const [lifetime, setLifetime] = useState<PriceResult>({ listed: PLAN_PRICES.lifetime.listed, price: PLAN_PRICES.lifetime.listed, source: "none", code: null });

  async function fetchPrices(c: string) {
    const [m, l] = await Promise.all([
      fetch("/api/discount/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: c, planKey: "monthly" }) }).then((r) => r.json()),
      fetch("/api/discount/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: c, planKey: "lifetime" }) }).then((r) => r.json()),
    ]);
    setMonthly(m);
    setLifetime(l);
  }

  // The discount/referral code field lives on the checkout page only — here we just
  // silently carry forward a referral link (?ref=) or previously-stored referral
  // cookie so it's already applied by the time the customer reaches checkout, and
  // reflect it in the displayed price if it's a real creator code.
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref);
      fetchPrices(ref);
      return;
    }
    fetch("/api/referral/current")
      .then((r) => r.json())
      .then((data) => {
        if (data.code) {
          setReferralCode(data.code);
          fetchPrices(data.code);
        } else {
          fetchPrices("");
        }
      })
      .catch(() => fetchPrices(""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectPlan(planKey: "monthly" | "lifetime") {
    const params = new URLSearchParams();
    if (referralCode) params.set("code", referralCode);
    router.push(`/checkout/${planKey}${params.toString() ? `?${params.toString()}` : ""}`);
  }

  const hasMonthlyDiscount = monthly.source !== "none";
  const hasLifetimeDiscount = lifetime.source !== "none";

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Pricing</h1>
      <p className="text-sm text-base-muted mb-6">Simple pricing, no surprises.</p>

      {showCodeBanner && !hasMonthlyDiscount && !hasLifetimeDiscount && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3 bg-accent/10 border border-accent/30 rounded-xl px-4 py-2.5 mb-6 text-sm"
        >
          <span>
            💡 Have a discount code? Try <span className="font-mono font-medium">OPTIC</span>, or use a creator's referral code — enter it at checkout.
          </span>
          <button onClick={() => setShowCodeBanner(false)} className="text-base-muted hover:text-base-text shrink-0">
            ✕
          </button>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border border-base-border rounded-2xl p-6">
          <div className="text-sm text-base-muted mb-1">Monthly</div>
          <div className="flex items-baseline gap-2 mb-1">
            {hasMonthlyDiscount && <span className="text-base-muted line-through text-lg">${monthly.listed}</span>}
            <span className="text-4xl font-semibold">${monthly.price.toFixed(0)}</span>
            <span className="text-base-muted text-sm">/ month</span>
          </div>
          {hasMonthlyDiscount ? (
            <p className="text-xs text-accent mb-4">{monthly.source === "creator" ? `Code ${monthly.code} applied` : "Launch price — limited time"}</p>
          ) : (
            <div className="mb-4" />
          )}
          <ul className="text-sm text-base-muted space-y-2 mb-6">
            <li>OpticTrader premium access</li>
            <li>{PLAN_PRICES.monthly.messagesPerMonth} AI Coach messages / month</li>
            <li>CSV + PDF export</li>
          </ul>
          <button
            onClick={() => selectPlan("monthly")}
            className="w-full bg-brand-gradient text-white font-semibold rounded-lg py-2.5 text-sm shadow-glow hover:brightness-110 transition-all"
          >
            Choose Monthly
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel border border-accent/40 rounded-2xl p-6 shadow-glow relative"
        >
          <div className="absolute -top-3 right-6 bg-brand-gradient text-white text-xs font-medium px-2.5 py-1 rounded-full">Best value</div>
          <div className="text-sm text-base-muted mb-1">Lifetime</div>
          <div className="flex items-baseline gap-2 mb-1">
            {hasLifetimeDiscount && <span className="text-base-muted line-through text-lg">${lifetime.listed}</span>}
            <span className="text-4xl font-semibold">${lifetime.price.toFixed(0)}</span>
            <span className="text-base-muted text-sm">one-time</span>
          </div>
          {hasLifetimeDiscount ? (
            <p className="text-xs text-accent mb-4">{lifetime.source === "creator" ? `Code ${lifetime.code} applied` : "Launch price — limited time"}</p>
          ) : (
            <div className="mb-4" />
          )}
          <ul className="text-sm text-base-muted space-y-2 mb-6">
            <li>Everything in Monthly, forever</li>
            <li>Unlimited AI Coach messages</li>
            <li>Pay once, never again</li>
          </ul>
          <button
            onClick={() => selectPlan("lifetime")}
            className="w-full bg-brand-gradient text-white font-semibold rounded-lg py-2.5 text-sm shadow-glow hover:brightness-110 transition-all"
          >
            Choose Lifetime
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}
