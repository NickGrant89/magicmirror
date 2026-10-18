"use client";

import { SectionLabel } from "@/components/mirror/section-label";
import { usePollingJson } from "@/hooks/use-polling-json";
import type { NewsPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NewsPanel({ compact = false }: { compact?: boolean }) {
  const { data, loading, error } = usePollingJson<NewsPayload>(
    "/api/news",
    10 * 60_000,
  );
  const items = data?.items ?? [];

  return (
    <section className="mirror-fade-in-delay-3 min-h-0">
      <div className="flex items-baseline justify-between gap-2">
        <SectionLabel compact={compact}>News</SectionLabel>
        {data?.feedTitle ? (
          <p className="truncate text-[0.6rem] tracking-[0.12em] text-white/30 uppercase">
            {data.feedTitle}
          </p>
        ) : null}
      </div>

      {loading && !data ? (
        <p className="text-sm text-white/40">Loading headlines…</p>
      ) : error && !data ? (
        <p className="text-sm text-white/50">News unavailable</p>
      ) : (
        <ul className={cn(compact ? "space-y-1.5" : "space-y-2.5")}>
          {items.map((item) => (
            <li key={item.id} className="min-w-0">
              <p
                className={cn(
                  "line-clamp-2 leading-snug text-white/85",
                  compact ? "text-[0.75rem]" : "text-sm",
                )}
              >
                {item.title}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
