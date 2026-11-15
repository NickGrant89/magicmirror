"use client";

import { useMemo, useSyncExternalStore } from "react";
import { SectionLabel } from "@/components/mirror/section-label";
import { formatCountdown, formatEventTime } from "@/lib/format";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

function subscribe(onStoreChange: () => void) {
  const id = setInterval(onStoreChange, 30_000);
  return () => clearInterval(id);
}

function getSnapshot() {
  return Math.floor(Date.now() / 30_000);
}

function getServerSnapshot() {
  return 0;
}

export function NextEventCountdown({
  events,
  compact = false,
}: {
  events: CalendarEvent[];
  compact?: boolean;
}) {
  const tick = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const now = useMemo(
    () => (tick > 0 ? new Date(tick * 30_000) : null),
    [tick],
  );

  const next = useMemo(() => {
    if (!now) return undefined;
    return [...events]
      .filter((event) => new Date(event.startsAt).getTime() >= now.getTime())
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      )[0];
  }, [events, now]);

  return (
    <section className="mirror-fade-in-delay-1 min-w-0">
      <SectionLabel compact={compact}>Up next</SectionLabel>
      <div
        className={cn(
          "mirror-glass rounded-2xl",
          compact ? "px-2 py-1.5" : "px-3 py-2.5",
        )}
      >
        {!now ? (
          <div
            className={compact ? "h-8 w-24 rounded bg-white/5" : "h-12 w-40 rounded bg-white/5"}
            aria-hidden
          />
        ) : !next ? (
          <p
            className={
              compact
                ? "font-display text-xl text-white/80"
                : "font-display text-3xl text-white/80 md:text-4xl"
            }
          >
            Clear
          </p>
        ) : (
          <>
            <p
              className={
                compact
                  ? "font-display text-[clamp(1.5rem,3.8vw,2.1rem)] leading-none tracking-tight text-white"
                  : "font-display text-[clamp(2.4rem,5vw,3.6rem)] leading-none tracking-tight text-white"
              }
            >
              {formatCountdown(next.startsAt, now)}
            </p>
            <p
              className={
                compact
                  ? "mt-1 line-clamp-2 text-[0.78rem] leading-tight text-white/85"
                  : "mt-3 text-lg text-white/85 md:text-xl"
              }
            >
              {next.title}
            </p>
            {!compact ? (
              <p className="mt-1 text-sm text-white/45">
                {formatEventTime(next.startsAt, next.allDay)}
                {next.location ? ` · ${next.location}` : ""}
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
