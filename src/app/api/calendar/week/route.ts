import { NextResponse } from "next/server";
import { hasAppleCalendarConfig } from "@/lib/config";
import { fetchIcloudCalendarEvents } from "@/lib/icloud-caldav";
import { mockCalendarWeekEvents } from "@/lib/mocks";
import type { CalendarEvent, CalendarPayload } from "@/lib/types";

function startOfLocalDay(d = new Date()) {
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  return day;
}

function inNextDays(events: CalendarEvent[], days: number) {
  const start = startOfLocalDay();
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  const startMs = start.getTime();
  const endMs = end.getTime();
  return events
    .filter((e) => {
      const s = new Date(e.startsAt).getTime();
      const en = new Date(e.endsAt).getTime();
      return s < endMs && en > startMs;
    })
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
}

/** Next 7 local days of calendar events. */
export async function GET() {
  if (hasAppleCalendarConfig()) {
    try {
      const events = await fetchIcloudCalendarEvents({
        todayOnly: false,
        daysAhead: 7,
      });
      const week = inNextDays(events, 7);
      const payload: CalendarPayload = {
        source: "live",
        events: week,
        note:
          week.length === 0
            ? "Connected to iCloud — nothing in the next 7 days."
            : undefined,
      };
      return NextResponse.json(payload);
    } catch (err) {
      const detail =
        err instanceof Error ? err.message : "CalDAV request failed";
      return NextResponse.json({
        source: "mock",
        events: inNextDays(mockCalendarWeekEvents(), 7),
        note: `iCloud calendar failed — showing mock. ${detail}`,
      } satisfies CalendarPayload);
    }
  }

  return NextResponse.json({
    source: "mock",
    events: inNextDays(mockCalendarWeekEvents(), 7),
    note: "Mock week. Set APPLE_ID and APPLE_APP_PASSWORD for iCloud.",
  } satisfies CalendarPayload);
}
