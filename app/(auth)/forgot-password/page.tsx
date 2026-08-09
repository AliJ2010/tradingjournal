"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Something went wrong.");
      else {
        setMessage(data.message);
        setSent(true);
      }
    } catch {
      setError("Could not reach the server.");
    }
    setLoading(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="glass-panel border border-base-border rounded-2xl p-8 shadow-card"
    >
      <div className="mb-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-glow">
          <span className="text-xl">🔒</span>
        </div>
        <h1 className="text-xl font-semibold text-base-text tracking-tight">Reset your password</h1>
        <p className="text-sm text-base-muted mt-1">We'll email you a link to set a new one.</p>
      </div>

      {sent ? (
        <p className="text-sm text-pill-green-bg bg-pill-green-bg/10 border border-pill-green-bg/30 rounded-lg px-3 py-3">{message}</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-base-muted mb-1.5 field-label">Email</label>
            <input
              type="email"
              className="w-full bg-base-panel2 border border-base-border rounded-lg px-3 py-2.5 text-sm focus:border-accent focus:shadow-glow outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
          </div>

          {error && <p className="text-sm text-pill-red-bg bg-pill-red-bg/10 border border-pill-red-bg/30 rounded-lg px-3 py-2">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-brand-gradient text-white font-medium rounded-lg py-2.5 text-sm shadow-glow hover:brightness-110 transition-all disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset link"}
          </motion.button>
        </form>
      )}

      <p className="text-center text-sm text-base-muted mt-6">
        <Link href="/login" className="text-accent hover:underline">
          Back to login
        </Link>
      </p>
    </motion.div>
  );
}
