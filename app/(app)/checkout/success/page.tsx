"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planKey = searchParams.get("plan") === "lifetime" ? "lifetime" : "monthly";
  const [ready, setReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const res = await fetch("/api/checkout/status");
        const data = await res.json();
        if (data.ready) {
          setReady(true);
          clearInterval(interval);
          return;
        }
      } catch {}
      if (attempts >= 20) {
        setTimedOut(true);
        clearInterval(interval);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 sm:p-8 max-w-md mx-auto">
      <div className="flex items-center gap-2.5 mb-6">
        <Logo className="w-8 h-8" />
        <span className="font-semibold tracking-tight">OpticTrader</span>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border border-base-border rounded-2xl p-6 text-center">
        {!ready && !timedOut && (
          <>
            <div className="text-3xl mb-3">⏳</div>
            <h1 className="text-lg font-semibold mb-1">Confirming your payment…</h1>
            <p className="text-sm text-base-muted">This usually takes just a few seconds.</p>
          </>
        )}

        {ready && (
          <>
            <div className="text-3xl mb-3">✅</div>
            <h1 className="text-lg font-semibold mb-1">Payment successful</h1>
            <p className="text-sm text-base-muted mb-1">Welcome to OpticTrader Pro.</p>
            <p className="text-xs text-base-muted mb-6">Plan: {planKey === "monthly" ? "Monthly" : "Lifetime"}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-brand-gradient text-white font-semibold rounded-lg py-2.5 text-sm shadow-glow hover:brightness-110 transition-all"
            >
              Go to Dashboard
            </button>
          </>
        )}

        {timedOut && !ready && (
          <>
            <div className="text-3xl mb-3">🟠</div>
            <h1 className="text-lg font-semibold mb-1">Still confirming</h1>
            <p className="text-sm text-base-muted mb-6">
              Your payment may still be processing. If this doesn't update in a minute, contact support — we'll never charge you twice.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-base-panel2 border border-base-border rounded-lg py-2.5 text-sm hover:bg-base-panel transition-colors"
            >
              Go to Dashboard anyway
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
