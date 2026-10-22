import { NextResponse } from "next/server";
import { mirrorConfig } from "@/lib/config";
import { mockWeather } from "@/lib/mocks";
import type { WeatherDay, WeatherPayload } from "@/lib/types";
import { weatherSummary } from "@/lib/weather-codes";

function mockForecast(): WeatherDay[] {
  const base = mockWeather();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      date: d.toISOString().slice(0, 10),
      weatherCode: base.weatherCode,
      summary: weatherSummary(base.weatherCode),
      highC: base.highC + ((i % 3) - 1),
      lowC: base.lowC,
    };
  });
}

export async function GET() {
  const { latitude, longitude, locationLabel } = mirrorConfig.weather;

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set(
      "current",
      "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
    );
    url.searchParams.set(
      "daily",
      "weather_code,temperature_2m_max,temperature_2m_min",
    );
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "7");

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo ${res.status}`);
    }

    const data = (await res.json()) as {
      current?: {
        temperature_2m?: number;
        apparent_temperature?: number;
        weather_code?: number;
        wind_speed_10m?: number;
      };
      daily?: {
        time?: string[];
        weather_code?: number[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
      };
    };

    const code = data.current?.weather_code ?? 0;
    const days = data.daily?.time?.length ?? 0;
    const forecast: WeatherDay[] = [];
    for (let i = 0; i < days; i++) {
      const dayCode = data.daily?.weather_code?.[i] ?? 0;
      forecast.push({
        date: data.daily?.time?.[i] ?? "",
        weatherCode: dayCode,
        summary: weatherSummary(dayCode),
        highC: Math.round(data.daily?.temperature_2m_max?.[i] ?? 0),
        lowC: Math.round(data.daily?.temperature_2m_min?.[i] ?? 0),
      });
    }

    const payload: WeatherPayload = {
      source: "live",
      weather: {
        locationLabel,
        temperatureC: Math.round(data.current?.temperature_2m ?? 0),
        feelsLikeC: Math.round(data.current?.apparent_temperature ?? 0),
        weatherCode: code,
        windKph: Math.round(data.current?.wind_speed_10m ?? 0),
        summary: weatherSummary(code),
        highC: Math.round(data.daily?.temperature_2m_max?.[0] ?? 0),
        lowC: Math.round(data.daily?.temperature_2m_min?.[0] ?? 0),
        forecast,
      },
    };

    return NextResponse.json(payload);
  } catch {
    const forecast = mockForecast();
    const payload: WeatherPayload = {
      source: "mock",
      weather: {
        ...mockWeather(),
        locationLabel,
        forecast,
      },
      note: "Open-Meteo unavailable — showing mock weather.",
    };
    return NextResponse.json(payload);
  }
}
