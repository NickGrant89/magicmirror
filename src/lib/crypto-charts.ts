import type { TradeSignal } from "@/lib/crypto-signal";

export const CHART_INTERVALS = [
  { id: "15m", label: "15m", binance: "15m", limit: 96 },
  { id: "30m", label: "30m", binance: "30m", limit: 96 },
  { id: "1h", label: "1h", binance: "1h", limit: 72 },
  { id: "4h", label: "4h", binance: "4h", limit: 42 },
  { id: "1d", label: "1D", binance: "1d", limit: 30 },
  /** Weekly candles — hero chart on Echo coin tabs */
  { id: "1w", label: "1W", binance: "1w", limit: 52 },
] as const;

export type ChartIntervalId = (typeof CHART_INTERVALS)[number]["id"];

export const CHART_SYMBOLS = [
  { symbol: "BTC" as const, binance: "BTCUSDT", name: "Bitcoin" },
  { symbol: "VET" as const, binance: "VETUSDT", name: "VeChain" },
  { symbol: "XRP" as const, binance: "XRPUSDT", name: "XRP" },
  { symbol: "BNB" as const, binance: "BNBUSDT", name: "BNB" },
  { symbol: "HOT" as const, binance: "HOTUSDT", name: "Holo" },
];

export type ChartCandle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
};

export type IntervalChart = {
  interval: ChartIntervalId;
  label: string;
  candles: ChartCandle[];
  changePct: number;
  signal: TradeSignal;
};

export type SymbolCharts = {
  symbol: (typeof CHART_SYMBOLS)[number]["symbol"];
  name: string;
  intervals: IntervalChart[];
};

export type CryptoChartsPayload = {
  source: "live" | "mock";
  updatedAt: string;
  symbols: SymbolCharts[];
  note?: string;
};

/** Momentum heuristic from close series — glanceable only, not advice. */
export function chartSignal(closes: number[]): {
  changePct: number;
  signal: TradeSignal;
} {
  if (closes.length < 4) {
    return { changePct: 0, signal: "HOLD" };
  }

  const first = closes[0]!;
  const last = closes[closes.length - 1]!;
  const changePct = first === 0 ? 0 : ((last - first) / first) * 100;

  const mid = Math.floor(closes.length / 2);
  const early =
    closes.slice(0, mid).reduce((a, b) => a + b, 0) / Math.max(1, mid);
  const late =
    closes.slice(mid).reduce((a, b) => a + b, 0) /
    Math.max(1, closes.length - mid);
  const recentPct = early === 0 ? 0 : ((late - early) / early) * 100;

  // Strong whole-window move
  if (changePct >= 3 || (changePct >= 1.2 && recentPct >= 0.8)) {
    return { changePct, signal: "BUY" };
  }
  if (changePct <= -3 || (changePct <= -1.2 && recentPct <= -0.8)) {
    return { changePct, signal: "SELL" };
  }

  // Softer recent momentum
  if (recentPct >= 1.5) return { changePct, signal: "BUY" };
  if (recentPct <= -1.5) return { changePct, signal: "SELL" };

  return { changePct, signal: "HOLD" };
}

export function parseBinanceKlines(raw: unknown): ChartCandle[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!Array.isArray(row) || row.length < 5) return null;
      return {
        t: Number(row[0]),
        o: Number(row[1]),
        h: Number(row[2]),
        l: Number(row[3]),
        c: Number(row[4]),
      } satisfies ChartCandle;
    })
    .filter((c): c is ChartCandle => c != null && Number.isFinite(c.c));
}
