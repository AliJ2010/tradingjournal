import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { parseTags } from "./json";

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

  autoTable(doc, {
    startY: 28,
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
      (t.notes || "").slice(0, 120),
    ]),
    styles: { fontSize: 9, cellPadding: 3, valign: "middle" },
    headStyles: { fillColor: [95, 94, 245], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [244, 244, 250] },
    columnStyles: { 6: { halign: "right", fontStyle: "bold" } },
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

  doc.save(opts.filename);
}
