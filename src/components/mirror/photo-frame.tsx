"use client";

import { useEffect, useState } from "react";
import { SectionLabel } from "@/components/mirror/section-label";
import { usePollingJson } from "@/hooks/use-polling-json";
import { cn } from "@/lib/utils";
import type { PhotosPayload } from "@/lib/types";

const INTERVAL_MS = Number(
  process.env.NEXT_PUBLIC_PHOTO_INTERVAL_MS ?? "12000",
);

export function PhotoFrame({ compact = false }: { compact?: boolean }) {
  const { data, loading, error } = usePollingJson<PhotosPayload>(
    "/api/photos",
    2 * 60_000,
  );
  const photos = data?.photos ?? [];
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const safeIndex = photos.length ? index % photos.length : 0;

  useEffect(() => {
    if (photos.length < 2) return;
    const id = setInterval(() => {
      setFade(false);
      window.setTimeout(() => {
        setIndex((current) => current + 1);
        setFade(true);
      }, 420);
    }, Math.max(5000, INTERVAL_MS));
    return () => clearInterval(id);
  }, [photos.length]);

  const current = photos[safeIndex];

  return (
    <section className="mirror-fade-in-delay-2 flex h-full min-h-0 flex-col">
      <div className="flex items-baseline justify-between gap-2">
        <SectionLabel compact={compact}>Photos</SectionLabel>
        {data?.albumName ? (
          <p className="truncate text-[0.65rem] tracking-[0.12em] text-white/35 uppercase">
            {data.albumName}
          </p>
        ) : null}
      </div>

      <div
        className={cn(
          "relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[inset_0_0_0_1px_rgb(255_255_255_/_4%)]",
          compact ? "min-h-0" : "min-h-[14rem]",
        )}
      >
        {loading && !data ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/40">
            Loading album…
          </div>
        ) : error && !data ? (
          <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-sm text-white/50">
            Photo album unavailable
          </div>
        ) : current ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.id}
              src={current.url}
              alt={current.caption ?? data?.albumName ?? "Album photo"}
              className={cn(
                "absolute inset-0 size-full object-cover transition-opacity duration-500 ease-out",
                fade ? "opacity-100" : "opacity-0",
              )}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-3 pb-2.5 pt-8">
              <div className="flex items-end justify-between gap-2">
                <p className="truncate text-xs text-white/80">
                  {current.caption ?? data?.albumName}
                </p>
                {photos.length > 1 ? (
                  <p className="shrink-0 text-[0.65rem] tabular-nums text-white/45">
                    {safeIndex + 1}/{photos.length}
                  </p>
                ) : null}
              </div>
            </div>
            {photos.length > 1 ? (
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                {photos.slice(0, 8).map((photo, i) => (
                  <span
                    key={photo.id}
                    className={cn(
                      "size-1 rounded-full transition",
                      i === safeIndex % Math.min(photos.length, 8)
                        ? "bg-white"
                        : "bg-white/30",
                    )}
                  />
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/40">
            No photos yet
          </div>
        )}
      </div>

      {data?.source === "mock" ? (
        <p className="mirror-footnote mt-1.5 text-[0.65rem] tracking-wide text-white/25">
          Mock · Apple Shared Album hook ready
        </p>
      ) : data?.source === "live" ? (
        <p className="mirror-footnote mt-1.5 text-[0.65rem] tracking-wide text-white/25">
          Live · iCloud Shared Album
        </p>
      ) : null}
    </section>
  );
}
