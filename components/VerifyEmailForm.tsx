"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Logo from "./Logo";

export default function VerifyEmailForm({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Something went wrong.");
      else {
        router.push("/journal");
        router.refresh();
      }
    } catch {
      setError("Could not reach the server.");
    }
    setLoading(false);
  }

  async function resend() {
    setResending(true);
    setError("");
    setStatus("");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Something went wrong.");
      else setStatus("New code sent.");
    } catch {
      setError("Could not reach the server.");
    }
    setResending(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="glass-panel border border-base-border rounded-2xl p-8 shadow-card"
    >
      <div className="mb-6 text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-base-panel2 flex items-center justify-center">
          <Logo className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-semibold text-base-text tracking-tight">Confirm your email</h1>
        <p className="text-sm text-base-muted mt-1">
          Enter the code we sent to <span className="text-base-text">{email}</span>
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="123456"
          inputMode="numeric"
          className="w-full bg-base-panel2 border border-base-border rounded-lg px-3 py-3 text-center text-2xl font-semibold tracking-[0.3em] focus:border-accent focus:shadow-glow outline-none transition-all"
          autoFocus
          required
        />

        {error && <p className="text-sm text-pill-red-bg bg-pill-red-bg/10 border border-pill-red-bg/30 rounded-lg px-3 py-2">{error}</p>}
        {status && <p className="text-sm text-pill-green-bg">{status}</p>}

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full bg-brand-gradient text-white font-medium rounded-lg py-2.5 text-sm shadow-glow hover:brightness-110 transition-all disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify email"}
        </motion.button>
      </form>

      <p className="text-center text-sm text-base-muted mt-6">
        Didn't get it?{" "}
        <button onClick={resend} disabled={resending} className="text-accent hover:underline disabled:opacity-60">
          {resending ? "Sending..." : "Resend code"}
        </button>
      </p>
    </motion.div>
  );
}
