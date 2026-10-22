"use client";

import { Clock } from "@/components/mirror/clock";
import { SectionLabel } from "@/components/mirror/section-label";
import type { WeatherPayload } from "@/lib/types";

function dayLabel(isoDate: string, index: number) {
  if (!isoDate) return index === 0 ? "Today" : `Day ${index + 1}`;
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  const d = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(d);
}

export function WeatherWeekSlide({
  data,
  loading,
  error,
}: {
  data: WeatherPayload | null;
  loading: boolean;
  error: string | null;
}) {
  const weather = data?.weather;
  const forecast = weather?.forecast ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <div className="grid shrink-0 grid-cols-[1fr_auto] items-end gap-3">
        <div className="min-w-0">
          <SectionLabel>7-day weather</SectionLabel>
          {weather ? (
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-display text-4xl text-white tabular-nums sm:text-5xl">
                {weather.temperatureC}°
              </p>
              <p className="text-base text-white/75">{weather.summary}</p>
              <p className="text-sm text-white/40">
                {weather.locationLabel} · feels {weather.feelsLikeC}°
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-white/40">
              {loading ? "Reading skies…" : error ?? "Weather unavailable"}
            </p>
          )}
        </div>
        <div className="origin-bottom-right scale-90 sm:scale-100">
          <Clock />
        </div>
      </div>

      {forecast.length > 0 ? (
        <ul className="grid min-h-0 flex-1 grid-cols-7 gap-1.5 sm:gap-2">
          {forecast.slice(0, 7).map((day, i) => (
            <li
              key={day.date || i}
              className="flex min-h-0 flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-1.5 py-2 sm:px-2.5"
            >
              <p className="text-center font-display text-[0.65rem] tracking-[0.12em] text-white/65 uppercase sm:text-xs">
                {dayLabel(day.date, i)}
              </p>
              <p className="mt-2 text-center text-[0.65rem] leading-tight text-white/70 sm:text-sm">
                {day.summary}
              </p>
              <div className="mt-auto pt-2 text-center">
                <p className="font-display text-lg text-white tabular-nums sm:text-2xl">
                  {day.highC}°
                </p>
                <p className="text-[0.7rem] text-white/40 tabular-nums sm:text-sm">
                  {day.lowC}°
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {data ? (
        <p className="shrink-0 text-[0.55rem] tracking-wide text-white/25">
          {data.source === "live" ? "Live · Open-Meteo" : "Mock forecast"} · not
          advice
        </p>
      ) : null}
    </div>
  );
}
