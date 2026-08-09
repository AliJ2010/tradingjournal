"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PRICING, OFFICIAL_DISCOUNT_CODE } from "@/lib/pricing";

type DiscountResult =
  | { valid: false }
  | { valid: true; type: "creator"; creatorUsername: string; monthlyPrice: number; lifetimePrice: number }
  | { valid: true; type: "generic"; percentOff?: number | null; amountOffCents?: number | null };

export default function PricingPage() {
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState<DiscountResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");

  async function applyCode() {
    if (!code.trim()) return;
    setChecking(true);
    setMessage("");
    try {
      const res = await fetch("/api/discount/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data: DiscountResult = await res.json();
      setDiscount(data);
      if (!data.valid) setMessage("That code isn't valid.");
      else if (data.type === "creator") setMessage(`Creator code applied — you're locked into this price forever, via @${data.creatorUsername}.`);
      else setMessage("Code applied.");
    } catch {
      setMessage("Couldn't check that code.");
    }
    setChecking(false);
  }

  const isCreator = discount?.valid && discount.type === "creator";
  const isGeneric = discount?.valid && discount.type === "generic";

  function applyGenericDiscount(listedPrice: number) {
    if (!discount?.valid || discount.type !== "generic") return listedPrice;
    if (discount.percentOff) return Math.max(0, listedPrice - (listedPrice * discount.percentOff) / 100);
    if (discount.amountOffCents) return Math.max(0, listedPrice - discount.amountOffCents / 100);
    return listedPrice;
  }

  const monthlyPrice = isCreator ? discount.monthlyPrice : isGeneric ? applyGenericDiscount(PRICING.monthly.listed) : PRICING.monthly.listed;
  const lifetimePrice = isCreator ? discount.lifetimePrice : isGeneric ? applyGenericDiscount(PRICING.lifetime.listed) : PRICING.lifetime.listed;
  const hasDiscount = isCreator || isGeneric;

  const priceNote = isCreator ? "Locked in forever" : isGeneric ? "First month only, then full price" : null;

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Pricing</h1>
      <p className="text-sm text-base-muted mb-8">Simple pricing, no surprises. Billing isn't live yet — this is a preview of what's coming.</p>

      <div className="flex gap-2 mb-1 max-w-sm">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Creator or discount code"
          className="flex-1 bg-base-panel2 border border-base-border rounded-lg px-4 py-2.5 text-sm focus:border-accent focus:shadow-glow outline-none transition-all"
        />
        <button
          onClick={applyCode}
          disabled={checking}
          className="bg-base-panel2 border border-base-border rounded-lg px-4 py-2.5 text-sm hover:bg-base-panel transition-colors disabled:opacity-50"
        >
          Apply
        </button>
      </div>
      <p className="text-xs text-base-muted mb-3">
        Have a code? Try <span className="text-accent">{OFFICIAL_DISCOUNT_CODE}</span> for 25% off your first month.
      </p>
      {message && <p className={`text-sm mb-6 ${discount?.valid ? "text-pill-green-bg" : "text-pill-red-bg"}`}>{message}</p>}
      {!message && <div className="mb-6" />}

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border border-base-border rounded-2xl p-6">
          <div className="text-sm text-base-muted mb-1">Monthly</div>
          <div className="flex items-baseline gap-2 mb-1">
            {hasDiscount && <span className="text-base-muted line-through text-lg">${PRICING.monthly.listed}</span>}
            <span className="text-4xl font-semibold">${monthlyPrice.toFixed(0)}</span>
            <span className="text-base-muted text-sm">/ month</span>
          </div>
          {priceNote && <p className="text-xs text-accent mb-4">{priceNote}</p>}
          {!priceNote && <div className="mb-4" />}
          <ul className="text-sm text-base-muted space-y-2 mb-6">
            <li>Journal, calendar, dashboard, Friends</li>
            <li>{PRICING.monthly.messagesPerMonth} AI Coach messages / month</li>
            <li>CSV + PDF export</li>
          </ul>
          <button disabled className="w-full bg-base-panel2 border border-base-border rounded-lg py-2.5 text-sm text-base-muted cursor-not-allowed">
            Coming soon
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
            {hasDiscount && <span className="text-base-muted line-through text-lg">${PRICING.lifetime.listed}</span>}
            <span className="text-4xl font-semibold">${lifetimePrice.toFixed(0)}</span>
            <span className="text-base-muted text-sm">one-time</span>
          </div>
          {hasDiscount ? (
            <p className="text-xs text-accent mb-4">25% off{isCreator ? " — locked in for you" : ""}</p>
          ) : (
            <div className="mb-4" />
          )}
          <ul className="text-sm text-base-muted space-y-2 mb-6">
            <li>Everything in Monthly, forever</li>
            <li>Unlimited AI Coach messages</li>
            <li>Pay once, never again</li>
          </ul>
          <button disabled className="w-full bg-brand-gradient/40 border border-accent/40 rounded-lg py-2.5 text-sm text-white/70 cursor-not-allowed">
            Coming soon
          </button>
        </motion.div>
      </div>
    </div>
  );
}
