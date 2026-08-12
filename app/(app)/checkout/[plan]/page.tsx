"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { WhopCheckoutEmbed } from "@whop/checkout/react";
import Logo from "@/components/Logo";
import { PLAN_PRICES } from "@/lib/pricing";

type Session = {
  sessionId: string;
  promoCode: string | null;
  pricePreview: { listed: number; price: number; source: "creator" | "launch" | "none"; code: string | null };
};

function CheckoutContent() {
  const params = useParams<{ plan: string }>();
  const planKey = params.plan === "lifetime" ? "lifetime" : "monthly";
  const searchParams = useSearchParams();
  const router = useRouter();

  const [code, setCode] = useState(searchParams.get("code") || "");
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function startCheckout(currentCode: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, code: currentCode || undefined }),
      });
      if (res.status === 401) {
        router.push(`/login?next=/checkout/${planKey}`);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't start checkout.");
        setSession(null);
        setLoading(false);
        return;
      }
      setSession(data);
    } catch {
      setError("Couldn't reach the server.");
    }
    setLoading(false);
  }

  useEffect(() => {
    startCheckout(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const planLabel = planKey === "monthly" ? "OpticTrader Pro (Monthly)" : "OpticTrader Pro (Lifetime)";
  const priceUnit = planKey === "monthly" ? "/ month" : "one-time";
  const listed = session?.pricePreview.listed ?? PLAN_PRICES[planKey].listed;
  const price = session?.pricePreview.price ?? listed;
  const discounted = price < listed;

  return (
    <div className="p-4 sm:p-8 max-w-lg mx-auto">
      <div className="flex items-center gap-2.5 mb-6">
        <Logo className="w-8 h-8" />
        <span className="font-semibold tracking-tight">OpticTrader</span>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border border-base-border rounded-2xl p-6">
        <h1 className="text-lg font-semibold mb-1">Complete your purchase</h1>
        <p className="text-sm text-base-muted mb-6">{planLabel}</p>

        <div className="flex gap-2 mb-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && startCheckout(code)}
            placeholder="Referral / discount code"
            className="flex-1 bg-base-panel2 border border-base-border rounded-lg px-3 py-2 text-sm focus:border-accent focus:shadow-glow outline-none transition-all"
          />
          <button
            onClick={() => startCheckout(code)}
            className="bg-base-panel2 border border-base-border rounded-lg px-3 py-2 text-sm hover:bg-base-panel transition-colors"
          >
            Apply
          </button>
        </div>
        {session?.pricePreview.source === "creator" && (
          <p className="text-xs text-pill-green-bg mb-4">✓ Code {session.pricePreview.code} applied</p>
        )}
        {session?.pricePreview.source === "launch" && <p className="text-xs text-accent mb-4">Launch pricing applied automatically.</p>}
        {!session?.pricePreview.source || session.pricePreview.source === "none" ? <div className="mb-4" /> : null}

        <div className="border-t border-base-border pt-4 mb-4">
          <div className="text-xs text-base-muted mb-2">Order summary</div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span>{planLabel}</span>
            {discounted && <span className="text-base-muted line-through">${listed}</span>}
          </div>
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total today</span>
            <span>
              ${price.toFixed(2)} {planKey === "monthly" && <span className="text-xs text-base-muted font-normal">{priceUnit}</span>}
            </span>
          </div>
        </div>

        {error && <p className="text-sm text-pill-red-bg bg-pill-red-bg/10 border border-pill-red-bg/30 rounded-lg px-3 py-2 mb-4">{error}</p>}

        {loading && <div className="h-40 flex items-center justify-center text-sm text-base-muted">Loading secure checkout…</div>}

        {session && !loading && (
          <div>
            <WhopCheckoutEmbed
              sessionId={session.sessionId}
              promoCode={session.promoCode || undefined}
              theme="dark"
              onComplete={() => router.push(`/checkout/success?plan=${planKey}`)}
              onPaymentError={(err) => setError(err?.message || "Payment failed — you can try again.")}
            />
            <p className="text-center text-xs text-base-muted mt-3">Secure payment powered by Whop</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
