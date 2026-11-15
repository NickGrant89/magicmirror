import type { CalendarEvent } from "@/lib/types";

export function startOfLocalDay(d = new Date()) {
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  return day;
}

export function endOfLocalDay(d = new Date()) {
  const day = startOfLocalDay(d);
  day.setDate(day.getDate() + 1);
  return day;
}

type CivilDate = {
  year: number;
  /** 1–12, matching iCal / ical.js */
  month: number;
  day: number;
};

/** Local midnight of a timezone-naive iCal DATE. */
export function localDateMidnightIso(date: CivilDate) {
  return new Date(date.year, date.month - 1, date.day, 0, 0, 0).toISOString();
}

/**
 * RFC 5545 DATE DTEND is exclusive. A one-day all-day event is
 * DTSTART=D, DTEND=D+1, occupying [D 00:00, D+1 00:00) local time.
 */
export function allDayRangeIso(
  start: CivilDate,
  end?: CivilDate | null,
): { startsAt: string; endsAt: string } {
  const startsAt = localDateMidnightIso(start);
  let endsAt = end ? localDateMidnightIso(end) : startsAt;
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    const next = new Date(start.year, start.month - 1, start.day + 1, 0, 0, 0);
    endsAt = next.toISOString();
  }
  return { startsAt, endsAt };
}

/** Half-open overlap: [startsAt, endsAt) vs [dayStart, dayEnd). */
export function eventOverlapsLocalDay(
  event: Pick<CalendarEvent, "startsAt" | "endsAt">,
  dayStart: Date,
  dayEnd: Date,
) {
  const starts = new Date(event.startsAt).getTime();
  const ends = new Date(event.endsAt).getTime();
  return starts < dayEnd.getTime() && ends > dayStart.getTime();
}
