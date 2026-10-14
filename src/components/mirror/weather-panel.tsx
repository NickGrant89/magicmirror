"use client";

import { SectionLabel } from "@/components/mirror/section-label";
import type { WeatherPayload } from "@/lib/types";

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
        <div>
          <p
            className={
              compact
                ? "font-display text-[clamp(1.8rem,5vw,2.6rem)] leading-none tracking-tight text-white tabular-nums"
                : "font-display text-[clamp(3rem,6vw,4.5rem)] leading-none tracking-tight text-white tabular-nums"
            }
          >
            {weather.temperatureC}°
          </p>
          <p className={compact ? "mt-0.5 text-sm text-white/80" : "mt-2 text-xl text-white/80"}>
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
      {!compact && data?.source === "live" ? (
        <p className="mirror-footnote mt-4 text-[0.7rem] tracking-wide text-white/25">
          Live · Open-Meteo
        </p>
      ) : null}
    </section>
  );
}
