import { NextResponse } from "next/server";
import { hasAppleCalendarConfig, mirrorConfig } from "@/lib/config";
import { fetchIcloudCalendarEvents } from "@/lib/icloud-caldav";
import { mockCalendarEvents } from "@/lib/mocks";
import type { CalendarPayload } from "@/lib/types";

/**
 * Upcoming calendar events.
 * Live via iCloud CalDAV when APPLE_ID + APPLE_APP_PASSWORD are set.
 */
export async function GET() {
  const limit = mirrorConfig.calendar.limit;

  if (hasAppleCalendarConfig()) {
    try {
      const events = await fetchIcloudCalendarEvents({
        daysAhead: 14,
        limit,
      });
      const payload: CalendarPayload = {
        source: "live",
        events,
        note:
          events.length === 0
            ? "Connected to iCloud — no upcoming events in the next 2 weeks."
            : undefined,
      };
      return NextResponse.json(payload);
    } catch (err) {
      const detail =
        err instanceof Error ? err.message : "CalDAV request failed";
      return NextResponse.json({
        source: "mock",
        events: mockCalendarEvents().slice(0, limit),
        note: `iCloud calendar failed — showing mock. ${detail}`,
      } satisfies CalendarPayload);
    }
  }

  const payload: CalendarPayload = {
    source: "mock",
    events: mockCalendarEvents().slice(0, limit),
    note: "Mock calendar. Set APPLE_ID and APPLE_APP_PASSWORD (app-specific) for iCloud.",
  };

  return NextResponse.json(payload);
}
