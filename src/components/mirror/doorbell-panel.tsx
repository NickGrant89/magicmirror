"use client";

import { SectionLabel } from "@/components/mirror/section-label";
import { formatRelativeShort } from "@/lib/format";
import type { DoorbellPayload } from "@/lib/types";

export function DoorbellPanel({
  data,
  loading,
  error,
}: {
  data: DoorbellPayload | null;
  loading: boolean;
  error: string | null;
}) {
  const event = data?.event;

  return (
    <section className="mirror-fade-in-delay-2">
      <SectionLabel>Doorbell</SectionLabel>
      {loading && !data ? (
        <p className="text-white/40">Checking Blink…</p>
      ) : error && !data ? (
        <p className="text-white/50">Blink unavailable</p>
      ) : !event ? (
        <p className="text-white/40">No recent activity</p>
      ) : (
        <div>
          <p className="font-display text-2xl tracking-tight text-white md:text-3xl">
            {event.title}
          </p>
          <p className="mt-2 text-base text-white/75">{event.summary}</p>
          <p className="mt-2 text-sm text-white/40">
            {event.camera} · {formatRelativeShort(event.occurredAt)}
          </p>
        </div>
      )}
      {data?.source === "mock" ? (
        <p className="mt-4 text-[0.7rem] tracking-wide text-white/25">
          Mock · Blink API hook ready
        </p>
      ) : null}
    </section>
  );
}
