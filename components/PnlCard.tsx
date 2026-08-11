"use client";

import { forwardRef } from "react";
import { Lock } from "lucide-react";
import { formatMoney } from "@/lib/pnl";

export type PnlCardData = {
  dateLabel: string;
  pnl: number;
  trades: number;
  rrLabel: string;
  winRate: number;
  username: string;
};

const PnlCard = forwardRef<
  HTMLDivElement,
  PnlCardData & { code: string; locked: boolean; onCodeChange: (v: string) => void }
>(function PnlCard({ dateLabel, pnl, trades, rrLabel, winRate, username, code, locked, onCodeChange }, ref) {
  const pnlColor = pnl < 0 ? "#ff6b7f" : "#3df2a8";
  const pnlGlow = pnl < 0 ? "rgba(255,107,127,0.65)" : "rgba(61,242,168,0.7)";

  return (
    <div
      ref={ref}
      style={{
        background: "radial-gradient(circle at 50% 0%, #1c1e4a 0%, #0b0c15 65%)",
        borderRadius: 24,
        padding: "38px 38px 30px",
        border: "1px solid #282b48",
        textAlign: "center",
        width: 480,
        fontFamily: "inherit",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26 }}>
        <div style={{ fontSize: 14, color: "#a3a6c4", whiteSpace: "nowrap" }}>{dateLabel}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginLeft: "auto", flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/optictrader-logo-small.png"
            alt="OpticTrader"
            style={{ width: 26, height: 26, objectFit: "contain", borderRadius: 6, flexShrink: 0, display: "block" }}
          />
          <span style={{ fontSize: 16, fontWeight: 500, color: "#f8f9fc", whiteSpace: "nowrap", lineHeight: 1 }}>OpticTrader</span>
        </div>
      </div>

      <div style={{ fontSize: 12, letterSpacing: "0.12em", color: "#7f77dd", marginBottom: 8 }}>TODAY&apos;S PNL</div>
      <div
        style={{
          fontSize: 64,
          fontWeight: 700,
          color: pnlColor,
          lineHeight: 1,
          marginBottom: 26,
          textShadow: `0 0 28px ${pnlGlow}, 0 0 56px ${pnlGlow}`,
        }}
      >
        {pnl < 0 ? "-" : "+"}${formatMoney(pnl, 0)}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <StatBox label="Trades" value={`${trades} ${trades === 1 ? "Trade" : "Trades"}`} />
        <StatBox label="RR" value={rrLabel} />
        <StatBox label="Win rate" value={trades > 0 ? `${Math.round(winRate)}%` : "—"} color={trades > 0 ? "#3df2a8" : undefined} />
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#141527",
            border: "1px solid #383b5c",
            borderRadius: 999,
            padding: "9px 18px",
            boxShadow: "0 0 0 1px rgba(95,94,245,0.12), 0 4px 14px -2px rgba(0,0,0,0.4)",
          }}
        >
          <Lock size={14} color={locked ? "#f5b942" : "#7f77dd"} fill={locked ? "#f5b942" : "none"} />
          <input
            value={code}
            disabled={locked}
            onChange={(e) => onCodeChange(e.target.value)}
            placeholder="Discount code"
            size={code ? Math.max(code.length + 1, 6) : 13}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "0.03em",
              color: locked ? "#a3a6c4" : "#f8f9fc",
              textAlign: "center",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: "#f8f9fc" }}>@{username}</span>
        <span style={{ fontSize: 12, color: "#5f5ef5" }}>optictrader.me</span>
      </div>
    </div>
  );
});

export default PnlCard;

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ flex: 1, background: "#141527", borderRadius: 14, padding: "16px 10px" }}>
      <div style={{ fontSize: 12, color: "#a3a6c4", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 500, color: color || "#f8f9fc" }}>{value}</div>
    </div>
  );
}
