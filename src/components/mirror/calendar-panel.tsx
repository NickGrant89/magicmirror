"use client";

import { SectionLabel } from "@/components/mirror/section-label";
import { formatEventTime, formatRelativeShort } from "@/lib/format";
import type { CalendarPayload } from "@/lib/types";

export function CalendarPanel({
  data,
  loading,
  error,
  compact = false,
}: {
  data: CalendarPayload | null;
  loading: boolean;
  error: string | null;
  compact?: boolean;
}) {
  const events = data?.events ?? [];

  return (
    <section className="mirror-fade-in-delay-2 min-h-0">
      <div className="flex items-baseline justify-between gap-2">
        <SectionLabel compact={compact}>Today</SectionLabel>
        {events.length > 0 ? (
          <p className="text-[0.6rem] tracking-[0.12em] text-white/30 uppercase">
            {events.length} event{events.length === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>
      {loading && !data ? (
        <p className="text-sm text-white/40">Loading events…</p>
      ) : error && !data ? (
        <p className="text-sm text-white/50">Calendar unavailable</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-white/40">Clear day</p>
      ) : (
        <ul
          className={
            compact
              ? "max-h-[11rem] space-y-2 overflow-y-auto pr-1"
              : "space-y-4"
          }
        >
          {events.map((event) => (
            <li key={`${event.id}-${event.startsAt}`} className="min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p
                  className={
                    compact
                      ? "truncate text-sm text-white/90"
                      : "truncate text-lg text-white/90 md:text-xl"
                  }
                >
                  {event.title}
                </p>
                <p className="shrink-0 text-[0.7rem] text-white/40 tabular-nums sm:text-sm">
                  {formatRelativeShort(event.startsAt)}
                </p>
              </div>
              <p
                className={
                  compact
                    ? "text-[0.7rem] text-white/45"
                    : "mt-0.5 text-sm text-white/45"
                }
              >
                {formatEventTime(event.startsAt, event.allDay)}
                {!compact && event.location ? ` · ${event.location}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
      {!compact && data?.source === "mock" ? (
        <p className="mirror-footnote mt-4 text-[0.7rem] tracking-wide text-white/25">
          Mock · Apple CalDAV hook ready
        </p>
      ) : null}
    </section>
  );
}
