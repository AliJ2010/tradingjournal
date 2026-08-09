"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refCode, setRefCode] = useState("");

  useEffect(() => {
    setRefCode(new URLSearchParams(window.location.search).get("ref") || "");
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, displayName, email, refCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      router.push("/journal");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
      setLoading(false);
    }
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
        <h1 className="text-xl font-semibold text-base-text tracking-tight">Create your journal</h1>
        <p className="text-sm text-base-muted mt-1">Track every trade. See every pattern.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-base-muted mb-1.5 field-label">Display name</label>
          <input
            className="w-full bg-base-panel2 border border-base-border rounded-lg px-3 py-2.5 text-sm focus:border-accent focus:shadow-glow outline-none transition-all"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div>
          <label className="block text-xs text-base-muted mb-1.5 field-label">Username</label>
          <input
            className="w-full bg-base-panel2 border border-base-border rounded-lg px-3 py-2.5 text-sm focus:border-accent focus:shadow-glow outline-none transition-all"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-base-muted mb-1.5 field-label">Email</label>
          <input
            type="email"
            className="w-full bg-base-panel2 border border-base-border rounded-lg px-3 py-2.5 text-sm focus:border-accent focus:shadow-glow outline-none transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <p className="text-xs text-base-muted mt-1">Private — never shown to other users.</p>
        </div>
        <div>
          <label className="block text-xs text-base-muted mb-1.5 field-label">Password</label>
          <input
            type="password"
            className="w-full bg-base-panel2 border border-base-border rounded-lg px-3 py-2.5 text-sm focus:border-accent focus:shadow-glow outline-none transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-pill-red-bg bg-pill-red-bg/10 border border-pill-red-bg/30 rounded-lg px-3 py-2"
          >
            {error}
          </motion.p>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full bg-brand-gradient text-white font-medium rounded-lg py-2.5 text-sm shadow-glow hover:brightness-110 transition-all disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create account"}
        </motion.button>
      </form>

      <p className="text-center text-sm text-base-muted mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Log in
        </Link>
      </p>
    </motion.div>
  );
}
