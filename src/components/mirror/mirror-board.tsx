"use client";

import { CalendarPanel } from "@/components/mirror/calendar-panel";
import { Clock } from "@/components/mirror/clock";
import { CryptoPanel } from "@/components/mirror/crypto-panel";
import { GuestWifiCard } from "@/components/mirror/guest-wifi-card";
import { MirrorAtmosphere } from "@/components/mirror/mirror-atmosphere";
import { NewsPanel } from "@/components/mirror/news-panel";
import { NextEventCountdown } from "@/components/mirror/countdown";
import { PhotoFrame } from "@/components/mirror/photo-frame";
import { RadioPanel } from "@/components/mirror/radio-panel";
import { WeatherPanel } from "@/components/mirror/weather-panel";
import { usePollingJson } from "@/hooks/use-polling-json";
import type {
  CalendarPayload,
  CryptoPayload,
  WeatherPayload,
} from "@/lib/types";

export function MirrorBoard() {
  const calendar = usePollingJson<CalendarPayload>("/api/calendar", 60_000);
  const crypto = usePollingJson<CryptoPayload>("/api/crypto", 60_000);
  const weather = usePollingJson<WeatherPayload>("/api/weather", 15 * 60_000);

  return (
    <div className="mirror-shell relative flex h-dvh max-h-dvh flex-col overflow-hidden px-4 py-3 text-white md:px-6 md:py-4">
      <MirrorAtmosphere />

      <header className="relative z-10 mb-2 flex shrink-0 items-center justify-between gap-3">
        <p className="font-display text-[0.7rem] tracking-[0.32em] text-white/65 uppercase">
          Magic Mirror
        </p>
        <p className="text-[0.6rem] tracking-[0.18em] text-white/30 uppercase">
          9″ Pi · v16.5 signals
        </p>
      </header>

      <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-3 overflow-hidden">
        {/* Top: clock + radio + glanceables */}
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
      </main>
    </div>
  );
}
