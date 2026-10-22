"use client";

import { cn } from "@/lib/utils";

export function Sparkline({
  values,
  className,
  strokeClassName,
  /** Larger path + soft fill for the dominant 1W hero chart */
  hero = false,
}: {
  values: number[];
  className?: string;
  strokeClassName?: string;
  hero?: boolean;
}) {
  if (values.length < 2) {
    return <div className={cn(hero ? "h-full w-full" : "h-10 w-full", className)} />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = hero ? 640 : 120;
  const h = hero ? 240 : 40;
  const pad = hero ? 8 : 2;

  const coords = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / span) * (h - pad * 2);
    return { x, y };
  });

  const points = coords.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const first = values[0]!;
  const last = values[values.length - 1]!;
  const up = last >= first;

  const areaPath =
    hero && coords.length >= 2
      ? [
          `M ${coords[0]!.x.toFixed(2)} ${h}`,
          ...coords.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`),
          `L ${coords[coords.length - 1]!.x.toFixed(2)} ${h}`,
          "Z",
        ].join(" ")
      : null;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("h-full w-full overflow-visible", className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      {areaPath ? (
        <path
          d={areaPath}
          className={up ? "fill-emerald-400/15" : "fill-rose-400/15"}
        />
      ) : null}
      <polyline
        fill="none"
        strokeWidth={hero ? 3.5 : 2}
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
