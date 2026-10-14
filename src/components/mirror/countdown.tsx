"use client";

import { useMemo, useSyncExternalStore } from "react";
import { SectionLabel } from "@/components/mirror/section-label";
import { formatCountdown, formatEventTime } from "@/lib/format";
import type { CalendarEvent } from "@/lib/types";

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

export function NextEventCountdown({ events }: { events: CalendarEvent[] }) {
  const tick = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const now = tick > 0 ? new Date(tick * 30_000) : null;

  const next = useMemo(() => {
    if (!now) return undefined;
    return [...events]
      .filter((event) => new Date(event.startsAt).getTime() >= now.getTime())
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      )[0];
  }, [events, now]);

  if (!now) {
    return (
      <section className="mirror-fade-in-delay-1" aria-hidden>
        <SectionLabel>Up next</SectionLabel>
        <div className="h-12 w-40 rounded bg-white/5" />
      </section>
    );
  }

  if (!next) {
    return (
      <section className="mirror-fade-in-delay-1">
        <SectionLabel>Up next</SectionLabel>
        <p className="font-display text-3xl text-white/80 md:text-4xl">
          Clear schedule
        </p>
        <p className="mt-2 text-sm text-white/40">No upcoming events</p>
      </section>
    );
  }

  return (
    <section className="mirror-fade-in-delay-1">
      <SectionLabel>Up next</SectionLabel>
      <p className="mirror-pulse font-display text-[clamp(2.4rem,5vw,3.6rem)] leading-none tracking-tight text-white">
        {formatCountdown(next.startsAt, now)}
      </p>
      <p className="mt-3 text-lg text-white/85 md:text-xl">{next.title}</p>
      <p className="mt-1 text-sm text-white/45">
        {formatEventTime(next.startsAt, next.allDay)}
        {next.location ? ` · ${next.location}` : ""}
      </p>
    </section>
  );
}
