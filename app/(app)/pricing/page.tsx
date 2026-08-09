"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type Discount = { valid: boolean; percentOff?: number | null; amountOffCents?: number | null };

function applyDiscount(price: number, discount: Discount | null) {
  if (!discount?.valid) return price;
  if (discount.percentOff) return Math.max(0, price - (price * discount.percentOff) / 100);
  if (discount.amountOffCents) return Math.max(0, price - discount.amountOffCents / 100);
  return price;
}

export default function PricingPage() {
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState<Discount | null>(null);
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
      const data = await res.json();
      setDiscount(data);
      setMessage(data.valid ? "Code applied." : "That code isn't valid.");
    } catch {
      setMessage("Couldn't check that code.");
    }
    setChecking(false);
  }

  const monthlyPrice = applyDiscount(30, discount);
  const lifetimePrice = applyDiscount(150, discount);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Pricing</h1>
      <p className="text-sm text-base-muted mb-8">Simple pricing, no surprises. Billing isn't live yet — this is a preview of what's coming.</p>

      <div className="flex gap-2 mb-8 max-w-sm">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Discount code"
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
      {message && <p className={`text-sm mb-6 ${discount?.valid ? "text-pill-green-bg" : "text-pill-red-bg"}`}>{message}</p>}

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border border-base-border rounded-2xl p-6">
          <div className="text-sm text-base-muted mb-1">Monthly</div>
          <div className="flex items-baseline gap-2 mb-4">
            {discount?.valid && <span className="text-base-muted line-through text-lg">$30</span>}
            <span className="text-4xl font-semibold">${monthlyPrice.toFixed(0)}</span>
            <span className="text-base-muted text-sm">/ month</span>
          </div>
          <ul className="text-sm text-base-muted space-y-2 mb-6">
            <li>Everything in Vantage — journal, calendar, dashboard, AI Coach</li>
            <li>Friends & shared progress tracking</li>
            <li>Cancel anytime</li>
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
          <div className="flex items-baseline gap-2 mb-4">
            {discount?.valid && <span className="text-base-muted line-through text-lg">$150</span>}
            <span className="text-4xl font-semibold">${lifetimePrice.toFixed(0)}</span>
            <span className="text-base-muted text-sm">one-time</span>
          </div>
          <ul className="text-sm text-base-muted space-y-2 mb-6">
            <li>Everything in Monthly, forever</li>
            <li>All future features included</li>
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
