"use client";

import { useEffect, useState } from "react";
import { Clock } from "@/components/mirror/clock";
import { SectionLabel } from "@/components/mirror/section-label";
import { usePhotoSlideshow } from "@/hooks/use-photo-slideshow";
import { cn } from "@/lib/utils";

/** Full-bleed Echo tab — album slideshow with no file names. */
export function PhotosSlide() {
  const { data, loading, error, photos, current, safeIndex, fade } =
    usePhotoSlideshow();
  const [imgBroken, setImgBroken] = useState(false);

  useEffect(() => {
    setImgBroken(false);
  }, [current?.id, current?.url]);

  const showImage = Boolean(current && !imgBroken);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 px-1 pt-0.5">
        <div className="min-w-0 rounded-xl bg-black/35 px-2.5 py-1.5 backdrop-blur-sm">
          <SectionLabel>Photos</SectionLabel>
          <p className="mt-0.5 text-[0.7rem] text-white/55">
            {data?.source === "live"
              ? data.albumName || "Live album"
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
        <div className="rounded-xl bg-black/35 px-2 py-1 backdrop-blur-sm">
          <div className="origin-top-right scale-90">
            <Clock />
          </div>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/60">
        {showImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.id}
              src={current.url}
              alt=""
              onError={() => setImgBroken(true)}
              onLoad={() => setImgBroken(false)}
              className={cn(
                "absolute inset-0 size-full object-cover transition-opacity duration-500 ease-out",
                fade ? "opacity-100" : "opacity-0",
              )}
            />
            {photos.length > 1 ? (
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/40 px-2 py-1.5">
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
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <div>
              <p className="font-display text-lg text-white/70">
                {loading ? "Loading album…" : "Photos unavailable"}
              </p>
              <p className="mt-2 max-w-md text-sm text-white/40">
                {error ||
                  data?.note ||
                  "Check APPLE_SHARED_ALBUM_URL on the Pi, or re-run the GitHub recover script."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
