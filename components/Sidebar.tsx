"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/journal", label: "Journal", icon: "📓" },
  { href: "/calendar", label: "Calendar", icon: "🗓️" },
  { href: "/news", label: "News", icon: "📰" },
  { href: "/coach", label: "AI Coach", icon: "🧠" },
  { href: "/friends", label: "Friends", icon: "🤝" },
];

export default function Sidebar({ displayName, role }: { displayName: string; role?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const nav = [...NAV];
  if (role === "creator" || role === "admin") nav.push({ href: "/creator", label: "Creator", icon: "🎬" });
  if (role === "admin") nav.push({ href: "/admin", label: "Admin", icon: "🛠️" });

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 shrink-0 bg-base-panel/80 glass-panel border-r border-base-border flex flex-col h-screen sticky top-0 z-10">
      <div className="px-5 py-5 flex items-center gap-3 border-b border-base-border">
        <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow shrink-0">
          <span className="text-base">📈</span>
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight tracking-tight">Vantage</div>
          <div className="text-xs text-base-muted leading-tight">{displayName}</div>
        </div>
      </div>

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
                <span>{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-base-border space-y-1">
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
    </aside>
  );
}
