import type {
  CalendarEvent,
  DoorbellEvent,
  TaskItem,
  WeatherSnapshot,
} from "@/lib/types";

function atOffset(hoursFromNow: number, durationMinutes = 60) {
  const startsAt = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
  return {
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  };
}

export function mockCalendarEvents(): CalendarEvent[] {
  const standup = atOffset(0.7, 30);
  const design = atOffset(3.2, 60);
  const dinner = atOffset(8.5, 90);
  const tomorrow = atOffset(26, 45);

  return [
    {
      id: "evt-standup",
      title: "Team standup",
      location: "Meet",
      ...standup,
    },
    {
      id: "evt-design",
      title: "Mirror UI review",
      location: "Studio",
      ...design,
    },
    {
      id: "evt-dinner",
      title: "Dinner with Sam",
      location: "Borough Market",
      ...dinner,
    },
    {
      id: "evt-dentist",
      title: "Dentist",
      location: "Harley Street",
      ...tomorrow,
    },
  ];
}

export function mockTasks(): TaskItem[] {
  const later = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
  const tomorrow = new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: "task-1",
      title: "Charge iPad before bed",
      dueAt: later,
      completed: false,
      list: "Home",
    },
    {
      id: "task-2",
      title: "Buy oat milk",
      dueAt: tomorrow,
      completed: false,
      list: "Errands",
    },
    {
      id: "task-3",
      title: "Send calendar invite",
      completed: false,
      list: "Work",
    },
    {
      id: "task-4",
      title: "Water the plants",
      completed: true,
      list: "Home",
    },
  ];
}

export function mockDoorbellEvent(): DoorbellEvent {
  return {
    id: "blink-1",
    title: "Doorbell motion",
    occurredAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    camera: "Front Door",
    summary: "Person detected — package left on step",
    thumbnailUrl: undefined,
  };
}

export function mockWeather(): WeatherSnapshot {
  return {
    locationLabel: "London",
    temperatureC: 12,
    feelsLikeC: 10,
    weatherCode: 2,
    windKph: 14,
    summary: "Partly cloudy",
    highC: 15,
    lowC: 8,
  };
}

export const mockCryptoFallback = [
  {
    symbol: "BTC" as const,
    name: "Bitcoin",
    usdt: 68420.12,
    gbp: 53510.4,
    change24hPct: 1.8,
  },
  {
    symbol: "VET" as const,
    name: "VeChain",
    usdt: 0.0284,
    gbp: 0.0222,
    change24hPct: -0.6,
  },
  {
    symbol: "XRP" as const,
    name: "XRP",
    usdt: 0.612,
    gbp: 0.478,
    change24hPct: 0.9,
  },
];
