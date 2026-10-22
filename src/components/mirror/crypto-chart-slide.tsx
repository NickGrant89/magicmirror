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

  const hero =
    symbol.intervals.find((i) => i.interval === "1w") ??
    symbol.intervals.find((i) => i.interval === "1d") ??
    symbol.intervals[0];
  const strip = symbol.intervals.filter((i) => i.interval !== hero?.interval);

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5 overflow-hidden">
      <div className="grid shrink-0 grid-cols-[1fr_auto] items-end gap-3">
        <div className="min-w-0">
          <SectionLabel>Charts</SectionLabel>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-display text-3xl text-white sm:text-4xl">
              {symbol.symbol}
            </h2>
            <p className="text-sm text-white/45">{symbol.name}</p>
            {hero ? (
              <>
                <span className="font-display text-xs tracking-[0.14em] text-white/50 uppercase">
                  {hero.label}
                </span>
                <span
                  className={cn(
                    "font-display text-sm font-semibold tracking-[0.16em] uppercase",
                    signalClass(hero.signal),
                  )}
                >
                  {hero.signal}
                </span>
                <span
                  className={cn(
                    "text-sm tabular-nums",
                    hero.changePct >= 0
                      ? "text-emerald-300/85"
                      : "text-rose-300/85",
                  )}
                >
                  {formatPct(hero.changePct)}
                </span>
              </>
            ) : null}
          </div>
          <p className="mt-0.5 text-[0.65rem] tracking-wide text-white/35">
            1W hero · 15m · 30m · 1h · 4h · 1D · Binance · not advice
          </p>
        </div>
        <div className="origin-bottom-right scale-90 sm:scale-100">
          <Clock />
        </div>
      </div>

      {/* Dominant full-bleed 1W chart */}
      {hero ? (
        <div className="relative min-h-0 flex-[1.65] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-3 pb-2 pt-2.5">
          <div className="pointer-events-none absolute inset-x-3 top-2 z-10 flex items-center justify-between">
            <span className="font-display text-xs tracking-[0.18em] text-white/55 uppercase">
              {hero.label}
            </span>
            <span
              className={cn(
                "font-display text-[0.7rem] font-semibold tracking-[0.14em] uppercase",
                signalClass(hero.signal),
              )}
            >
              {hero.signal}
            </span>
          </div>
          <div className="absolute inset-x-1 inset-y-6 sm:inset-y-5">
            <Sparkline
              hero
              values={hero.candles.map((c) => c.c)}
              className="opacity-95"
            />
          </div>
        </div>
      ) : null}

      {/* Compact secondary TFs */}
      {strip.length > 0 ? (
        <div className="grid min-h-0 flex-[0.55] grid-cols-5 gap-1.5">
          {strip.map((tf) => (
            <article
              key={tf.interval}
              className="flex min-h-0 flex-col rounded-xl border border-white/10 bg-white/[0.03] px-1.5 py-1"
            >
              <div className="flex items-center justify-between gap-0.5">
                <span className="font-display text-[0.6rem] tracking-[0.12em] text-white/65 uppercase">
                  {tf.label}
                </span>
                <span
                  className={cn(
                    "font-display text-[0.55rem] font-semibold tracking-[0.1em] uppercase",
                    signalClass(tf.signal),
                  )}
                >
                  {tf.signal}
                </span>
              </div>
              <div className="mt-0.5 min-h-0 flex-1">
                <Sparkline values={tf.candles.map((c) => c.c)} />
              </div>
              <p
                className={cn(
                  "text-[0.6rem] tabular-nums leading-none",
                  tf.changePct >= 0 ? "text-emerald-300/75" : "text-rose-300/75",
                )}
              >
                {formatPct(tf.changePct)}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
