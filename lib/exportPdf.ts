import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { parseTags } from "./json";

function addTradeTable(doc: jsPDF, trades: any[], startY: number) {
  autoTable(doc, {
    startY,
    head: [["Date", "Result", "Dir", "Instrument", "TF", "RR", "PnL", "Setups", "Notes"]],
    body: trades.map((t: any) => [
      new Date(t.date).toLocaleDateString(undefined, { timeZone: "UTC" }),
      t.result,
      t.direction,
      t.instrument || "—",
      t.timeFrame || "—",
      t.rr || "—",
      `${t.pnl < 0 ? "-" : "+"}$${Math.abs(t.pnl).toFixed(2)}`,
      parseTags(t.setupTags).join(", ") || "—",
      t.notes || "—",
    ]),
    styles: { fontSize: 9, cellPadding: 3, valign: "top", overflow: "linebreak" },
    headStyles: { fillColor: [95, 94, 245], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [244, 244, 250] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 20 },
      2: { cellWidth: 14 },
      3: { cellWidth: 24 },
      4: { cellWidth: 16 },
      5: { cellWidth: 14 },
      6: { cellWidth: 24, halign: "right", fontStyle: "bold" },
      7: { cellWidth: 40 },
      8: { cellWidth: "auto" },
    },
    didParseCell: (data: any) => {
      if (data.section !== "body") return;
      const t = trades[data.row.index];
      if (data.column.index === 6) {
        data.cell.styles.textColor = t.pnl < 0 ? [200, 60, 70] : [30, 150, 100];
      }
      if (data.column.index === 1) {
        data.cell.styles.textColor = t.result === "Win" ? [30, 150, 100] : t.result === "Loss" ? [200, 60, 70] : [180, 140, 20];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });
}

export function exportTradesPdf(trades: any[], opts: { title: string; subtitleExtra?: string; filename: string }) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(18);
  doc.setTextColor(20);
  doc.text(opts.title, 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(130);
  const tradeCount = `${trades.length} trade${trades.length === 1 ? "" : "s"}`;
  const subtitle = `Exported ${new Date().toLocaleDateString()} · ${tradeCount}${opts.subtitleExtra ? " · " + opts.subtitleExtra : ""}`;
  doc.text(subtitle, 14, 22);

  addTradeTable(doc, trades, 28);
  doc.save(opts.filename);
}

export function exportDashboardPdf(
  trades: any[],
  stats: {
    winRate: number;
    pureWins: number;
    breakevens: number;
    losses: number;
    totalPnl: number;
    avgPnl: number;
    rulesFollowedRate: number;
  },
  filename: string
) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(18);
  doc.setTextColor(20);
  doc.text("OpticTrader — Dashboard Report", 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(130);
  const tradeCount = `${trades.length} trade${trades.length === 1 ? "" : "s"}`;
  doc.text(`Exported ${new Date().toLocaleDateString()} · ${tradeCount}`, 14, 22);

  const money = (n: number) => `${n < 0 ? "-" : "+"}$${Math.abs(n).toFixed(2)}`;
  autoTable(doc, {
    startY: 28,
    theme: "plain",
    body: [
      ["Win rate", `${stats.winRate.toFixed(1)}%`, "Wins / BE / Losses", `${stats.pureWins} / ${stats.breakevens} / ${stats.losses}`],
      ["Total PnL", money(stats.totalPnl), "Avg PnL / trade", money(stats.avgPnl)],
      ["Rules followed", `${stats.rulesFollowedRate.toFixed(0)}%`, "", ""],
    ],
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [110, 110, 130] },
      1: { fontStyle: "bold", fontSize: 13 },
      2: { fontStyle: "bold", textColor: [110, 110, 130] },
      3: { fontStyle: "bold", fontSize: 13 },
    },
  });

  const afterStats = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(12);
  doc.setTextColor(20);
  doc.text("Full trade log", 14, afterStats);
  addTradeTable(doc, trades, afterStats + 4);

  doc.save(filename);
}
