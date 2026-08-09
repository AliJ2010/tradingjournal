import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import AmbientBackground from "@/components/AmbientBackground";
import LandingMockup from "@/components/LandingMockup";
import LandingChatWidget from "@/components/LandingChatWidget";

const MARKETS = ["NQ", "ES", "YM", "CL", "GC", "Forex", "Crypto", "Stocks"];

const WHY = [
  {
    icon: "🧠",
    title: "An AI Coach that knows your history",
    body: "Not generic advice — feedback grounded in your actual setups, emotional-state tags, and rule-following rate.",
  },
  {
    icon: "🗓️",
    title: "See your patterns, not just your PnL",
    body: "A win/loss calendar and logging streak make it obvious which days — and which setups — actually work for you.",
  },
  {
    icon: "🔒",
    title: "Share progress, keep your privacy",
    body: "Add one friend to compare journals — and mark any field private so only you ever see it.",
  },
];

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/journal");

  return (
    <div className="relative min-h-screen bg-base-bg text-base-text overflow-hidden">
      <AmbientBackground />

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-glow">
            <span className="text-sm">📈</span>
          </div>
          <span className="font-semibold tracking-tight">Vantage</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm text-base-muted hover:text-base-text transition-colors hidden sm:inline">
            Pricing
          </Link>
          <Link href="/support" className="text-sm text-base-muted hover:text-base-text transition-colors hidden sm:inline">
            Support
          </Link>
          <Link href="/login" className="text-sm px-4 py-2 rounded-lg border border-base-border hover:border-accent/50 transition-colors">
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm px-4 py-2 rounded-lg bg-brand-gradient text-white font-medium shadow-glow hover:brightness-110 transition-all"
          >
            Start free trial
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-8 pt-16 pb-8 text-center">
        <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-tight mb-5">
          Trade with clarity.
          <br />
          <span className="bg-brand-gradient bg-clip-text text-transparent">See your edge.</span>
        </h1>
        <p className="text-base-muted text-lg max-w-xl mx-auto mb-9">
          Vantage is a trading journal that tracks every setup, catches your patterns, and coaches you toward consistency — with an AI
          that actually knows your history.
        </p>
        <div className="flex items-center justify-center gap-3 mb-16">
          <Link
            href="/register"
            className="px-6 py-3 rounded-lg bg-brand-gradient text-white font-medium shadow-glow hover:brightness-110 transition-all"
          >
            Start 5-day free trial
          </Link>
          <Link href="/login" className="px-6 py-3 rounded-lg border border-base-border hover:border-accent/50 transition-colors">
            Sign in
          </Link>
        </div>

        <div className="max-w-3xl mx-auto mb-16">
          <LandingMockup />
        </div>

        <div className="mb-24">
          <p className="text-xs text-base-muted uppercase tracking-wide mb-4">Works with any market</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {MARKETS.map((m) => (
              <span key={m} className="text-sm px-3 py-1.5 rounded-lg glass-panel border border-base-border text-base-muted">
                {m}
              </span>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5 text-left mb-16">
          {WHY.map((w) => (
            <div key={w.title} className="glass-panel border border-base-border rounded-2xl p-6">
              <div className="text-2xl mb-3">{w.icon}</div>
              <h3 className="font-semibold mb-2">{w.title}</h3>
              <p className="text-sm text-base-muted leading-relaxed">{w.body}</p>
            </div>
          ))}
        </div>

        <div className="glass-panel border border-accent/30 rounded-2xl p-10 shadow-glow mb-8">
          <h2 className="text-2xl font-semibold mb-2">Ready to see your edge?</h2>
          <p className="text-base-muted mb-6">5 days free. No card required.</p>
          <Link
            href="/register"
            className="inline-block px-6 py-3 rounded-lg bg-brand-gradient text-white font-medium shadow-glow hover:brightness-110 transition-all"
          >
            Start free trial
          </Link>
        </div>
      </main>

      <footer className="relative z-10 text-center text-xs text-base-muted pb-8">
        <Link href="/support" className="hover:text-base-text transition-colors">
          Support
        </Link>
      </footer>

      <LandingChatWidget />
    </div>
  );
}
