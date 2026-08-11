"use client";

import { forwardRef } from "react";
import { formatMoney } from "@/lib/pnl";

export type PnlCardData = {
  dateLabel: string;
  pnl: number;
  trades: number;
  rrLabel: string;
  winRate: number;
  username: string;
};

const PnlCard = forwardRef<HTMLDivElement, PnlCardData>(function PnlCard(
  { dateLabel, pnl, trades, rrLabel, winRate, username },
  ref
) {
  const pnlColor = pnl < 0 ? "#ff6b7f" : "#3df2a8";
  const pnlGlow = pnl < 0 ? "rgba(255,107,127,0.65)" : "rgba(61,242,168,0.7)";

  return (
    <div
      ref={ref}
      style={{
        background: "radial-gradient(circle at 50% 0%, #1c1e4a 0%, #0b0c15 65%)",
        borderRadius: 28,
        padding: "48px 48px 40px",
        border: "1px solid #282b48",
        textAlign: "center",
        width: 600,
        fontFamily: "inherit",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 34 }}>
        <div style={{ fontSize: 16, color: "#a3a6c4", whiteSpace: "nowrap" }}>{dateLabel}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto", flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/optictrader-logo-small.png"
            alt="OpticTrader"
            style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 7, flexShrink: 0, display: "block" }}
          />
          <span style={{ fontSize: 20, fontWeight: 500, color: "#f8f9fc", whiteSpace: "nowrap", lineHeight: 1 }}>OpticTrader</span>
        </div>
      </div>

      <div style={{ fontSize: 14, letterSpacing: "0.12em", color: "#7f77dd", marginBottom: 10 }}>TODAY&apos;S PNL</div>
      <div
        style={{
          fontSize: 80,
          fontWeight: 700,
          color: pnlColor,
          lineHeight: 1,
          marginBottom: 36,
          textShadow: `0 0 32px ${pnlGlow}, 0 0 64px ${pnlGlow}`,
        }}
      >
        {pnl < 0 ? "-" : "+"}${formatMoney(pnl, 0)}
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 34 }}>
        <StatBox label="Trades" value={`${trades} ${trades === 1 ? "Trade" : "Trades"}`} />
        <StatBox label="RR" value={rrLabel} />
        <StatBox label="Win rate" value={trades > 0 ? `${Math.round(winRate)}%` : "—"} color={trades > 0 ? "#3df2a8" : undefined} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 18, fontWeight: 500, color: "#f8f9fc" }}>@{username}</span>
        <span style={{ fontSize: 14, color: "#5f5ef5" }}>optictrader.me</span>
      </div>
    </div>
  );
});

export default PnlCard;

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ flex: 1, background: "#141527", borderRadius: 16, padding: "20px 14px" }}>
      <div style={{ fontSize: 14, color: "#a3a6c4", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 23, fontWeight: 500, color: color || "#f8f9fc" }}>{value}</div>
    </div>
  );
}
