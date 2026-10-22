"use client";

import { useEffect, useMemo, useState } from "react";

/** Echo Show–style default: rotate screens about every 30s. */
const DEFAULT_INTERVAL_MS = Number(
  process.env.NEXT_PUBLIC_MIRROR_SLIDE_INTERVAL_MS ?? String(30_000),
);

export type MirrorSlide =
  | { id: "home"; kind: "home" }
  | { id: "weather"; kind: "weather" }
  | { id: "calendar"; kind: "calendar" }
  | { id: "photos"; kind: "photos" }
  | { id: string; kind: "charts"; symbol: string };

/**
 * Auto-advances mirror screens with an Echo-style progress fill.
 */
export function useMirrorSlides(
  slides: MirrorSlide[],
  intervalMs = DEFAULT_INTERVAL_MS,
) {
  const list: MirrorSlide[] =
    slides.length > 0 ? slides : [{ id: "home", kind: "home" }];
  const [index, setIndex] = useState(0);
  const [cycleStartedAt, setCycleStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [animClass, setAnimClass] = useState("mirror-echo-enter");

  const safeInterval = Math.max(8_000, intervalMs);
  const safeIndex = ((index % list.length) + list.length) % list.length;
  const slide = list[safeIndex]!;

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    setIndex((current) => current % list.length);
  }, [list.length]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setAnimClass("mirror-echo-exit");
      window.setTimeout(() => {
        setIndex((current) => (current + 1) % list.length);
        setCycleStartedAt(Date.now());
        setAnimClass("mirror-echo-enter");
      }, 420);
    }, safeInterval);
    return () => window.clearInterval(id);
  }, [safeInterval, list.length]);

  const goTo = (next: number) => {
    setAnimClass("mirror-echo-exit");
    window.setTimeout(() => {
      setIndex(((next % list.length) + list.length) % list.length);
      setCycleStartedAt(Date.now());
      setAnimClass("mirror-echo-enter");
    }, 280);
  };

  const elapsed = now - cycleStartedAt;
  const remainingMs = Math.max(0, safeInterval - elapsed);
  const progress = Math.min(1, Math.max(0, elapsed / safeInterval));

  const labels = useMemo(
    () =>
      list.map((s) => {
        if (s.kind === "home") return "Home";
        if (s.kind === "weather") return "Weather";
        if (s.kind === "calendar") return "Calendar";
        if (s.kind === "photos") return "Photos";
        return s.symbol;
      }),
    [list],
  );

  return {
    slide,
    index: safeIndex,
    count: list.length,
    labels,
    animClass,
    remainingMs,
    progress,
    intervalMs: safeInterval,
    goNext: () => goTo(index + 1),
    goTo,
  };
}

export function slideBadge(slide: MirrorSlide): string {
  if (slide.kind === "home") return "home";
  if (slide.kind === "weather") return "weather";
  if (slide.kind === "calendar") return "calendar";
  if (slide.kind === "photos") return "photos";
  return slide.symbol;
}
