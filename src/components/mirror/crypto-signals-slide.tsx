"use client";

import { Clock } from "@/components/mirror/clock";
import { SectionLabel } from "@/components/mirror/section-label";
import { signalClass, tradeSignal } from "@/lib/crypto-signal";
import { formatMoney, formatPct } from "@/lib/format";
import type { CryptoPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CryptoSignalsSlide({
  data,
  loading,
  error,
}: {
  data: CryptoPayload | null;
  loading: boolean;
  error: string | null;
}) {
  const quotes = data?.quotes ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <div className="grid shrink-0 grid-cols-[1fr_auto] items-end gap-4">
        <div>
          <SectionLabel>Signals</SectionLabel>
          <p className="mt-1 max-w-md text-[0.7rem] tracking-wide text-white/40">
            24h / 7d momentum · refreshes with live markets · not advice
          </p>
        </div>
        <div className="scale-90 origin-bottom-right sm:scale-100">
          <Clock />
        </div>
      </div>

      {loading && !data ? (
        <p className="text-sm text-white/40">Fetching signals…</p>
      ) : error && !data ? (
        <p className="text-sm text-white/50">Markets unavailable</p>
      ) : (
        <ul className="grid min-h-0 flex-1 grid-cols-1 content-start gap-2 overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
          {quotes.map((quote) => {
            const signal =
              quote.signal ??
              tradeSignal(quote.change24hPct, quote.change7dPct);

            return (
              <li
                key={quote.symbol}
                className="flex min-h-0 flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-lg text-white sm:text-xl">
                    {quote.symbol}
                  </span>
                  <span
                    className={cn(
                      "font-display text-sm font-semibold tracking-[0.14em] uppercase sm:text-base",
                      signalClass(signal),
                    )}
                  >
                    {signal}
                  </span>
                </div>
                <div className="mt-2 space-y-0.5">
                  <p className="truncate text-sm text-white/85 tabular-nums">
                    {formatMoney(quote.usdt, "USDT")}
                  </p>
                  <p className="truncate text-xs text-white/40 tabular-nums">
                    {formatMoney(quote.gbp, "GBP")}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[0.7rem] tabular-nums">
                  <span
                    className={
                      (quote.change24hPct ?? 0) >= 0
                        ? "text-emerald-300/80"
                        : "text-rose-300/80"
                    }
                  >
                    24h {formatPct(quote.change24hPct)}
                  </span>
                  <span
                    className={
                      (quote.change7dPct ?? 0) >= 0
                        ? "text-emerald-300/55"
                        : "text-rose-300/55"
                    }
                  >
                    7d {formatPct(quote.change7dPct)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {data ? (
        <p className="shrink-0 text-[0.55rem] tracking-wide text-white/25">
          {data.source === "live" ? "Live · CoinGecko" : "Mock quotes"} ·{" "}
          {new Date(data.updatedAt).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      ) : null}
    </div>
  );
}
