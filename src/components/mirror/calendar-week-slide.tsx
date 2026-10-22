"use client";

import { useMemo } from "react";
import { Clock } from "@/components/mirror/clock";
import { SectionLabel } from "@/components/mirror/section-label";
import { formatEventTime } from "@/lib/format";
import type { CalendarEvent, CalendarPayload } from "@/lib/types";

function startOfLocalDay(d = new Date()) {
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  return day;
}

function dayLabel(date: Date, index: number) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
}

function dayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function overlapsDay(event: CalendarEvent, dayStart: Date, dayEnd: Date) {
  const s = new Date(event.startsAt).getTime();
  const e = new Date(event.endsAt).getTime();
  return s < dayEnd.getTime() && e > dayStart.getTime();
}

export function CalendarWeekSlide({
  data,
  loading,
  error,
}: {
  data: CalendarPayload | null;
  loading: boolean;
  error: string | null;
}) {
  const columns = useMemo(() => {
    const events = data?.events ?? [];
    const start = startOfLocalDay();
    return Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(start);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const dayEvents = events
        .filter((ev) => overlapsDay(ev, dayStart, dayEnd))
        .slice(0, 5);
      return {
        key: dayKey(dayStart),
        label: dayLabel(dayStart, i),
        dateNum: dayStart.getDate(),
        events: dayEvents,
      };
    });
  }, [data?.events]);

  const total = data?.events?.length ?? 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <div className="grid shrink-0 grid-cols-[1fr_auto] items-end gap-3">
        <div className="min-w-0">
          <SectionLabel>7-day calendar</SectionLabel>
          <p className="mt-1 text-sm text-white/45">
            {loading && !data
              ? "Loading events…"
              : error && !data
                ? "Calendar unavailable"
                : `${total} event${total === 1 ? "" : "s"} this week`}
          </p>
        </div>
        <div className="origin-bottom-right scale-90 sm:scale-100">
          <Clock />
        </div>
      </div>

      <ul className="grid min-h-0 flex-1 grid-cols-7 gap-1.5 sm:gap-2">
        {columns.map((col) => (
          <li
            key={col.key}
            className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/[0.04] px-1.5 py-2 sm:px-2"
          >
            <p className="text-center font-display text-[0.65rem] tracking-[0.12em] text-white/65 uppercase sm:text-xs">
              {col.label}
            </p>
            <p className="mt-0.5 text-center font-display text-lg text-white tabular-nums sm:text-xl">
              {col.dateNum}
            </p>
            <ul className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-hidden">
              {col.events.length === 0 ? (
                <li className="text-center text-[0.6rem] text-white/30">—</li>
              ) : (
                col.events.map((ev) => (
                  <li key={`${ev.id}-${ev.startsAt}`} className="min-w-0">
                    <p className="truncate text-[0.62rem] leading-tight text-white/85 sm:text-[0.7rem]">
                      {ev.title}
                    </p>
                    <p className="truncate text-[0.55rem] text-white/40 tabular-nums">
                      {formatEventTime(ev.startsAt, ev.allDay)}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </li>
        ))}
      </ul>

      {data ? (
        <p className="shrink-0 text-[0.55rem] tracking-wide text-white/25">
          {data.source === "live" ? "Live · iCloud" : "Mock calendar"}
          {data.note ? ` · ${data.note}` : ""}
        </p>
      ) : null}
    </div>
  );
}
