/** Open-Meteo WMO weather interpretation codes → short label. */
export function weatherSummary(code: number): string {
  if (code === 0) return "Clear";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 85 && code <= 86) return "Snow showers";
  if (code >= 95) return "Thunderstorm";
  return "Mixed skies";
}

/** Compact badge word for day cards. */
export function weatherBadge(code: number): string {
  if (code === 0 || code === 1) return "Sun";
  if (code === 2) return "Fair";
  if (code === 3) return "Cloud";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 85 && code <= 86) return "Snow";
  if (code >= 95) return "Storm";
  return "Mixed";
}

export function weatherAccent(code: number): string {
  if (code === 0 || code === 1) return "from-amber-300/30 via-sky-400/10 to-transparent";
  if (code === 2) return "from-sky-300/25 via-white/5 to-transparent";
  if (code === 3) return "from-slate-300/20 via-white/5 to-transparent";
  if (code === 45 || code === 48) return "from-stone-300/25 via-white/5 to-transparent";
  if (code >= 51 && code <= 67) return "from-blue-400/30 via-slate-500/10 to-transparent";
  if (code >= 71 && code <= 86) return "from-cyan-200/25 via-slate-400/10 to-transparent";
  if (code >= 95) return "from-violet-400/30 via-slate-600/15 to-transparent";
  return "from-white/10 via-white/5 to-transparent";
}

export type WeatherMood =
  | "clear"
  | "partly"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "storm"
  | "mixed";

/** Atmosphere / particle mood for the full-bleed background. */
export function weatherMood(code: number): WeatherMood {
  if (code === 0 || code === 1) return "clear";
  if (code === 2) return "partly";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
  if (code >= 95) return "storm";
  return "mixed";
}
