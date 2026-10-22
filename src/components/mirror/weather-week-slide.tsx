"use client";

import { Clock } from "@/components/mirror/clock";
import { SectionLabel } from "@/components/mirror/section-label";
import { weatherAccent, weatherBadge } from "@/lib/weather-codes";
import type { WeatherPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

function dayLabel(isoDate: string, index: number) {
  if (!isoDate) return index === 0 ? "Today" : `Day ${index + 1}`;
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  const d = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(d);
}

function dayNum(isoDate: string) {
  if (!isoDate) return "";
  const d = new Date(`${isoDate}T12:00:00`);
  return String(d.getDate());
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
            <div
              className={cn(
                "mt-2 rounded-2xl border border-white/10 bg-gradient-to-br px-4 py-3",
                weatherAccent(weather.weatherCode),
              )}
            >
              <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
                <p className="font-display text-5xl leading-none text-white tabular-nums sm:text-6xl">
                  {weather.temperatureC}°
                </p>
                <div className="pb-0.5">
                  <p className="font-display text-lg tracking-wide text-white/90">
                    {weather.summary}
                  </p>
                  <p className="text-sm text-white/50">
                    {weather.locationLabel} · feels {weather.feelsLikeC}° · H{" "}
                    {weather.highC}° · L {weather.lowC}° · wind{" "}
                    {weather.windKph} km/h
                  </p>
                </div>
              </div>
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
          {forecast.slice(0, 7).map((day, i) => {
            const range = Math.max(1, day.highC - day.lowC);
            const bar = Math.min(100, Math.max(18, range * 6));
            return (
              <li
                key={day.date || i}
                className={cn(
                  "relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-b px-1.5 py-2.5 sm:px-2.5",
                  weatherAccent(day.weatherCode),
                  i === 0 ? "ring-1 ring-white/25" : "",
                )}
              >
                <p className="text-center font-display text-[0.65rem] tracking-[0.14em] text-white/70 uppercase sm:text-xs">
                  {dayLabel(day.date, i)}
                </p>
                <p className="mt-0.5 text-center font-display text-lg text-white/90 tabular-nums sm:text-xl">
                  {dayNum(day.date)}
                </p>
                <p className="mt-2 text-center font-display text-[0.7rem] tracking-[0.12em] text-white/80 uppercase">
                  {weatherBadge(day.weatherCode)}
                </p>
                <div className="mt-auto flex flex-col items-center gap-1 pt-3">
                  <div
                    className="w-1.5 rounded-full bg-gradient-to-t from-sky-300/80 to-amber-200/80"
                    style={{ height: `${bar}%`, maxHeight: "3.5rem", minHeight: "0.9rem" }}
                    aria-hidden
                  />
                  <p className="font-display text-xl text-white tabular-nums sm:text-2xl">
                    {day.highC}°
                  </p>
                  <p className="text-sm text-white/45 tabular-nums">{day.lowC}°</p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {data ? (
        <p className="shrink-0 text-[0.55rem] tracking-wide text-white/25">
          {data.source === "live" ? "Live · Open-Meteo" : "Mock forecast"}
        </p>
      ) : null}
    </div>
  );
}
