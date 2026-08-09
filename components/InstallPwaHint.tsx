"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function InstallPwaHint() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen((o) => !o)} className="text-xs text-base-muted hover:text-base-text transition-colors">
        📱 Add OpticTrader to your home screen
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 glass-panel border border-base-border rounded-xl p-3 text-left text-xs text-base-muted shadow-card z-50"
          >
            <p className="mb-1.5">
              <span className="text-base-text font-medium">iPhone:</span> tap Share <span className="text-base-text">⬆️</span> then "Add to Home
              Screen"
            </p>
            <p>
              <span className="text-base-text font-medium">Android:</span> tap the menu <span className="text-base-text">⋮</span> then "Install
              app"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
