"use client";

import { useMemo } from "react";
import { Clock } from "@/components/mirror/clock";
import { SectionLabel } from "@/components/mirror/section-label";
import { formatEventTime } from "@/lib/format";
import type { CalendarEvent, CalendarPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

function startOfLocalDay(d = new Date()) {
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  return day;
}

function dayLabel(date: Date, index: number) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(date);
}

function dayShort(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
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
        .slice(0, 6);
      return {
        key: dayStart.toISOString(),
        index: i,
        label: dayLabel(dayStart, i),
        short: dayShort(dayStart),
        events: dayEvents,
      };
    });
  }, [data?.events]);

  const today = columns[0];
  const rest = columns.slice(1);
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
                : data?.source === "live"
                  ? `${total} event${total === 1 ? "" : "s"} · iCloud`
                  : `${total} event${total === 1 ? "" : "s"} · demo data (set Apple ID on Pi for live)`}
          </p>
        </div>
        <div className="origin-bottom-right scale-90 sm:scale-100">
          <Clock />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden sm:grid-cols-[1.15fr_1.85fr]">
        {/* Today — large */}
        <section className="flex min-h-0 flex-col rounded-2xl border border-white/15 bg-gradient-to-b from-white/10 to-white/[0.03] px-3 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-display text-xl text-white">{today?.label}</p>
            <p className="text-sm text-white/45">{today?.short}</p>
          </div>
          <ul className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {(today?.events.length ?? 0) === 0 ? (
              <li className="text-sm text-white/40">Nothing scheduled</li>
            ) : (
              today?.events.map((ev) => (
                <li
                  key={`${ev.id}-${ev.startsAt}`}
                  className="rounded-xl border border-white/10 bg-black/20 px-2.5 py-2"
                >
                  <p className="truncate text-base text-white/90">{ev.title}</p>
                  <p className="mt-0.5 text-sm text-white/45 tabular-nums">
                    {formatEventTime(ev.startsAt, ev.allDay)}
                    {ev.location ? ` · ${ev.location}` : ""}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Rest of week */}
        <ul className="grid min-h-0 grid-cols-2 gap-2 overflow-hidden sm:grid-cols-3">
          {rest.map((col) => (
            <li
              key={col.key}
              className={cn(
                "flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/[0.04] px-2.5 py-2",
              )}
            >
              <p className="font-display text-sm tracking-wide text-white/80">
                {col.label}
              </p>
              <p className="text-[0.7rem] text-white/40">{col.short}</p>
              <ul className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-hidden">
                {col.events.length === 0 ? (
                  <li className="text-[0.7rem] text-white/30">Clear</li>
                ) : (
                  col.events.map((ev) => (
                    <li key={`${ev.id}-${ev.startsAt}`} className="min-w-0">
                      <p className="truncate text-[0.8rem] leading-tight text-white/85">
                        {ev.title}
                      </p>
                      <p className="truncate text-[0.65rem] text-white/40 tabular-nums">
                        {formatEventTime(ev.startsAt, ev.allDay)}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      {data?.note ? (
        <p className="shrink-0 truncate text-[0.55rem] tracking-wide text-white/25">
          {data.note}
        </p>
      ) : null}
    </div>
  );
}
