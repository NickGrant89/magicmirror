"use client";

import { useMemo } from "react";
import { CalendarPanel } from "@/components/mirror/calendar-panel";
import { CalendarWeekSlide } from "@/components/mirror/calendar-week-slide";
import { Clock } from "@/components/mirror/clock";
import { CryptoChartSlide } from "@/components/mirror/crypto-chart-slide";
import { CryptoPanel } from "@/components/mirror/crypto-panel";
import { GuestWifiCard } from "@/components/mirror/guest-wifi-card";
import { MirrorAtmosphere } from "@/components/mirror/mirror-atmosphere";
import { NewsPanel } from "@/components/mirror/news-panel";
import { NextEventCountdown } from "@/components/mirror/countdown";
import { PhotoFrame } from "@/components/mirror/photo-frame";
import { PhotoSlideshowProvider } from "@/components/mirror/photo-slideshow-provider";
import { PhotosSlide } from "@/components/mirror/photos-slide";
import { RadioPanel } from "@/components/mirror/radio-panel";
import { WeatherPanel } from "@/components/mirror/weather-panel";
import { WeatherWeekSlide } from "@/components/mirror/weather-week-slide";
import {
  slideBadge,
  useMirrorSlides,
  type MirrorSlide,
} from "@/hooks/use-mirror-slides";
import { usePollingJson } from "@/hooks/use-polling-json";
import type { CryptoChartsPayload } from "@/lib/crypto-charts";
import type {
  CalendarPayload,
  CryptoPayload,
  WeatherPayload,
} from "@/lib/types";
import { cn } from "@/lib/utils";

function formatSlideRemain(ms: number) {
  const totalSec = Math.ceil(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export function MirrorBoard() {
  const calendar = usePollingJson<CalendarPayload>("/api/calendar", 60_000);
  const calendarWeek = usePollingJson<CalendarPayload>(
    "/api/calendar/week",
    60_000,
  );
  const crypto = usePollingJson<CryptoPayload>("/api/crypto", 60_000);
  const charts = usePollingJson<CryptoChartsPayload>(
    "/api/crypto/charts",
    60_000,
  );
  const weather = usePollingJson<WeatherPayload>("/api/weather", 15 * 60_000);

  const slideDefs: MirrorSlide[] = useMemo(() => {
    const chartSlides: MirrorSlide[] = (charts.data?.symbols ?? []).map(
      (s) => ({
        id: `charts-${s.symbol}`,
        kind: "charts" as const,
        symbol: s.symbol,
      }),
    );
    const base: MirrorSlide[] = [
      { id: "home", kind: "home" },
      { id: "photos", kind: "photos" },
      { id: "weather", kind: "weather" },
      { id: "calendar", kind: "calendar" },
    ];
    if (chartSlides.length === 0) {
      return [
        ...base,
        { id: "charts-loading", kind: "charts", symbol: "…" },
      ];
    }
    return [...base, ...chartSlides];
  }, [charts.data?.symbols]);

  const slides = useMirrorSlides(slideDefs);

  const chartSlide =
    slides.slide.kind === "charts" ? slides.slide : null;
  const activeSymbol = chartSlide
    ? (charts.data?.symbols.find((s) => s.symbol === chartSlide.symbol) ?? null)
    : null;

  const weatherCode = weather.data?.weather?.weatherCode;

  return (
    <PhotoSlideshowProvider>
      <div className="mirror-shell relative flex h-dvh max-h-dvh flex-col overflow-hidden px-4 py-3 text-white md:px-6 md:py-4">
        <MirrorAtmosphere weatherCode={weatherCode} />

        <header className="relative z-10 mb-2 flex shrink-0 items-center justify-between gap-3">
          <button
            type="button"
            onClick={slides.goNext}
            className="text-left"
            aria-label="Next mirror screen"
          >
            <p className="font-display text-[0.7rem] tracking-[0.32em] text-white/65 uppercase">
              Magic Mirror
            </p>
          </button>
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden items-center gap-1 sm:flex" aria-hidden>
              {slides.labels.map((label, i) => (
                <button
                  key={`${label}-${i}`}
                  type="button"
                  onClick={() => slides.goTo(i)}
                  className={cn(
                    "rounded-full transition",
                    slides.index === i
                      ? "h-1.5 w-4 bg-white"
                      : "size-1.5 bg-white/30",
                  )}
                  aria-label={`Show ${label}`}
                  title={label}
                />
              ))}
            </div>
            <p className="truncate text-[0.6rem] tracking-[0.14em] text-white/30 uppercase">
              9″ Pi · v16.16 boot · {slideBadge(slides.slide)} ·{" "}
              {formatSlideRemain(slides.remainingMs)}
            </p>
          </div>
        </header>

        <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden">
          <div
            key={slides.slide.id}
            className={cn(
              "flex min-h-0 flex-1 flex-col gap-3",
              slides.animClass,
            )}
          >
            {slides.slide.kind === "home" ? (
              <>
                <section className="grid shrink-0 grid-cols-1 items-end gap-3 sm:grid-cols-[1.2fr_1fr_1.05fr]">
                  <Clock />
                  <div className="min-w-0 border-white/10 sm:border-l sm:pl-4">
                    <RadioPanel compact />
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-white/10 sm:border-l sm:pl-4">
                    <WeatherPanel
                      data={weather.data}
                      loading={weather.loading}
                      error={weather.error}
                      compact
                    />
                    <NextEventCountdown
                      events={calendar.data?.events ?? []}
                      compact
                    />
                  </div>
                </section>

                <div className="h-px w-full shrink-0 bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden sm:grid-cols-[1.15fr_0.95fr_1fr]">
                  <div className="min-h-0 overflow-hidden">
                    <PhotoFrame compact />
                  </div>

                  <div className="flex min-h-0 flex-col justify-start gap-3 overflow-hidden border-white/10 sm:border-l sm:pl-4">
                    <CalendarPanel
                      data={calendar.data}
                      loading={calendar.loading}
                      error={calendar.error}
                      compact
                    />
                    <div className="min-h-0 flex-1 overflow-hidden">
                      <NewsPanel compact />
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-col justify-start gap-2 overflow-hidden border-white/10 sm:border-l sm:pl-4">
                    <GuestWifiCard compact />
                    <CryptoPanel
                      data={crypto.data}
                      loading={crypto.loading}
                      error={crypto.error}
                      compact
                    />
                  </div>
                </section>
              </>
            ) : slides.slide.kind === "photos" ? (
              <PhotosSlide />
            ) : slides.slide.kind === "weather" ? (
              <WeatherWeekSlide
                data={weather.data}
                loading={weather.loading}
                error={weather.error}
              />
            ) : slides.slide.kind === "calendar" ? (
              <CalendarWeekSlide
                data={calendarWeek.data}
                loading={calendarWeek.loading}
                error={calendarWeek.error}
              />
            ) : (
              <CryptoChartSlide
                symbol={activeSymbol}
                loading={charts.loading}
                error={charts.error}
              />
            )}
          </div>
        </main>

        <div
          className="relative z-10 mt-2 h-0.5 w-full overflow-hidden rounded-full bg-white/10"
          aria-hidden
        >
          <div
            className="h-full rounded-full bg-white/70 transition-[width] duration-200 ease-linear"
            style={{ width: `${slides.progress * 100}%` }}
          />
        </div>
      </div>
    </PhotoSlideshowProvider>
  );
}
