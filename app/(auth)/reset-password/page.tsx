"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token"));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Something went wrong.");
      else {
        setDone(true);
        setTimeout(() => router.push("/login"), 2000);
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
        <h1 className="text-xl font-semibold text-base-text tracking-tight">Set a new password</h1>
      </div>

      {token === null ? (
        <p className="text-sm text-base-muted">Loading...</p>
      ) : done ? (
        <p className="text-sm text-pill-green-bg bg-pill-green-bg/10 border border-pill-green-bg/30 rounded-lg px-3 py-3">
          Password updated — redirecting to login.
        </p>
      ) : !token ? (
        <p className="text-sm text-pill-red-bg bg-pill-red-bg/10 border border-pill-red-bg/30 rounded-lg px-3 py-3">
          Missing reset token. Request a new link from the{" "}
          <Link href="/forgot-password" className="underline">
            forgot password page
          </Link>
          .
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-base-muted mb-1.5 field-label">New password</label>
            <input
              type="password"
              className="w-full bg-base-panel2 border border-base-border rounded-lg px-3 py-2.5 text-sm focus:border-accent focus:shadow-glow outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-xs text-base-muted mb-1.5 field-label">Confirm password</label>
            <input
              type="password"
              className="w-full bg-base-panel2 border border-base-border rounded-lg px-3 py-2.5 text-sm focus:border-accent focus:shadow-glow outline-none transition-all"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
            {loading ? "Saving..." : "Save new password"}
          </motion.button>
        </form>
      )}
    </motion.div>
  );
}
