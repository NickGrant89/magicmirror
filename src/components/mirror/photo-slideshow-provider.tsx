"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePollingJson } from "@/hooks/use-polling-json";
import type { AlbumPhoto, PhotosPayload } from "@/lib/types";

const INTERVAL_MS = Number(
  process.env.NEXT_PUBLIC_PHOTO_INTERVAL_MS ?? "12000",
);
const STORAGE_KEY = "magic-mirror.photo-slideshow.v1";

type StoredSlide = {
  index: number;
  photoId?: string;
};

type PhotoSlideshowValue = {
  data: PhotosPayload | null;
  loading: boolean;
  error: string | null;
  photos: AlbumPhoto[];
  current: AlbumPhoto | null;
  safeIndex: number;
  fade: boolean;
};

const PhotoSlideshowContext = createContext<PhotoSlideshowValue | null>(null);

function readStored(): StoredSlide | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSlide;
    if (typeof parsed?.index !== "number" || parsed.index < 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(index: number, photoId?: string) {
  try {
    const payload: StoredSlide = { index, photoId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // private mode / quota — ignore
  }
}

function resolveIndex(photos: AlbumPhoto[], stored: StoredSlide | null): number {
  if (photos.length === 0) return 0;
  if (!stored) return 0;
  if (stored.photoId) {
    const byId = photos.findIndex((p) => p.id === stored.photoId);
    if (byId >= 0) return byId;
  }
  return stored.index % photos.length;
}

export function PhotoSlideshowProvider({ children }: { children: ReactNode }) {
  const { data, loading, error } = usePollingJson<PhotosPayload>(
    "/api/photos",
    2 * 60_000,
  );
  const photos = data?.photos ?? [];
  const albumKey = photos.map((p) => p.id).join("|");
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const photosRef = useRef(photos);
  photosRef.current = photos;

  useEffect(() => {
    const stored = readStored();
    if (stored) setIndex(stored.index);
    setHydrated(true);
  }, []);

  // When album membership changes, prefer remembered photo id
  useEffect(() => {
    if (!hydrated || photos.length === 0) return;
    const stored = readStored();
    const next = resolveIndex(photos, stored);
    setIndex(next);
    writeStored(next, photos[next]?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- albumKey captures membership
  }, [hydrated, albumKey]);

  // Timer lives at provider root so Echo slide changes don't reset progress
  useEffect(() => {
    if (!hydrated) return;
    const id = window.setInterval(() => {
      const list = photosRef.current;
      if (list.length < 2) return;
      setFade(false);
      window.setTimeout(() => {
        setIndex((current) => {
          const next = (current + 1) % list.length;
          writeStored(next, list[next]?.id);
          return next;
        });
        setFade(true);
      }, 420);
    }, Math.max(5000, INTERVAL_MS));
    return () => window.clearInterval(id);
  }, [hydrated]);

  const safeIndex = photos.length ? index % photos.length : 0;
  const value = useMemo<PhotoSlideshowValue>(
    () => ({
      data,
      loading,
      error,
      photos,
      current: photos[safeIndex] ?? null,
      safeIndex,
      fade,
    }),
    [data, loading, error, photos, safeIndex, fade],
  );

  return (
    <PhotoSlideshowContext.Provider value={value}>
      {children}
    </PhotoSlideshowContext.Provider>
  );
}

export function usePhotoSlideshow() {
  const ctx = useContext(PhotoSlideshowContext);
  if (!ctx) {
    throw new Error("usePhotoSlideshow must be used within PhotoSlideshowProvider");
  }
  return ctx;
}
