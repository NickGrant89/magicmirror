import { NextResponse } from "next/server";
import { hasAppleCalendarConfig } from "@/lib/config";
import { mockCalendarEvents } from "@/lib/mocks";
import type { CalendarPayload } from "@/lib/types";


/**
 * Returns upcoming calendar events.
 * Live CalDAV wiring lands when APPLE_CALDAV_URL + APPLE_ID + APPLE_APP_PASSWORD are set.
 */
export async function GET() {
  if (hasAppleCalendarConfig()) {
    // Hook: fetch iCloud CalDAV here and map into CalendarEvent[].
    // Until implemented, fall through to mock so the mirror never blanks.
  }

  const payload: CalendarPayload = {
    source: "mock",
    events: mockCalendarEvents(),
    note: hasAppleCalendarConfig()
      ? "Apple credentials detected — CalDAV client not wired yet; showing mock events."
      : "Mock calendar. Set APPLE_CALDAV_URL, APPLE_ID, APPLE_APP_PASSWORD for iCloud.",
  };

  return NextResponse.json(payload);
}
