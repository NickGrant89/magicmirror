"use client";

import { Clock } from "@/components/mirror/clock";
import { SectionLabel } from "@/components/mirror/section-label";
import { usePhotoSlideshow } from "@/hooks/use-photo-slideshow";
import { cn } from "@/lib/utils";

/** Full-bleed Echo tab — album slideshow with no file names. */
export function PhotosSlide() {
  const { data, loading, error, photos, current, safeIndex, fade } =
    usePhotoSlideshow();

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
      <div className="grid shrink-0 grid-cols-[1fr_auto] items-end gap-3">
        <div className="min-w-0">
          <SectionLabel>Photos</SectionLabel>
          <p className="mt-1 text-sm text-white/40">
            {data?.source === "live"
              ? "Live album"
              : loading && !data
                ? "Loading album…"
                : error && !data
                  ? "Album unavailable"
                  : data?.note
                    ? "Fallback photos"
                    : "Album"}
            {photos.length > 0 ? ` · ${safeIndex + 1}/${photos.length}` : ""}
          </p>
        </div>
        <div className="origin-bottom-right scale-90 sm:scale-100">
          <Clock />
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/50">
        {current ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.id}
              src={current.url}
              alt=""
              className={cn(
                "absolute inset-0 size-full object-cover transition-opacity duration-500 ease-out",
                fade ? "opacity-100" : "opacity-0",
              )}
            />
            {photos.length > 1 ? (
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {photos.slice(0, 12).map((photo, i) => (
                  <span
                    key={photo.id}
                    className={cn(
                      "size-1.5 rounded-full transition",
                      i === safeIndex % Math.min(photos.length, 12)
                        ? "bg-white"
                        : "bg-white/35",
                    )}
                  />
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-white/45">
            {loading
              ? "Loading album…"
              : error || data?.note || "No photos yet"}
          </div>
        )}
      </div>
    </div>
  );
}
