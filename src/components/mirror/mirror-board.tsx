"use client";

import { CalendarPanel } from "@/components/mirror/calendar-panel";
import { Clock } from "@/components/mirror/clock";
import { CryptoPanel } from "@/components/mirror/crypto-panel";
import { DoorbellPanel } from "@/components/mirror/doorbell-panel";
import { NextEventCountdown } from "@/components/mirror/countdown";
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
    <div className="relative flex min-h-dvh flex-col px-6 py-8 text-white md:px-12 md:py-10 lg:px-16">
      <header className="flex items-end justify-between gap-6">
        <p className="font-display text-sm tracking-[0.35em] text-white/55 uppercase">
          Magic Mirror
        </p>
        <p className="hidden text-xs tracking-[0.2em] text-white/25 uppercase sm:block">
          Wall display
        </p>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-12 py-10 lg:gap-16">
        <Clock />

        <div className="grid gap-10 md:grid-cols-2 md:gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="space-y-10 lg:space-y-12">
            <NextEventCountdown events={calendar.data?.events ?? []} />
            <CalendarPanel
              data={calendar.data}
              loading={calendar.loading}
              error={calendar.error}
            />
            <TasksPanel
              data={tasks.data}
              loading={tasks.loading}
              error={tasks.error}
            />
          </div>

          <div className="space-y-10 lg:space-y-12">
            <WeatherPanel
              data={weather.data}
              loading={weather.loading}
              error={weather.error}
            />
            <DoorbellPanel
              data={blink.data}
              loading={blink.loading}
              error={blink.error}
            />
            <CryptoPanel
              data={crypto.data}
              loading={crypto.loading}
              error={crypto.error}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
