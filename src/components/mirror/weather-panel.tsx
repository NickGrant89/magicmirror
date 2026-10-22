"use client";

import { SectionLabel } from "@/components/mirror/section-label";
import { weatherAccent, weatherBadge } from "@/lib/weather-codes";
import type { WeatherPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WeatherPanel({
  data,
  loading,
  error,
  compact = false,
}: {
  data: WeatherPayload | null;
  loading: boolean;
  error: string | null;
  compact?: boolean;
}) {
  const weather = data?.weather;

  return (
    <section className="mirror-fade-in-delay-1">
      <SectionLabel compact={compact}>Weather</SectionLabel>
      {loading && !data ? (
        <p className="text-sm text-white/40">Reading skies…</p>
      ) : error && !data ? (
        <p className="text-sm text-white/50">Weather unavailable</p>
      ) : weather ? (
        <div
          className={cn(
            "rounded-xl border border-white/10 bg-gradient-to-br px-2 py-1.5",
            weatherAccent(weather.weatherCode),
            compact ? "mt-0.5" : "mt-1 px-3 py-2",
          )}
        >
          <div className="flex items-end gap-2">
            <p
              className={
                compact
                  ? "font-display text-[clamp(1.8rem,5vw,2.6rem)] leading-none tracking-tight text-white tabular-nums"
                  : "font-display text-[clamp(3rem,6vw,4.5rem)] leading-none tracking-tight text-white tabular-nums"
              }
            >
              {weather.temperatureC}°
            </p>
            <p
              className={cn(
                "mb-0.5 font-display tracking-[0.14em] text-white/70 uppercase",
                compact ? "text-[0.65rem]" : "text-sm",
              )}
            >
              {weatherBadge(weather.weatherCode)}
            </p>
          </div>
          <p className={compact ? "mt-0.5 text-sm text-white/80" : "mt-1 text-xl text-white/80"}>
            {weather.summary}
          </p>
          <p className={compact ? "mt-0.5 text-[0.7rem] text-white/45" : "mt-1 text-sm text-white/45"}>
            {weather.locationLabel}
            {compact
              ? ` · H${weather.highC}° L${weather.lowC}°`
              : ` · H ${weather.highC}° · L ${weather.lowC}° · feels ${weather.feelsLikeC}°`}
          </p>
        </div>
      ) : null}
    </section>
  );
}
