export function signPnl(pnl: number, result: string): number {
  if (result === "Loss") return -Math.abs(pnl);
  if (result === "Win") return Math.abs(pnl);
  return pnl;
}
