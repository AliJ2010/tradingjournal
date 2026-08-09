"use client";

import { motion } from "framer-motion";

export function StatCard({ label, value, tone }: { label: string; value: string; tone?: "green" | "red" | "accent" | "default" }) {
  const toneClass =
    tone === "green" ? "text-pill-green-bg" : tone === "red" ? "text-pill-red-bg" : tone === "accent" ? "text-accent" : "text-base-text";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel border border-base-border rounded-2xl p-5"
    >
      <div className="text-xs text-base-muted mb-1.5">{label}</div>
      <div className={`text-2xl font-semibold ${toneClass}`}>{value}</div>
    </motion.div>
  );
}
