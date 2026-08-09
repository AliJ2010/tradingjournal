"use client";

import { motion } from "framer-motion";
import type { PillColor } from "@/lib/tradeFields";

const COLOR_CLASSES: Record<PillColor, string> = {
  red: "bg-pill-red-bg text-pill-red-text shadow-[0_0_16px_-4px_rgba(239,68,68,0.7)]",
  green: "bg-pill-green-bg text-pill-green-text shadow-[0_0_16px_-4px_rgba(16,185,129,0.7)]",
  blue: "bg-pill-blue-bg text-pill-blue-text shadow-[0_0_16px_-4px_rgba(59,130,246,0.7)]",
  orange: "bg-pill-orange-bg text-pill-orange-text shadow-[0_0_16px_-4px_rgba(249,115,22,0.7)]",
  gold: "bg-pill-gold-bg text-pill-gold-text shadow-[0_0_16px_-4px_rgba(234,179,8,0.7)]",
  slate: "bg-pill-slate-bg text-pill-slate-text",
  purple: "bg-pill-purple-bg text-pill-purple-text shadow-[0_0_16px_-4px_rgba(168,85,247,0.7)]",
  teal: "bg-pill-teal-bg text-pill-teal-text shadow-[0_0_16px_-4px_rgba(20,184,166,0.7)]",
  pink: "bg-pill-pink-bg text-pill-pink-text shadow-[0_0_16px_-4px_rgba(236,72,153,0.7)]",
  navy: "bg-pill-navy-bg text-pill-navy-text shadow-[0_0_16px_-4px_rgba(30,58,138,0.7)]",
  silver: "bg-pill-silver-bg text-pill-silver-text",
};

export default function PillBadge({
  label,
  color = "slate",
  onRemove,
  small,
}: {
  label: string;
  color?: PillColor;
  onRemove?: () => void;
  small?: boolean;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.04 }}
      transition={{ duration: 0.15 }}
      className={`inline-flex items-center gap-1.5 rounded-md font-medium ${COLOR_CLASSES[color]} ${
        small ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
      }`}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-70 hover:opacity-100 leading-none"
        >
          ×
        </button>
      )}
    </motion.span>
  );
}

const AUTO_COLOR_PALETTE: PillColor[] = ["orange", "blue", "purple", "gold", "teal"];

export function colorForTag(tag: string): PillColor {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  return AUTO_COLOR_PALETTE[hash % AUTO_COLOR_PALETTE.length];
}

const EMOTION_COLORS: Record<string, PillColor> = {
  fomo: "red",
  anxious: "pink",
  "in control": "navy",
  confident: "green",
  hesitant: "silver",
  overconfident: "orange",
};

export function colorForEmotion(tag: string): PillColor {
  return EMOTION_COLORS[tag.trim().toLowerCase()] ?? colorForTag(tag);
}
