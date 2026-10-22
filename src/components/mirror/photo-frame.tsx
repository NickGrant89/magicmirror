"use client";

import { SectionLabel } from "@/components/mirror/section-label";
import { usePhotoSlideshow } from "@/hooks/use-photo-slideshow";
import { cn } from "@/lib/utils";

export function PhotoFrame({ compact = false }: { compact?: boolean }) {
  const { data, loading, error, photos, current, safeIndex, fade } =
    usePhotoSlideshow();

  return (
    <section className="mirror-fade-in-delay-2 flex h-full min-h-0 flex-col">
      <div className="flex items-baseline justify-between gap-2">
        <SectionLabel compact={compact}>Photos</SectionLabel>
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
              alt=""
              className={cn(
                "absolute inset-0 size-full object-contain object-center transition-opacity duration-500 ease-out",
                fade ? "opacity-100" : "opacity-0",
              )}
            />
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
    </section>
  );
}
