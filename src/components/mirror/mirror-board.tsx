"use client";

import { CalendarPanel } from "@/components/mirror/calendar-panel";
import { Clock } from "@/components/mirror/clock";
import { CryptoPanel } from "@/components/mirror/crypto-panel";
import { DoorbellPanel } from "@/components/mirror/doorbell-panel";
import { GuestWifiCard } from "@/components/mirror/guest-wifi-card";
import { MirrorAtmosphere } from "@/components/mirror/mirror-atmosphere";
import { NextEventCountdown } from "@/components/mirror/countdown";
import { PhotoFrame } from "@/components/mirror/photo-frame";
import { RadioPanel } from "@/components/mirror/radio-panel";
import { TasksPanel } from "@/components/mirror/tasks-panel";
import { WeatherPanel } from "@/components/mirror/weather-panel";
import { usePollingJson } from "@/hooks/use-polling-json";
import type {
  CalendarPayload,
  CryptoPayload,
  DoorbellPayload,
  TasksPayload,
  WeatherPayload,
} from "@/lib/types";

export function MirrorBoard() {
  const calendar = usePollingJson<CalendarPayload>("/api/calendar", 60_000);
  const tasks = usePollingJson<TasksPayload>("/api/tasks", 60_000);
  const blink = usePollingJson<DoorbellPayload>("/api/blink", 45_000);
  const crypto = usePollingJson<CryptoPayload>("/api/crypto", 60_000);
  const weather = usePollingJson<WeatherPayload>("/api/weather", 15 * 60_000);

  return (
    <div className="mirror-shell relative flex h-dvh max-h-dvh flex-col overflow-hidden px-3 py-2 text-white sm:px-4 sm:py-3 md:px-5 md:py-3">
      <MirrorAtmosphere />

      <header className="relative z-10 flex shrink-0 items-center justify-between gap-3">
        <p className="font-display text-[0.65rem] tracking-[0.28em] text-white/70 uppercase sm:text-xs sm:tracking-[0.32em]">
          Magic Mirror
        </p>
        <p className="text-[0.6rem] tracking-[0.16em] text-white/35 uppercase">
          9″ Pi
        </p>
      </header>

      <main className="relative z-10 mx-auto grid min-h-0 w-full max-w-6xl flex-1 grid-rows-[auto_minmax(0,1fr)] gap-2 py-1 sm:gap-2.5">
        <section className="grid shrink-0 items-center gap-2 sm:grid-cols-[1.25fr_1fr] sm:gap-3">
          <Clock />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-2">
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

        <section className="grid min-h-0 grid-cols-2 gap-2 overflow-hidden sm:grid-cols-3 sm:gap-3">
          <div className="flex min-h-0 flex-col">
            <PhotoFrame compact />
          </div>

          <div className="min-h-0 space-y-2 overflow-y-auto overscroll-contain pr-0.5 sm:space-y-2.5">
            <CalendarPanel
              data={calendar.data}
              loading={calendar.loading}
              error={calendar.error}
              compact
            />
            <TasksPanel
              data={tasks.data}
              loading={tasks.loading}
              error={tasks.error}
              compact
            />
            <DoorbellPanel
              data={blink.data}
              loading={blink.loading}
              error={blink.error}
              compact
            />
          </div>

          <div className="col-span-2 min-h-0 space-y-2 overflow-y-auto overscroll-contain pr-0.5 sm:col-span-1 sm:space-y-2.5">
            <GuestWifiCard compact />
            <RadioPanel compact />
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
