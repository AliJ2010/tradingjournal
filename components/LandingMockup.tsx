export default function LandingMockup() {
  return (
    <div className="glass-panel border border-base-border rounded-2xl shadow-card overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-base-border">
        <span className="w-2.5 h-2.5 rounded-full bg-pill-red-bg/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-pill-gold-bg/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-pill-green-bg/70" />
        <span className="ml-3 text-xs text-base-muted">vantage.app/journal</span>
      </div>

      <div className="grid md:grid-cols-2 gap-px bg-base-border">
        <div className="bg-base-panel p-5">
          <div className="text-xs text-base-muted mb-3 field-label">Today's entry</div>
          <div className="space-y-2.5">
            <Row label="Result" pillClass="bg-pill-green-bg text-pill-green-text" pillLabel="Win" />
            <Row label="Direction" pillClass="bg-pill-green-bg text-pill-green-text" pillLabel="Long" />
            <Row label="Setup" pillClass="bg-pill-orange-bg text-pill-orange-text" pillLabel="5m FVG" />
            <Row label="PnL" pillClass="bg-pill-green-bg text-pill-green-text" pillLabel="+$320.00" />
          </div>
        </div>

        <div className="bg-base-panel p-5">
          <div className="text-xs text-base-muted mb-3 field-label">Dashboard</div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <MiniStat label="Win rate" value="64%" />
            <MiniStat label="Total PnL" value="+$2,840" tone="green" />
          </div>
          <svg viewBox="0 0 200 50" className="w-full h-12">
            <polyline
              points="0,40 20,35 40,38 60,25 80,28 100,15 120,20 140,10 160,14 180,5 200,8"
              fill="none"
              stroke="url(#mockup-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="mockup-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7c5cff" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}

function Row({ label, pillLabel, pillClass }: { label: string; pillLabel: string; pillClass: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-base-muted">{label}</span>
      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${pillClass}`}>{pillLabel}</span>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "green" }) {
  return (
    <div className="bg-base-panel2 rounded-lg px-3 py-2">
      <div className="text-[11px] text-base-muted">{label}</div>
      <div className={`text-sm font-semibold ${tone === "green" ? "text-pill-green-bg" : ""}`}>{value}</div>
    </div>
  );
}
