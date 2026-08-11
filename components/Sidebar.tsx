"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/journal", label: "Journal", icon: "📓" },
  { href: "/calendar", label: "PnL Calendar", icon: "🗓️" },
  { href: "/news", label: "News", icon: "📰" },
  { href: "/coach", label: "AI Coach", icon: "🧠" },
  { href: "/friends", label: "Friends", icon: "🤝" },
];

export default function Sidebar({ displayName, role }: { displayName: string; role?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [unseenReactions, setUnseenReactions] = useState(0);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    fetch("/api/friends")
      .then((r) => r.json())
      .then((links) => {
        if (Array.isArray(links)) {
          setPendingRequests(links.filter((l) => l.status === "pending" && l.direction === "incoming").length);
        }
      })
      .catch(() => {});
    fetch("/api/reactions")
      .then((r) => r.json())
      .then((data) => setUnseenReactions(data.unseenCount || 0))
      .catch(() => {});
  }, [pathname]);

  const nav = [...NAV];
  if (role === "creator" || role === "admin") nav.push({ href: "/creator", label: "Creator", icon: "🎬" });
  if (role === "admin") nav.push({ href: "/admin", label: "Admin", icon: "🛠️" });

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navLinks = (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {nav.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className="relative block">
            {active && (
              <motion.div
                layoutId="nav-active"
                className="absolute inset-0 bg-brand-gradient-soft border border-accent/30 rounded-xl"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <motion.div
              whileHover={{ x: active ? 0 : 3 }}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                active ? "text-base-text font-semibold" : "text-base-muted hover:text-base-text"
              }`}
            >
              <span>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.href === "/friends" && pendingRequests > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-pill-red-bg text-white text-[11px] font-semibold leading-none">
                  {pendingRequests}
                </span>
              )}
              {item.href === "/journal" && unseenReactions > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-pill-red-bg text-white text-[11px] font-semibold leading-none">
                  {unseenReactions}
                </span>
              )}
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );

  const footerLinks = (
    <div className="p-3 border-t border-base-border space-y-1">
      <Link
        href="/support"
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
          pathname?.startsWith("/support") ? "text-base-text bg-base-panel2 font-medium" : "text-base-muted hover:text-base-text hover:bg-base-panel2"
        }`}
      >
        <span>❓</span>
        <span>Support</span>
      </Link>
      <Link
        href="/settings"
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
          pathname?.startsWith("/settings") ? "text-base-text bg-base-panel2 font-medium" : "text-base-muted hover:text-base-text hover:bg-base-panel2"
        }`}
      >
        <span>⚙️</span>
        <span>Settings</span>
      </Link>
      <button
        onClick={logout}
        className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-base-muted hover:text-base-text hover:bg-base-panel2 transition-colors"
      >
        <span>⏻</span>
        <span>Log out</span>
      </button>
    </div>
  );

  return (
    <>
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 glass-panel border-b border-base-border">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-base-panel2 shrink-0"
          aria-label="Open menu"
        >
          <span className="text-lg">☰</span>
        </button>
        <div className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <span className="text-sm font-semibold tracking-tight">OpticTrader</span>
        </div>
        <div className="w-9 shrink-0" />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 w-72 z-50 md:hidden bg-base-panel glass-panel border-r border-base-border flex flex-col"
            >
              <div className="px-5 py-5 flex items-center gap-3 border-b border-base-border">
                <div className="w-12 h-12 rounded-xl bg-base-panel2 flex items-center justify-center shrink-0">
                  <Logo className="w-10 h-10" />
                </div>
                <div>
                  <div className="text-sm font-semibold leading-tight tracking-tight">OpticTrader</div>
                  <div className="text-xs text-base-muted leading-tight">{displayName}</div>
                </div>
              </div>
              {navLinks}
              {footerLinks}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside className="hidden md:flex w-64 shrink-0 bg-base-panel/80 glass-panel border-r border-base-border flex-col h-screen sticky top-0 z-10">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-base-border">
          <div className="w-12 h-12 rounded-xl bg-base-panel2 flex items-center justify-center shrink-0">
            <Logo className="w-10 h-10" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight tracking-tight">OpticTrader</div>
            <div className="text-xs text-base-muted leading-tight">{displayName}</div>
          </div>
        </div>
        {navLinks}
        {footerLinks}
      </aside>
    </>
  );
}
