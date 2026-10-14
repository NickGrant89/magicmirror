"use client";

import { SectionLabel } from "@/components/mirror/section-label";
import { formatEventTime, formatRelativeShort } from "@/lib/format";
import type { CalendarPayload } from "@/lib/types";

export function CalendarPanel({
  data,
  loading,
  error,
}: {
  data: CalendarPayload | null;
  loading: boolean;
  error: string | null;
}) {
  const events = data?.events?.slice(0, 4) ?? [];

  return (
    <section className="mirror-fade-in-delay-2">
      <SectionLabel>Calendar</SectionLabel>
      {loading && !data ? (
        <p className="text-white/40">Loading events…</p>
      ) : error && !data ? (
        <p className="text-white/50">Calendar unavailable</p>
      ) : events.length === 0 ? (
        <p className="text-white/40">No upcoming events</p>
      ) : (
        <ul className="space-y-4">
          {events.map((event) => (
            <li key={event.id} className="min-w-0">
              <div className="flex items-baseline justify-between gap-4">
                <p className="truncate text-lg text-white/90 md:text-xl">
                  {event.title}
                </p>
                <p className="shrink-0 text-sm text-white/40 tabular-nums">
                  {formatRelativeShort(event.startsAt)}
                </p>
              </div>
              <p className="mt-0.5 text-sm text-white/45">
                {formatEventTime(event.startsAt, event.allDay)}
                {event.location ? ` · ${event.location}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
      {data?.source === "mock" ? (
        <p className="mt-4 text-[0.7rem] tracking-wide text-white/25">
          Mock · Apple CalDAV hook ready
        </p>
      ) : null}
    </section>
  );
}
