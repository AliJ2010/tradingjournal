export function parseRRMagnitude(rr: string): number | null {
  const match = rr.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  return Math.abs(parseFloat(match[0]));
}

export function signedRR(rr: string, result: string): number {
  const mag = parseRRMagnitude(rr);
  if (mag === null) return 0;
  if (result === "Loss") return -mag;
  if (result === "Win") return mag;
  return 0;
}

export function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
