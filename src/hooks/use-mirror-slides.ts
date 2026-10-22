"use client";

import { useEffect, useState } from "react";

const DEFAULT_INTERVAL_MS = Number(
  process.env.NEXT_PUBLIC_MIRROR_SLIDE_INTERVAL_MS ?? String(15 * 60_000),
);

export const MIRROR_SLIDES = ["home", "signals"] as const;
export type MirrorSlideId = (typeof MIRROR_SLIDES)[number];

/**
 * Auto-advances between mirror menus (home ↔ signals).
 * Default interval: 15 minutes.
 */
export function useMirrorSlides(intervalMs = DEFAULT_INTERVAL_MS) {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [cycleStartedAt, setCycleStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  const safeInterval = Math.max(30_000, intervalMs);
  const slide = MIRROR_SLIDES[index % MIRROR_SLIDES.length];

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFade(false);
      window.setTimeout(() => {
        setIndex((current) => (current + 1) % MIRROR_SLIDES.length);
        setCycleStartedAt(Date.now());
        setFade(true);
      }, 480);
    }, safeInterval);
    return () => window.clearInterval(id);
  }, [safeInterval]);

  const goTo = (next: number) => {
    setFade(false);
    window.setTimeout(() => {
      setIndex(((next % MIRROR_SLIDES.length) + MIRROR_SLIDES.length) % MIRROR_SLIDES.length);
      setCycleStartedAt(Date.now());
      setFade(true);
    }, 280);
  };

  const remainingMs = Math.max(0, safeInterval - (now - cycleStartedAt));

  return {
    slide,
    index: index % MIRROR_SLIDES.length,
    fade,
    remainingMs,
    intervalMs: safeInterval,
    goNext: () => goTo(index + 1),
    goTo,
  };
}
