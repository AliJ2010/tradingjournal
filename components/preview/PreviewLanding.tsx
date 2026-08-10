"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  LineChart as LineChartIcon,
  BookOpen,
  Brain,
  CalendarDays,
  Flame,
  TrendingUp,
  CheckCircle2,
  Target,
} from "lucide-react";
import Logo from "@/components/Logo";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { useCountUp } from "@/lib/useCountUp";

const EASE = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  {
    key: "log",
    tag: "01 — Log",
    title: "Every trade, in seconds",
    body: "Result, direction, setup, risk, and a chart screenshot — captured in one clean form built for after the bell, not a spreadsheet.",
    icon: BookOpen,
  },
  {
    key: "analyze",
    tag: "02 — Analyze",
    title: "Your equity curve, your real edge",
    body: "Win rate, average PnL, rules-followed rate, and an equity curve that updates the moment you log — no exporting to a sheet.",
    icon: LineChartIcon,
  },
  {
    key: "understand",
    tag: "03 — Understand",
    title: "An AI coach that's read your journal",
    body: "Ask it what's actually costing you money. It answers using your setups, your emotional-state tags, your own history — not generic advice.",
    icon: Brain,
  },
  {
    key: "improve",
    tag: "04 — Improve",
    title: "See the calendar, not just the number",
    body: "A day-by-day PnL calendar turns 'down month' into 'three Tuesdays where I broke my rules' — the kind of pattern a single total hides.",
    icon: CalendarDays,
  },
  {
    key: "consistent",
    tag: "05 — Become consistent",
    title: "Streaks that compound",
    body: "Logging becomes the habit. Once it is, the edge you already have stops leaking out through the days you didn't review.",
    icon: Flame,
  },
] as const;

export default function PreviewLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);

      const center = window.innerHeight / 2;
      let closest = 0;
      let closestDist = Infinity;
      stepRefs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const dist = Math.abs(mid - center);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      });
      setActiveStep(closest);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="bg-base-bg text-base-text">
      {/* Nav */}
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-colors duration-300 ${
          scrolled ? "bg-base-bg/90 backdrop-blur-sm border-b border-base-border" : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo className="w-7 h-7" />
            <span className="font-semibold tracking-tight text-[15px]">OpticTrader</span>
          </div>
          <nav className="hidden sm:flex items-center gap-8 text-sm text-base-muted">
            <Link href="/pricing" className="hover:text-base-text transition-colors">
              Pricing
            </Link>
            <Link href="/support" className="hover:text-base-text transition-colors">
              Support
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-base-muted hover:text-base-text transition-colors hidden sm:inline">
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium px-4 py-2 rounded-md bg-accent text-white hover:bg-accent/90 transition-colors"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-40 pb-28 px-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-16 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-accent mb-6 px-2.5 py-1 rounded-full border border-accent/30">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Now tracking setups, not just PnL
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
              Trade with clarity.
              <br />
              See your edge.
            </h1>
            <p className="text-lg text-base-muted leading-relaxed max-w-md mb-9">
              OpticTrader is a trading journal that tracks every setup, catches your patterns, and coaches you toward
              consistency — with an AI that actually knows your history.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
              >
                Start 5-day free trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="px-5 py-3 rounded-md border border-base-border hover:border-base-muted transition-colors">
                Sign in
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
            className="lg:translate-x-6"
          >
            <HeroMockup />
          </motion.div>
        </div>
      </section>

      {/* Pinned narrative section */}
      <section className="relative py-24 px-6 max-w-6xl mx-auto">
        <Reveal className="mb-16 max-w-xl">
          <div className="text-sm font-medium text-accent mb-3">How it works</div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Log it. Analyze it. Understand it. Improve it.</h2>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-16">
          <div className="space-y-32 md:space-y-40 md:pb-32">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.key}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                animate={{ opacity: activeStep === i ? 1 : 0.4 }}
                transition={{ duration: 0.3 }}
                className="max-w-md"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-base-muted mb-4 tracking-wide uppercase">
                  <step.icon className="w-4 h-4 text-accent" />
                  {step.tag}
                </div>
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">{step.title}</h3>
                <p className="text-base-muted text-base leading-relaxed">{step.body}</p>
              </motion.div>
            ))}
          </div>

          <div className="hidden md:block sticky top-28 h-[440px] self-start">
            <AnimatePresence mode="wait">
              <motion.div
                key={STEPS[activeStep].key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="h-full"
              >
                <StepVisual step={STEPS[activeStep].key} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile: static stack of visuals under each step's text (no sticky on small screens) */}
          <div className="md:hidden space-y-6 -mt-16">
            {STEPS.map((step) => (
              <div key={step.key} className="h-[320px]">
                <StepVisual step={step.key} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers strip — real product capabilities, not fabricated social proof */}
      <section className="border-y border-base-border py-16 px-6">
        <RevealGroup className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {[
            { label: "Fields per trade", value: 20, suffix: "+" },
            { label: "Setup tags tracked", value: 0, display: "Unlimited" },
            { label: "AI coach", value: 0, display: "Grounded in your data" },
            { label: "Markets supported", value: 0, display: "Any you trade" },
          ].map((s) => (
            <RevealItem key={s.label}>
              <NumberStat {...s} />
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* Closing CTA */}
      <section className="py-28 px-6 max-w-4xl mx-auto text-center">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">Start seeing your edge today.</h2>
          <p className="text-base-muted text-lg mb-9">5 days free. No card required.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
          >
            Start free trial
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Reveal>
      </section>

      <footer className="border-t border-base-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-base-muted">
          <div className="flex items-center gap-2">
            <Logo className="w-5 h-5" />
            <span>OpticTrader</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/support" className="hover:text-base-text transition-colors">
              Support
            </Link>
            <a href="mailto:support.optictrader@gmail.com" className="hover:text-base-text transition-colors">
              support.optictrader@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NumberStat({ label, value, suffix, display }: { label: string; value: number; suffix?: string; display?: string }) {
  const count = useCountUp(value);
  return (
    <div>
      <div className="text-3xl font-semibold tracking-tight mb-1">
        {display ?? `${Math.round(count)}${suffix ?? ""}`}
      </div>
      <div className="text-sm text-base-muted">{label}</div>
    </div>
  );
}

function BrowserFrame({ children, url = "optictrader.me" }: { children: React.ReactNode; url?: string }) {
  return (
    <div className="border border-base-border rounded-lg overflow-hidden bg-base-panel h-full flex flex-col">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-base-border shrink-0">
        <span className="w-2 h-2 rounded-full bg-base-border" />
        <span className="w-2 h-2 rounded-full bg-base-border" />
        <span className="w-2 h-2 rounded-full bg-base-border" />
        <span className="ml-3 text-[11px] text-base-muted">{url}</span>
      </div>
      <div className="flex-1 p-5 overflow-hidden">{children}</div>
    </div>
  );
}

function HeroMockup() {
  return (
    <BrowserFrame url="optictrader.me/dashboard">
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MiniStat label="Win rate" value="64.2%" />
        <MiniStat label="Total PnL" value="+$4,820" tone="green" />
        <MiniStat label="Avg / trade" value="+$96" tone="green" />
      </div>
      <MiniEquityCurve />
    </BrowserFrame>
  );
}

function StepVisual({ step }: { step: string }) {
  if (step === "log") return <LogVisual />;
  if (step === "analyze") return <AnalyzeVisual />;
  if (step === "understand") return <UnderstandVisual />;
  if (step === "improve") return <ImproveVisual />;
  return <ConsistentVisual />;
}

function LogVisual() {
  const rows = [
    { label: "Result", value: "Win", tone: "green" as const },
    { label: "Direction", value: "Long", tone: "green" as const },
    { label: "Instrument", value: "NQ", tone: "muted" as const },
    { label: "Setup / Model", value: "5m FVG", tone: "muted" as const },
    { label: "Risk ($)", value: "$120.00", tone: "muted" as const },
    { label: "PnL", value: "+$320.00", tone: "green" as const },
  ];
  return (
    <BrowserFrame url="optictrader.me/journal">
      <div className="text-xs text-base-muted mb-3">Today's entry</div>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-sm py-1 border-b border-base-border/50 last:border-0">
            <span className="text-base-muted">{r.label}</span>
            <span className={r.tone === "green" ? "text-pill-green-bg font-medium" : "font-medium"}>{r.value}</span>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

function AnalyzeVisual() {
  return (
    <BrowserFrame url="optictrader.me/dashboard">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <MiniStat label="Win rate" value="64.2%" />
        <MiniStat label="Rules followed" value="81%" />
      </div>
      <MiniEquityCurve tall />
    </BrowserFrame>
  );
}

function UnderstandVisual() {
  return (
    <BrowserFrame url="optictrader.me/coach">
      <div className="space-y-3">
        <div className="max-w-[85%] bg-base-panel2 border border-base-border rounded-lg px-3 py-2 text-sm text-base-muted">
          What's actually costing me money lately?
        </div>
        <div className="max-w-[90%] ml-auto bg-accent/10 border border-accent/25 rounded-lg px-3 py-2 text-sm">
          Your rules-followed rate drops to 54% on Fridays — that's where most of this month's losses cluster.
        </div>
      </div>
    </BrowserFrame>
  );
}

function ImproveVisual() {
  // Generated client-side only (post-mount) so server/client renders don't mismatch on random values.
  const [days, setDays] = useState<(number | null)[] | null>(null);

  useEffect(() => {
    setDays(
      Array.from({ length: 28 }, () => {
        const r = Math.random();
        if (r < 0.15) return null; // no trade logged that day
        if (r < 0.28) return 0; // breakeven
        const magnitude = 4 + Math.random() * 26;
        return r < 0.64 ? magnitude : -magnitude;
      })
    );
  }, []);

  return (
    <BrowserFrame url="optictrader.me/calendar">
      <div className="grid grid-cols-7 gap-1.5">
        {(days ?? Array(28).fill(null)).map((d, i) => (
          <div
            key={i}
            className={`aspect-square rounded-sm ${
              d === null ? "bg-base-panel2/50" : d === 0 ? "bg-pill-gold-bg/70" : d > 0 ? "bg-pill-green-bg/70" : "bg-pill-red-bg/60"
            }`}
            style={d !== null && d !== 0 ? { opacity: 0.4 + Math.min(Math.abs(d), 25) / 40 } : undefined}
          />
        ))}
      </div>
    </BrowserFrame>
  );
}

function ConsistentVisual() {
  return (
    <BrowserFrame url="optictrader.me/calendar">
      <div className="flex items-center gap-3 mb-4">
        <Flame className="w-8 h-8 text-accent" />
        <div>
          <div className="text-2xl font-semibold">14 days</div>
          <div className="text-xs text-base-muted">Current logging streak</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-base-muted">
        <CheckCircle2 className="w-3.5 h-3.5 text-pill-green-bg" />
        Longest streak: 26 days
      </div>
    </BrowserFrame>
  );
}

function MiniEquityCurve({ tall = false }: { tall?: boolean }) {
  const points = "0,44 15,40 30,42 45,30 60,33 75,20 90,24 105,12 120,16 135,6 150,10 165,2";
  return (
    <div className={tall ? "h-40" : "h-24"}>
      <svg viewBox="0 0 165 50" preserveAspectRatio="none" className="w-full h-full">
        <polyline points={points} fill="none" stroke="#5f5ef5" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "green" }) {
  const Icon = tone === "green" ? TrendingUp : Target;
  return (
    <div className="border border-base-border rounded-md px-3 py-2.5">
      <div className="flex items-center gap-1 text-[11px] text-base-muted mb-1">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className={`text-sm font-semibold ${tone === "green" ? "text-pill-green-bg" : ""}`}>{value}</div>
    </div>
  );
}
