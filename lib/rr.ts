export function parseRRMagnitude(rr: string): number | null {
  const match = rr.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  return Math.abs(parseFloat(match[0]));
}

// The trader can type whatever they want in the RR field for their own reference,
// but for data/aggregation (calendar, PnL card) the result overrides it: a Loss is
// always -1R and a Breakeven is always 0R. Only Wins use the typed magnitude.
export function effectiveRR(rr: string, result: string): number | null {
  if (result === "Breakeven") return 0;
  if (result === "Loss") return -1;
  if (result === "Win") return parseRRMagnitude(rr);
  return null;
}

export function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
