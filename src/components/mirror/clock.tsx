"use client";

import { useSyncExternalStore } from "react";
import {
  formatClockSeconds,
  formatClockTime,
  formatLongDate,
} from "@/lib/format";
import { cn } from "@/lib/utils";

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

export function Clock({ compact = false }: { compact?: boolean }) {
  const epochSec = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const mounted = epochSec > 0;
  const now = new Date(epochSec * 1000);

  if (!mounted) {
    return (
      <div
        className={cn(
          "mirror-clock mirror-fade-in text-center sm:text-left",
          compact && "is-compact",
        )}
        aria-hidden
      >
        <div className="mirror-clock-time mx-auto h-[0.9em] w-[6ch] rounded bg-white/5 leading-none sm:mx-0" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mirror-clock mirror-fade-in text-center sm:text-left",
        compact && "is-compact",
      )}
    >
      <p className="mirror-clock-time font-display font-medium leading-none tracking-[-0.04em] text-white tabular-nums">
        {formatClockTime(now)}
        <span className="mirror-clock-seconds ml-1.5 align-top font-normal tracking-normal text-white/35 sm:ml-2">
          {formatClockSeconds(now)}
        </span>
      </p>
      <p className="mirror-clock-date mt-2 font-sans font-light tracking-[0.04em] text-white/65">
        {formatLongDate(now)}
      </p>
    </div>
  );
}
