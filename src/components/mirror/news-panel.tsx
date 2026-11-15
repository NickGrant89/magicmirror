"use client";

import { SectionLabel } from "@/components/mirror/section-label";
import { usePollingJson } from "@/hooks/use-polling-json";
import type { NewsPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

function tagTone(tag?: string) {
  const key = (tag ?? "").toLowerCase();
  if (key.includes("crypto")) return "bg-amber-300/15 text-amber-100/90";
  if (key.includes("tech")) return "bg-sky-300/15 text-sky-100/90";
  return "bg-white/10 text-white/70";
}

export function NewsPanel({ compact = false }: { compact?: boolean }) {
  const { data, loading, error } = usePollingJson<NewsPayload>(
    "/api/news",
    10 * 60_000,
  );
  const items = data?.items ?? [];

  return (
    <section className="mirror-fade-in-delay-3 flex h-full min-h-0 flex-col">
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
        <ul
          className={cn(
            "mirror-glass min-h-0 flex-1 overflow-y-auto rounded-2xl",
            compact ? "space-y-0 px-2.5 py-2" : "space-y-0 px-3 py-3",
          )}
        >
          {items.map((item, i) => (
            <li
              key={item.id}
              className={cn(
                "min-w-0",
                i > 0 && "border-t border-white/10 pt-1.5",
                compact ? "py-1" : "py-1.5",
              )}
            >
              <div className="flex items-start gap-1.5">
                {item.tag ? (
                  <span
                    className={cn(
                      "mt-0.5 shrink-0 rounded-full px-1.5 py-px text-[0.52rem] tracking-[0.12em] uppercase",
                      tagTone(item.tag),
                    )}
                  >
                    {item.tag}
                  </span>
                ) : null}
                <p
                  className={cn(
                    "min-w-0 leading-snug text-white/88",
                    compact
                      ? i === 0
                        ? "line-clamp-2 text-[0.8rem]"
                        : "line-clamp-2 text-[0.72rem] text-white/75"
                      : "line-clamp-2 text-sm",
                  )}
                >
                  {item.title}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
