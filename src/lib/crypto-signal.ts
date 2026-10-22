export type TradeSignal = "BUY" | "SELL" | "HOLD";

/**
 * Lightweight momentum heuristic from 24h (+ optional 7d) % change.
 * Not financial advice — for glanceable mirror context only.
 */
export function tradeSignal(
  change24hPct?: number,
  change7dPct?: number,
): TradeSignal {
  const d1 = change24hPct ?? 0;
  const d7 = change7dPct;

  // Strong single-day moves
  if (d1 >= 5) return "BUY";
  if (d1 <= -5) return "SELL";

  // Confirmed by weekly direction when available
  if (d7 !== undefined) {
    if (d1 >= 2 && d7 >= 0) return "BUY";
    if (d1 <= -2 && d7 <= 0) return "SELL";
    return "HOLD";
  }

  if (d1 >= 2.5) return "BUY";
  if (d1 <= -2.5) return "SELL";
  return "HOLD";
}

export function signalClass(signal: TradeSignal): string {
  switch (signal) {
    case "BUY":
      return "text-emerald-300";
    case "SELL":
      return "text-rose-300";
    default:
      return "text-white/45";
  }
}
