"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DISCORD_URL = "https://discord.gg/wjhWDjJG6z";
const REMIND_INTERVAL_MS = 4 * 24 * 60 * 60 * 1000;
const STORAGE_KEY = "discordReminderLastShown";

export default function DiscordReminder() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const last = Number(localStorage.getItem(STORAGE_KEY) || 0);
    if (Date.now() - last < REMIND_INTERVAL_MS) return;
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed bottom-6 left-6 z-40 max-w-[260px] glass-panel border border-base-border rounded-2xl p-4 shadow-glow"
        >
          <button onClick={dismiss} className="absolute top-2 right-2 text-base-muted hover:text-base-text text-xs px-1">
            ✕
          </button>
          <div className="text-sm font-medium mb-1 pr-4">👋 Join our Discord</div>
          <p className="text-xs text-base-muted mb-3">Trade ideas, feedback, and direct access to the OpticTrader team.</p>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className="inline-block bg-brand-gradient text-white text-xs font-medium rounded-lg px-3 py-2 hover:brightness-110 transition-all"
          >
            Join the server
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
