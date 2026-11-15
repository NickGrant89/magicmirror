"use client";

import { SectionLabel } from "@/components/mirror/section-label";
import { WeatherGlyph } from "@/components/mirror/weather-glyph";
import { weatherAccent } from "@/lib/weather-codes";
import type { WeatherPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

function Metric({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p
        className={cn(
          "tracking-[0.14em] text-white/40 uppercase",
          compact ? "text-[0.5rem]" : "text-[0.55rem]",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "font-display text-white/90 tabular-nums",
          compact ? "text-[0.82rem] leading-tight" : "text-base",
        )}
      >
        {value}
      </p>
    </div>
  );
}

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
  const tomorrow = weather?.forecast?.[1];

  return (
    <section className="mirror-fade-in-delay-1 min-w-0">
      <SectionLabel compact={compact}>Weather</SectionLabel>
      {loading && !data ? (
        <p className="text-sm text-white/40">Reading skies…</p>
      ) : error && !data ? (
        <p className="text-sm text-white/50">Weather unavailable</p>
      ) : weather ? (
        <div
          className={cn(
            "rounded-2xl border border-white/12 bg-gradient-to-br shadow-[inset_0_1px_0_rgb(255_255_255_/_8%)]",
            weatherAccent(weather.weatherCode),
            compact ? "mt-0.5 px-2 py-1.5" : "mt-1 px-3 py-2.5",
          )}
        >
          {compact ? (
            <>
              <div className="flex items-end gap-1.5">
                <WeatherGlyph
                  code={weather.weatherCode}
                  className="mb-0.5 size-7"
                />
                <p className="font-display text-[clamp(1.7rem,4.6vw,2.3rem)] leading-none tracking-tight text-white tabular-nums">
                  {weather.temperatureC}°
                </p>
              </div>
              <p className="mt-1 truncate text-[0.8rem] leading-tight text-white/90">
                {weather.summary}
                <span className="text-white/45"> · {weather.locationLabel}</span>
              </p>
              <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1">
                <Metric compact label="Feels" value={`${weather.feelsLikeC}°`} />
                <Metric
                  compact
                  label="High / low"
                  value={`${weather.highC}°/${weather.lowC}°`}
                />
                <Metric compact label="Wind" value={`${weather.windKph} kph`} />
                <Metric
                  compact
                  label="Rain"
                  value={
                    weather.precipChancePct != null
                      ? `${weather.precipChancePct}%`
                      : weather.humidityPct != null
                        ? `${weather.humidityPct}% rh`
                        : "—"
                  }
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <WeatherGlyph
                  code={weather.weatherCode}
                  className="size-12"
                />
                <p className="font-display text-[clamp(3rem,6vw,4.5rem)] leading-none tracking-tight text-white tabular-nums">
                  {weather.temperatureC}°
                </p>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl tracking-wide text-white/90">
                    {weather.summary}
                  </p>
                  <p className="truncate text-sm text-white/45">
                    {weather.locationLabel}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <Metric label="Feels" value={`${weather.feelsLikeC}°`} />
                <Metric
                  label="High / low"
                  value={`${weather.highC}° / ${weather.lowC}°`}
                />
                <Metric label="Wind" value={`${weather.windKph} km/h`} />
                <Metric
                  label="Rain"
                  value={
                    weather.precipChancePct != null
                      ? `${weather.precipChancePct}%`
                      : "—"
                  }
                />
              </div>
              {weather.humidityPct != null || weather.uvIndex != null ? (
                <p className="mt-2 text-sm text-white/45">
                  {weather.humidityPct != null
                    ? `Humidity ${weather.humidityPct}%`
                    : ""}
                  {weather.humidityPct != null && weather.uvIndex != null
                    ? " · "
                    : ""}
                  {weather.uvIndex != null ? `UV ${weather.uvIndex}` : ""}
                </p>
              ) : null}
              {tomorrow ? (
                <p className="mt-2 truncate text-sm text-white/50">
                  Tomorrow {tomorrow.summary} {tomorrow.highC}° / {tomorrow.lowC}°
                  {tomorrow.precipChancePct != null
                    ? ` · ${tomorrow.precipChancePct}% rain`
                    : ""}
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
