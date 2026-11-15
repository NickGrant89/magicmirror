import { NextResponse } from "next/server";
import {
  endOfLocalDay,
  eventOverlapsLocalDay,
  startOfLocalDay,
} from "@/lib/calendar-days";
import { hasAppleCalendarConfig } from "@/lib/config";
import { fetchIcloudCalendarEvents } from "@/lib/icloud-caldav";
import { mockCalendarEvents } from "@/lib/mocks";
import type { CalendarEvent, CalendarPayload } from "@/lib/types";

function todaysEvents(events: CalendarEvent[]) {
  const dayStart = startOfLocalDay();
  const dayEnd = endOfLocalDay();
  return events
    .filter((e) => eventOverlapsLocalDay(e, dayStart, dayEnd))
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
}

/**
 * Today's calendar events (full day list).
 * Live via iCloud CalDAV when APPLE_ID + APPLE_APP_PASSWORD are set.
 */
export async function GET() {
  if (hasAppleCalendarConfig()) {
    try {
      const events = await fetchIcloudCalendarEvents({ todayOnly: true });
      const payload: CalendarPayload = {
        source: "live",
        events,
        note:
          events.length === 0
            ? "Connected to iCloud — nothing on the calendar today."
            : undefined,
      };
      return NextResponse.json(payload);
    } catch (err) {
      const detail =
        err instanceof Error ? err.message : "CalDAV request failed";
      return NextResponse.json({
        source: "mock",
        events: todaysEvents(mockCalendarEvents()),
        note: `iCloud calendar failed — showing mock. ${detail}`,
      } satisfies CalendarPayload);
    }
  }

  const payload: CalendarPayload = {
    source: "mock",
    events: todaysEvents(mockCalendarEvents()),
    note: "Mock calendar. Set APPLE_ID and APPLE_APP_PASSWORD (app-specific) for iCloud.",
  };

  return NextResponse.json(payload);
}
