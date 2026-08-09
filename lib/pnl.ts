export function signPnl(pnl: number, result: string): number {
  if (result === "Loss") return -Math.abs(pnl);
  if (result === "Win") return Math.abs(pnl);
  return pnl;
}

export function formatMoney(n: number, decimals: 0 | 2 = 0): string {
  return Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
