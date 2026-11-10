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
  if (index === 1) return "Tom";
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
}

function dayNum(date: Date) {
  return String(date.getDate());
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
        .sort(
          (a, b) =>
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        );
      return {
        key: dayStart.toISOString(),
        index: i,
        label: dayLabel(dayStart, i),
        num: dayNum(dayStart),
        events: dayEvents,
      };
    });
  }, [data?.events]);

  const total = data?.events?.length ?? 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5 overflow-hidden">
      <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
        <div className="min-w-0">
          <SectionLabel compact>7-day calendar</SectionLabel>
          <p className="truncate text-[0.7rem] text-white/45">
            {loading && !data
              ? "Loading events…"
              : error && !data
                ? "Calendar unavailable"
                : data?.source === "live"
                  ? `${total} event${total === 1 ? "" : "s"} · iCloud`
                  : `${total} event${total === 1 ? "" : "s"} · demo`}
          </p>
        </div>
        <Clock compact />
      </div>

      <ul className="calendar-week-grid min-h-0 flex-1 overflow-hidden">
        {columns.map((col) => (
          <li
            key={col.key}
            className={cn(
              "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border bg-white/[0.04] px-1.5 py-1.5",
              col.index === 0
                ? "border-white/20 bg-gradient-to-b from-white/10 to-white/[0.03]"
                : "border-white/10",
            )}
          >
            <div className="flex shrink-0 items-baseline justify-between gap-1">
              <p className="font-display text-[0.7rem] tracking-wide text-white/85">
                {col.label}
              </p>
              <p className="text-[0.65rem] text-white/40 tabular-nums">
                {col.num}
                {col.events.length > 0 ? ` · ${col.events.length}` : ""}
              </p>
            </div>
            <ul className="mirror-scroll mt-1 min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5">
              {col.events.length === 0 ? (
                <li className="text-[0.65rem] text-white/30">Clear</li>
              ) : (
                col.events.map((ev) => (
                  <li
                    key={`${ev.id}-${ev.startsAt}`}
                    className={cn(
                      "min-w-0",
                      col.index === 0 &&
                        "rounded-lg border border-white/10 bg-black/20 px-1.5 py-1",
                    )}
                  >
                    <p className="break-words text-[0.72rem] leading-tight text-white/90">
                      {ev.title}
                    </p>
                    <p className="break-words text-[0.6rem] leading-tight text-white/40 tabular-nums">
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
  );
}
