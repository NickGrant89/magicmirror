"use client";

import { Clock } from "@/components/mirror/clock";
import { Sparkline } from "@/components/mirror/sparkline";
import { SectionLabel } from "@/components/mirror/section-label";
import { signalClass } from "@/lib/crypto-signal";
import { formatPct } from "@/lib/format";
import type { SymbolCharts } from "@/lib/crypto-charts";
import { cn } from "@/lib/utils";

export function CryptoChartSlide({
  symbol,
  loading,
  error,
}: {
  symbol: SymbolCharts | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading && !symbol) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-white/40">
        Loading charts…
      </div>
    );
  }

  if ((error && !symbol) || !symbol) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-white/50">
        Charts unavailable
      </div>
    );
  }

  const primary =
    symbol.intervals.find((i) => i.interval === "1h") ?? symbol.intervals[0];

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
      <div className="grid shrink-0 grid-cols-[1fr_auto] items-end gap-3">
        <div className="min-w-0">
          <SectionLabel>Charts</SectionLabel>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-display text-3xl text-white sm:text-4xl">
              {symbol.symbol}
            </h2>
            <p className="text-sm text-white/45">{symbol.name}</p>
            {primary ? (
              <span
                className={cn(
                  "font-display text-sm font-semibold tracking-[0.16em] uppercase",
                  signalClass(primary.signal),
                )}
              >
                {primary.signal}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[0.65rem] tracking-wide text-white/35">
            15m · 30m · 1h · 4h · 1D · Binance · not advice
          </p>
        </div>
        <div className="origin-bottom-right scale-90 sm:scale-100">
          <Clock />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {symbol.intervals.map((tf) => (
          <article
            key={tf.interval}
            className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/[0.04] px-2.5 py-2"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="font-display text-xs tracking-[0.14em] text-white/70 uppercase">
                {tf.label}
              </span>
              <span
                className={cn(
                  "font-display text-[0.65rem] font-semibold tracking-[0.12em] uppercase",
                  signalClass(tf.signal),
                )}
              >
                {tf.signal}
              </span>
            </div>
            <div className="mt-1 min-h-0 flex-1">
              <Sparkline values={tf.candles.map((c) => c.c)} />
            </div>
            <p
              className={cn(
                "mt-1 text-[0.7rem] tabular-nums",
                tf.changePct >= 0 ? "text-emerald-300/80" : "text-rose-300/80",
              )}
            >
              {formatPct(tf.changePct)}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
