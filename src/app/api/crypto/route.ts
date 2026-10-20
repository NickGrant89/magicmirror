import { NextResponse } from "next/server";
import { mockCryptoFallback } from "@/lib/mocks";
import type { CryptoPayload, CryptoQuote } from "@/lib/types";

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,vechain,ripple,binancecoin,holotoken&vs_currencies=usd,gbp&include_24hr_change=true";

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

type CoinGeckoResponse = Record<
  string,
  { usd?: number; gbp?: number; usd_24h_change?: number }
>;

export async function GET() {
  try {
    const res = await fetch(COINGECKO_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`CoinGecko ${res.status}`);
    }

    const data = (await res.json()) as CoinGeckoResponse;
    const quotes: CryptoQuote[] = ORDER.map((id) => {
      const meta = ID_MAP[id];
      const row = data[id] ?? {};
      return {
        symbol: meta.symbol,
        name: meta.name,
        // USDT tracks USD closely on public spot; CoinGecko exposes USD.
        usdt: row.usd ?? 0,
        gbp: row.gbp ?? 0,
        change24hPct: row.usd_24h_change,
      };
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
      quotes: mockCryptoFallback,
      updatedAt: new Date().toISOString(),
      note: "CoinGecko unavailable — showing mock quotes.",
    };
    return NextResponse.json(payload);
  }
}
