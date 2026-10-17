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
      <div className="mirror-fade-in text-center sm:text-left" aria-hidden>
        <div className="mx-auto h-[0.9em] w-[6ch] rounded bg-white/5 text-[clamp(2.6rem,9vw,4.75rem)] leading-none sm:mx-0" />
      </div>
    );
  }

  return (
    <div className="mirror-fade-in text-center sm:text-left">
      <p className="font-display text-[clamp(2.6rem,9vw,4.75rem)] font-medium leading-none tracking-[-0.04em] text-white tabular-nums">
        {formatClockTime(now)}
        <span className="ml-1.5 align-top text-[0.22em] font-normal tracking-normal text-white/35 sm:ml-2">
          {formatClockSeconds(now)}
        </span>
      </p>
      <p className="mt-2 font-sans text-[clamp(0.9rem,1.8vw,1.2rem)] font-light tracking-[0.04em] text-white/65">
        {formatLongDate(now)}
      </p>
    </div>
  );
}
