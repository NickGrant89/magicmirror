"use client";

import { useSyncExternalStore } from "react";
import {
  formatClockSeconds,
  formatClockTime,
  formatLongDate,
} from "@/lib/format";

function subscribe(onStoreChange: () => void) {
  const id = setInterval(onStoreChange, 1000);
  return () => clearInterval(id);
}

function getSnapshot() {
  return Math.floor(Date.now() / 1000);
}

function getServerSnapshot() {
  return 0;
}

export function Clock() {
  const epochSec = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const mounted = epochSec > 0;
  const now = new Date(epochSec * 1000);

  if (!mounted) {
    return (
      <div className="mirror-fade-in text-center" aria-hidden>
        <div className="mx-auto h-[0.9em] w-[6ch] rounded bg-white/5 text-[clamp(5rem,14vw,9.5rem)] leading-none" />
      </div>
    );
  }

  return (
    <div className="mirror-fade-in text-center">
      <p className="font-display text-[clamp(5rem,14vw,9.5rem)] font-medium leading-none tracking-[-0.04em] text-white tabular-nums">
        {formatClockTime(now)}
        <span className="ml-2 align-top text-[0.22em] font-normal tracking-normal text-white/35">
          {formatClockSeconds(now)}
        </span>
      </p>
      <p className="mt-4 font-sans text-[clamp(1.1rem,2.4vw,1.65rem)] font-light tracking-[0.04em] text-white/70">
        {formatLongDate(now)}
      </p>
    </div>
  );
}
