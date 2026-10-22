import { NextResponse } from "next/server";
import { tradeSignal } from "@/lib/crypto-signal";
import { mockCryptoFallback } from "@/lib/mocks";
import type { CryptoPayload, CryptoQuote } from "@/lib/types";

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,vechain,ripple,binancecoin,holotoken&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h,7d";

const ID_MAP = {
  bitcoin: { symbol: "BTC" as const, name: "Bitcoin" },
  vechain: { symbol: "VET" as const, name: "VeChain" },
  ripple: { symbol: "XRP" as const, name: "XRP" },
  binancecoin: { symbol: "BNB" as const, name: "BNB" },
  holotoken: { symbol: "HOT" as const, name: "Holo" },
} as const;

const ORDER = [
  "bitcoin",
  "vechain",
  "ripple",
  "binancecoin",
  "holotoken",
] as const;

type MarketsRow = {
  id: string;
  current_price?: number;
  price_change_percentage_24h?: number | null;
  price_change_percentage_24h_in_currency?: number | null;
  price_change_percentage_7d_in_currency?: number | null;
};

function withSignal(quote: Omit<CryptoQuote, "signal">): CryptoQuote {
  return {
    ...quote,
    signal: tradeSignal(quote.change24hPct, quote.change7dPct),
  };
}

async function fetchGbpMap(): Promise<Record<string, number>> {
  const url =
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,vechain,ripple,binancecoin,holotoken&vs_currencies=gbp";
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
    cache: "no-store",
  });
  if (!res.ok) return {};
  const data = (await res.json()) as Record<string, { gbp?: number }>;
  const out: Record<string, number> = {};
  for (const id of ORDER) {
    if (typeof data[id]?.gbp === "number") out[id] = data[id].gbp!;
  }
  return out;
}

export async function GET() {
  try {
    const [marketsRes, gbpMap] = await Promise.all([
      fetch(COINGECKO_URL, {
        headers: { Accept: "application/json" },
        next: { revalidate: 0 },
        cache: "no-store",
      }),
      fetchGbpMap(),
    ]);

    if (!marketsRes.ok) {
      throw new Error(`CoinGecko ${marketsRes.status}`);
    }

    const rows = (await marketsRes.json()) as MarketsRow[];
    const byId = new Map(rows.map((r) => [r.id, r]));

    const quotes: CryptoQuote[] = ORDER.map((id) => {
      const meta = ID_MAP[id];
      const row = byId.get(id);
      const change24h =
        row?.price_change_percentage_24h_in_currency ??
        row?.price_change_percentage_24h ??
        undefined;
      const change7d =
        row?.price_change_percentage_7d_in_currency ?? undefined;
      const usdt = row?.current_price ?? 0;
      const gbp = gbpMap[id] ?? 0;

      return withSignal({
        symbol: meta.symbol,
        name: meta.name,
        usdt,
        gbp,
        change24hPct:
          typeof change24h === "number" ? change24h : undefined,
        change7dPct: typeof change7d === "number" ? change7d : undefined,
      });
    });

    const payload: CryptoPayload = {
      source: "live",
      quotes,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload);
  } catch {
    const payload: CryptoPayload = {
      source: "mock",
      quotes: mockCryptoFallback.map((q) => withSignal(q)),
      updatedAt: new Date().toISOString(),
      note: "CoinGecko unavailable — showing mock quotes.",
    };
    return NextResponse.json(payload);
  }
}
