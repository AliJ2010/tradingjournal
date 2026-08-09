"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { parseTags } from "@/lib/json";

function escapeCsv(v: unknown) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function download(content: string | Blob, filename: string, mime: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportButtons() {
  const [loading, setLoading] = useState<"csv" | "pdf" | null>(null);

  async function getTrades() {
    const res = await fetch("/api/trades");
    return res.json();
  }

  async function exportCSV() {
    setLoading("csv");
    try {
      const trades = await getTrades();
      const headers = [
        "Date", "Result", "Direction", "Instrument", "HTF Bias", "Entry Time", "Exit Time",
        "Risk ($)", "RR", "PnL", "Setup Tags", "Emotion Tags", "Rules Followed", "Notes",
      ];
      const rows = trades.map((t: any) => [
        new Date(t.date).toLocaleDateString(),
        t.result,
        t.direction,
        t.instrument,
        t.htfBias,
        t.entryTime,
        t.exitTime,
        t.riskPercent,
        t.rr,
        t.pnl,
        parseTags(t.setupTags).join("; "),
        parseTags(t.emotionTags).join("; "),
        t.rulesFollowed ? "Yes" : "No",
        (t.notes || "").replace(/\n/g, " "),
      ]);
      const csv = [headers, ...rows].map((r) => r.map(escapeCsv).join(",")).join("\n");
      download(csv, `optictrader-journal-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
    } finally {
      setLoading(null);
    }
  }

  async function exportPDF() {
    setLoading("pdf");
    try {
      const trades = await getTrades();
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("OpticTrader — Trading Journal", 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(`Exported ${new Date().toLocaleDateString()} · ${trades.length} trades`, 14, 22);

      autoTable(doc, {
        startY: 28,
        head: [["Date", "Result", "Dir", "PnL", "Setups", "Notes"]],
        body: trades.map((t: any) => [
          new Date(t.date).toLocaleDateString(),
          t.result,
          t.direction,
          `$${t.pnl.toFixed(2)}`,
          parseTags(t.setupTags).join(", "),
          (t.notes || "").slice(0, 80),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [124, 92, 255] },
      });

      doc.save(`optictrader-journal-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-1.5">
      <button
        onClick={exportCSV}
        disabled={loading !== null}
        className="text-xs bg-base-panel2 border border-base-border rounded-md px-2.5 py-1.5 hover:bg-base-panel transition-colors disabled:opacity-50"
      >
        {loading === "csv" ? "..." : "⬇ CSV"}
      </button>
      <button
        onClick={exportPDF}
        disabled={loading !== null}
        className="text-xs bg-base-panel2 border border-base-border rounded-md px-2.5 py-1.5 hover:bg-base-panel transition-colors disabled:opacity-50"
      >
        {loading === "pdf" ? "..." : "⬇ PDF"}
      </button>
    </div>
  );
}
