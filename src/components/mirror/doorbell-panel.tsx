"use client";

import { SectionLabel } from "@/components/mirror/section-label";
import { formatRelativeShort } from "@/lib/format";
import type { DoorbellPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DoorbellPanel({
  data,
  loading,
  error,
  compact = false,
  className,
}: {
  data: DoorbellPayload | null;
  loading: boolean;
  error: string | null;
  compact?: boolean;
  className?: string;
}) {
  const event = data?.event;

  return (
    <section className={cn("mirror-fade-in-delay-2", className)}>
      <SectionLabel compact={compact}>Doorbell</SectionLabel>
      {loading && !data ? (
        <p className="text-sm text-white/40">Checking Blink…</p>
      ) : error && !data ? (
        <p className="text-sm text-white/50">Blink unavailable</p>
      ) : !event ? (
        <p className="text-sm text-white/40">No recent activity</p>
      ) : (
        <div>
          <p
            className={
              compact
                ? "truncate font-display text-base tracking-tight text-white"
                : "font-display text-2xl tracking-tight text-white md:text-3xl"
            }
          >
            {event.title}
          </p>
          <p
            className={
              compact
                ? "mt-0.5 line-clamp-2 text-[0.75rem] text-white/75"
                : "mt-2 text-base text-white/75"
            }
          >
            {event.summary}
          </p>
          <p className={compact ? "mt-0.5 text-[0.7rem] text-white/40" : "mt-2 text-sm text-white/40"}>
            {event.camera} · {formatRelativeShort(event.occurredAt)}
          </p>
        </div>
      )}
      {!compact && data?.source === "mock" ? (
        <p className="mirror-footnote mt-4 text-[0.7rem] tracking-wide text-white/25">
          Mock · Blink API hook ready
        </p>
      ) : null}
    </section>
  );
}
