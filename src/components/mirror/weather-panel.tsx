"use client";

import { SectionLabel } from "@/components/mirror/section-label";
import type { WeatherPayload } from "@/lib/types";

export function WeatherPanel({
  data,
  loading,
  error,
}: {
  data: WeatherPayload | null;
  loading: boolean;
  error: string | null;
}) {
  const weather = data?.weather;

  return (
    <section className="mirror-fade-in-delay-1">
      <SectionLabel>Weather</SectionLabel>
      {loading && !data ? (
        <p className="text-white/40">Reading skies…</p>
      ) : error && !data ? (
        <p className="text-white/50">Weather unavailable</p>
      ) : weather ? (
        <div>
          <p className="font-display text-[clamp(3rem,6vw,4.5rem)] leading-none tracking-tight text-white tabular-nums">
            {weather.temperatureC}°
          </p>
          <p className="mt-2 text-xl text-white/80">{weather.summary}</p>
          <p className="mt-1 text-sm text-white/45">
            {weather.locationLabel} · H {weather.highC}° · L {weather.lowC}° ·
            feels {weather.feelsLikeC}°
          </p>
        </div>
      ) : null}
      {data?.source === "mock" ? (
        <p className="mt-4 text-[0.7rem] tracking-wide text-white/25">
          Mock weather
        </p>
      ) : data?.source === "live" ? (
        <p className="mt-4 text-[0.7rem] tracking-wide text-white/25">
          Live · Open-Meteo
        </p>
      ) : null}
    </section>
  );
}
