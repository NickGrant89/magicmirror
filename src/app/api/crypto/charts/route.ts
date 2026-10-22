import { NextResponse } from "next/server";
import {
  CHART_INTERVALS,
  CHART_SYMBOLS,
  chartSignal,
  parseBinanceKlines,
  type CryptoChartsPayload,
  type IntervalChart,
  type SymbolCharts,
} from "@/lib/crypto-charts";

type CacheEntry = { at: number; payload: CryptoChartsPayload };
let cache: CacheEntry | null = null;
const CACHE_MS = 60_000;

async function fetchKlines(
  symbol: string,
  interval: string,
  limit: number,
): Promise<IntervalChart["candles"]> {
  const url = new URL("https://api.binance.com/api/v3/klines");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`Binance ${symbol} ${interval} ${res.status}`);
  }
  return parseBinanceKlines(await res.json());
}

async function loadLive(): Promise<CryptoChartsPayload> {
  const jobs = CHART_SYMBOLS.flatMap((meta) =>
    CHART_INTERVALS.map(async (tf) => {
      const candles = await fetchKlines(meta.binance, tf.binance, tf.limit);
      const closes = candles.map((c) => c.c);
      const { changePct, signal } = chartSignal(closes);
      return {
        symbol: meta.symbol,
        name: meta.name,
        interval: {
          interval: tf.id,
          label: tf.label,
          candles,
          changePct,
          signal,
        } satisfies IntervalChart,
      };
    }),
  );

  const rows = await Promise.all(jobs);
  const symbols: SymbolCharts[] = CHART_SYMBOLS.map((meta) => ({
    symbol: meta.symbol,
    name: meta.name,
    intervals: CHART_INTERVALS.map((tf) => {
      const hit = rows.find(
        (r) => r.symbol === meta.symbol && r.interval.interval === tf.id,
      );
      return (
        hit?.interval ?? {
          interval: tf.id,
          label: tf.label,
          candles: [],
          changePct: 0,
          signal: "HOLD" as const,
        }
      );
    }),
  }));

  return {
    source: "live",
    updatedAt: new Date().toISOString(),
    symbols,
  };
}

function mockPayload(): CryptoChartsPayload {
  const now = Date.now();
  return {
    source: "mock",
    updatedAt: new Date().toISOString(),
    note: "Binance charts unavailable — showing mock candles.",
    symbols: CHART_SYMBOLS.map((meta, si) => ({
      symbol: meta.symbol,
      name: meta.name,
      intervals: CHART_INTERVALS.map((tf, ti) => {
        const candles = Array.from({ length: 36 }, (_, i) => {
          const base = 100 + si * 20 + ti * 3;
          const c = base + Math.sin(i / 4 + si) * (3 + ti) + i * 0.05;
          return {
            t: now - (36 - i) * 60_000,
            o: c - 0.4,
            h: c + 1,
            l: c - 1,
            c,
          };
        });
        const { changePct, signal } = chartSignal(candles.map((c) => c.c));
        return {
          interval: tf.id,
          label: tf.label,
          candles,
          changePct,
          signal,
        };
      }),
    })),
  };
}

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return NextResponse.json(cache.payload);
  }

  try {
    const payload = await loadLive();
    cache = { at: Date.now(), payload };
    return NextResponse.json(payload);
  } catch {
    const payload = mockPayload();
    return NextResponse.json(payload);
  }
}
