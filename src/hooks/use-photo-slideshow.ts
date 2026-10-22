"use client";

import { useEffect, useState } from "react";
import { usePollingJson } from "@/hooks/use-polling-json";
import type { PhotosPayload } from "@/lib/types";

const INTERVAL_MS = Number(
  process.env.NEXT_PUBLIC_PHOTO_INTERVAL_MS ?? "12000",
);

export function usePhotoSlideshow() {
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

  return {
    data,
    loading,
    error,
    photos,
    current: photos[safeIndex] ?? null,
    safeIndex,
    fade,
  };
}
