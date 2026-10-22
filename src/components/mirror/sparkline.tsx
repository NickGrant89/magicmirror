"use client";

import { cn } from "@/lib/utils";

export function Sparkline({
  values,
  className,
  strokeClassName,
}: {
  values: number[];
  className?: string;
  strokeClassName?: string;
}) {
  if (values.length < 2) {
    return <div className={cn("h-10 w-full", className)} />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 120;
  const h = 40;
  const pad = 2;

  const points = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / span) * (h - pad * 2);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const last = values[values.length - 1]!;
  const first = values[0]!;
  const up = last >= first;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("h-full w-full overflow-visible", className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      <polyline
        fill="none"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
        className={cn(
          up ? "stroke-emerald-300/90" : "stroke-rose-300/90",
          strokeClassName,
        )}
      />
    </svg>
  );
}
