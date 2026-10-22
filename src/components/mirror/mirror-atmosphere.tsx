"use client";

import { useMemo } from "react";
import { weatherMood, type WeatherMood } from "@/lib/weather-codes";
import { cn } from "@/lib/utils";

function ParticleField({
  kind,
  count,
}: {
  kind: "rain" | "drizzle" | "snow";
  count: number;
}) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${(i * 37 + 13) % 100}%`,
        delay: `${((i * 47) % 100) / 20}s`,
        duration: kind === "snow" ? `${6 + (i % 5)}s` : `${0.7 + (i % 8) / 10}s`,
        opacity: kind === "snow" ? 0.35 + (i % 5) * 0.08 : 0.25 + (i % 4) * 0.1,
        size: kind === "snow" ? 2 + (i % 3) : kind === "drizzle" ? 1 : 1.5,
      })),
    [count, kind],
  );

  return (
    <div className={cn("weather-particles absolute inset-0", `is-${kind}`)} aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className="weather-particle"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            opacity: p.opacity,
            width: p.size,
            height: kind === "snow" ? p.size : p.size * (kind === "drizzle" ? 6 : 12),
          }}
        />
      ))}
    </div>
  );
}

function moodSkyClass(mood: WeatherMood): string {
  switch (mood) {
    case "clear":
      return "weather-sky-clear";
    case "partly":
      return "weather-sky-partly";
    case "overcast":
      return "weather-sky-overcast";
    case "fog":
      return "weather-sky-fog";
    case "drizzle":
      return "weather-sky-drizzle";
    case "rain":
      return "weather-sky-rain";
    case "snow":
      return "weather-sky-snow";
    case "storm":
      return "weather-sky-storm";
    default:
      return "";
  }
}

export function MirrorAtmosphere({
  weatherCode,
}: {
  weatherCode?: number;
}) {
  const mood = weatherMood(weatherCode ?? 3);
  const showRain = mood === "rain" || mood === "storm";
  const showDrizzle = mood === "drizzle";
  const showSnow = mood === "snow";
  const showSun = mood === "clear" || mood === "partly";
  const showClouds =
    mood === "partly" ||
    mood === "overcast" ||
    mood === "drizzle" ||
    mood === "rain" ||
    mood === "storm" ||
    mood === "snow";
  const showFog = mood === "fog";
  const showLightning = mood === "storm";

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black"
      data-weather-mood={mood}
    >
      <div className={cn("mirror-sky absolute inset-0", moodSkyClass(mood))} />
      <div className="mirror-aurora mirror-aurora-a absolute -left-1/4 top-[-20%] h-[75%] w-[85%] rounded-full" />
      <div className="mirror-aurora mirror-aurora-b absolute -right-[15%] top-[5%] h-[60%] w-[75%] rounded-full" />
      <div className="mirror-aurora mirror-aurora-c absolute bottom-[-20%] left-[10%] h-[55%] w-[75%] rounded-full" />

      {showSun ? <div className="weather-sun absolute" /> : null}
      {showClouds ? (
        <>
          <div className="weather-cloud weather-cloud-a absolute" />
          <div className="weather-cloud weather-cloud-b absolute" />
          <div className="weather-cloud weather-cloud-c absolute" />
        </>
      ) : null}
      {showFog ? <div className="weather-fog absolute inset-0" /> : null}
      {showRain ? <ParticleField kind="rain" count={42} /> : null}
      {showDrizzle ? <ParticleField kind="drizzle" count={28} /> : null}
      {showSnow ? <ParticleField kind="snow" count={36} /> : null}
      {showLightning ? <div className="weather-lightning absolute inset-0" /> : null}

      <div
        className={cn(
          "mirror-stars absolute inset-0",
          showSun ? "opacity-25" : "opacity-80",
        )}
      />
      <div className="mirror-grain absolute inset-0 opacity-[0.22]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black/80" />
    </div>
  );
}
