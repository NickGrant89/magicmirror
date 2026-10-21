"use client";

import { SectionLabel } from "@/components/mirror/section-label";
import { formatMoney, formatPct } from "@/lib/format";
import type { CryptoPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CryptoPanel({
  data,
  loading,
  error,
  compact = false,
}: {
  data: CryptoPayload | null;
  loading: boolean;
  error: string | null;
  compact?: boolean;
}) {
  const quotes = data?.quotes ?? [];

  return (
    <section className="mirror-fade-in-delay-3 min-h-0 shrink">
      <SectionLabel compact={compact}>Markets</SectionLabel>
      {loading && !data ? (
        <p className="text-sm text-white/40">Fetching prices…</p>
      ) : error && !data ? (
        <p className="text-sm text-white/50">Markets unavailable</p>
      ) : (
        <ul
          className={cn(
            compact ? "space-y-1" : "space-y-3",
          )}
        >
          {quotes.map((quote) => (
            <li
              key={quote.symbol}
              className={
                compact
                  ? "grid grid-cols-[2.5rem_1fr_auto] items-start gap-1.5"
                  : "grid grid-cols-[3.5rem_1fr_auto] items-baseline gap-3"
              }
            >
              <span
                className={
                  compact
                    ? "pt-0.5 font-display text-[0.7rem] text-white"
                    : "font-display text-xl text-white"
                }
              >
                {quote.symbol}
              </span>
              <div className="min-w-0 leading-tight">
                <p
                  className={
                    compact
                      ? "truncate text-[0.65rem] text-white/85 tabular-nums"
                      : "truncate text-base text-white/85 tabular-nums"
                  }
                >
                  {formatMoney(quote.usdt, "USDT")}
                </p>
                <p
                  className={
                    compact
                      ? "truncate text-[0.58rem] text-white/45 tabular-nums"
                      : "truncate text-sm text-white/40 tabular-nums"
                  }
                >
                  {formatMoney(quote.gbp, "GBP")}
                </p>
              </div>
              <span
                className={cn(
                  "tabular-nums",
                  compact ? "pt-0.5 text-[0.6rem]" : "text-sm",
                  (quote.change24hPct ?? 0) >= 0
                    ? "text-emerald-300/80"
                    : "text-rose-300/80",
                )}
              >
                {formatPct(quote.change24hPct)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {!compact && data ? (
        <p className="mirror-footnote mt-4 text-[0.7rem] tracking-wide text-white/25">
          {data.source === "live" ? "Live · CoinGecko" : "Mock quotes"} · BTC ·
          VET · XRP · BNB · HOT
        </p>
      ) : null}
    </section>
  );
}
