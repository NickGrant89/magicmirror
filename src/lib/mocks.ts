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

function atLocalDay(
  dayOffset: number,
  hour: number,
  minute = 0,
  durationMinutes = 60,
) {
  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + dayOffset);
  startsAt.setHours(hour, minute, 0, 0);
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

/** Spread of mock events across the next week (for the week tab). */
export function mockCalendarWeekEvents(): CalendarEvent[] {
  const busyToday: CalendarEvent[] = [
    { id: "wk-today-1", title: "School run", ...atLocalDay(0, 7, 30, 30) },
    { id: "wk-today-2", title: "Team standup", location: "Meet", ...atLocalDay(0, 9, 0, 30) },
    { id: "wk-today-3", title: "Dentist", location: "Harley Street", ...atLocalDay(0, 10, 15, 45) },
    { id: "wk-today-4", title: "Mirror UI review", location: "Studio", ...atLocalDay(0, 12, 0, 60) },
    { id: "wk-today-5", title: "Pickup parcels", ...atLocalDay(0, 13, 30, 20) },
    { id: "wk-today-6", title: "Call Mum", ...atLocalDay(0, 15, 0, 20) },
    { id: "wk-today-7", title: "Gym", ...atLocalDay(0, 17, 30, 60) },
    { id: "wk-today-8", title: "Dinner with Sam", location: "Borough Market", ...atLocalDay(0, 19, 30, 90) },
    { id: "wk-today-9", title: "Bin night", ...atLocalDay(0, 21, 0, 15) },
  ];
  const busyTomorrow: CalendarEvent[] = [
    { id: "wk-tmr-1", title: "School run", ...atLocalDay(1, 7, 30, 30) },
    { id: "wk-tmr-2", title: "Yoga", ...atLocalDay(1, 9, 0, 45) },
    { id: "wk-tmr-3", title: "Shop Tesco", ...atLocalDay(1, 11, 0, 40) },
    { id: "wk-tmr-4", title: "Oil boiler service", ...atLocalDay(1, 13, 0, 60) },
    { id: "wk-tmr-5", title: "Parents evening", location: "School", ...atLocalDay(1, 17, 0, 45) },
    { id: "wk-tmr-6", title: "Takeaway night", ...atLocalDay(1, 19, 0, 60) },
    { id: "wk-tmr-7", title: "Series catch-up", ...atLocalDay(1, 21, 0, 90) },
  ];
  const extras: CalendarEvent[] = [
    { id: "evt-school-run", title: "School run", ...atLocalDay(2, 8, 0, 30) },
    { id: "evt-gym", title: "Gym", ...atLocalDay(3, 18, 0, 60) },
    { id: "evt-parents", title: "Book club", location: "Library", ...atLocalDay(4, 19, 0, 90) },
    { id: "evt-market", title: "Farmers market", ...atLocalDay(5, 10, 0, 90) },
    { id: "evt-brunch", title: "Sunday brunch", ...atLocalDay(6, 11, 0, 90) },
  ];
  return [...busyToday, ...busyTomorrow, ...extras];
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
    locationLabel: "Luton",
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
  {
    symbol: "BNB" as const,
    name: "BNB",
    usdt: 612.4,
    gbp: 478.1,
    change24hPct: 0.7,
  },
  {
    symbol: "HOT" as const,
    name: "Holo",
    usdt: 0.00185,
    gbp: 0.00144,
    change24hPct: -1.2,
  },
];
