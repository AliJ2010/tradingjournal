import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import AmbientBackground from "@/components/AmbientBackground";

const FEATURES = [
  { icon: "🧠", label: "Real AI coaching", detail: "powered by Claude" },
  { icon: "🗓️", label: "Win/loss calendar", detail: "see your best days" },
  { icon: "📄", label: "PDF & CSV export", detail: "shareable in one click" },
];

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/journal");

  return (
    <div className="relative min-h-screen bg-base-bg text-base-text overflow-hidden">
      <AmbientBackground />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-glow">
            <span className="text-sm">📈</span>
          </div>
          <span className="font-semibold tracking-tight">Vantage</span>
        </div>
        <div className="flex items-center gap-4">
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

      <main className="relative z-10 max-w-4xl mx-auto px-8 pt-20 pb-24 text-center">
        <span className="inline-block text-xs font-medium px-3 py-1.5 rounded-full border border-accent/30 bg-brand-gradient-soft mb-6">
          ✨ AI-powered · built for discretionary traders
        </span>
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

        <div className="flex flex-wrap items-center justify-center gap-3">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl glass-panel border border-base-border"
            >
              <span>{f.icon}</span>
              <span className="font-medium">{f.label}</span>
              <span className="text-base-muted">— {f.detail}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
