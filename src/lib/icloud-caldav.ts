/**
 * iCloud CalDAV client for Calendar (VEVENT) and Reminders (VTODO).
 * Needs Apple ID + app-specific password from appleid.apple.com.
 */

import ICAL from "ical.js";
import { createDAVClient } from "tsdav";
import { mirrorConfig } from "@/lib/config";
import type { CalendarEvent, TaskItem } from "@/lib/types";

type DavCalendar = {
  url: string;
  displayName?: string | Record<string, unknown>;
  components?: string[];
  description?: string;
};

function displayNameOf(cal: DavCalendar): string {
  const name = cal.displayName;
  if (typeof name === "string" && name.trim()) return name.trim();
  return "Calendar";
}

function caldavServerUrl() {
  const raw =
    mirrorConfig.apple.caldavUrl.trim() || "https://caldav.icloud.com";
  return raw.replace(/\/$/, "");
}

function credentials() {
  const username = mirrorConfig.apple.appleId.trim();
  const password = mirrorConfig.apple.appPassword.trim();
  if (!username || !password) {
    throw new Error("Set APPLE_ID and APPLE_APP_PASSWORD in .env.local");
  }
  return { username, password };
}

async function getClient() {
  return createDAVClient({
    serverUrl: caldavServerUrl(),
    credentials: credentials(),
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });
}

function toIso(time: ICAL.Time | null | undefined): string | undefined {
  if (!time) return undefined;
  try {
    return time.toJSDate().toISOString();
  } catch {
    return undefined;
  }
}

function parseEventsFromIcal(
  data: string,
  calendarName: string,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  let jcal: unknown;
  try {
    jcal = ICAL.parse(data);
  } catch {
    return events;
  }

  const root = new ICAL.Component(jcal as never);
  const vevents = root.getAllSubcomponents("vevent");

  for (const vevent of vevents) {
    try {
      const event = new ICAL.Event(vevent);
      const startsAt = toIso(event.startDate);
      if (!startsAt) continue;
      const endsAt =
        toIso(event.endDate) ??
        new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString();
      const location = event.location?.trim() || undefined;
      const title = event.summary?.trim() || "Untitled";
      const uid = event.uid || `${calendarName}-${startsAt}-${title}`;
      events.push({
        id: uid,
        title,
        startsAt,
        endsAt,
        location,
        allDay: Boolean(event.startDate?.isDate),
      });
    } catch {
      // skip malformed event
    }
  }
  return events;
}

function parseTodosFromIcal(data: string, listName: string): TaskItem[] {
  const tasks: TaskItem[] = [];
  let jcal: unknown;
  try {
    jcal = ICAL.parse(data);
  } catch {
    return tasks;
  }

  const root = new ICAL.Component(jcal as never);
  const vtodos = root.getAllSubcomponents("vtodo");

  for (const vtodo of vtodos) {
    try {
      const summary = vtodo.getFirstPropertyValue("summary");
      const title =
        typeof summary === "string" && summary.trim()
          ? summary.trim()
          : "Untitled";
      const uidRaw = vtodo.getFirstPropertyValue("uid");
      const uid =
        typeof uidRaw === "string" && uidRaw
          ? uidRaw
          : `${listName}-${title}`;
      const status = String(
        vtodo.getFirstPropertyValue("status") ?? "",
      ).toUpperCase();
      const completedProp = vtodo.getFirstPropertyValue("completed");
      const completed =
        status === "COMPLETED" || Boolean(completedProp);

      let dueAt: string | undefined;
      const due = vtodo.getFirstPropertyValue("due");
      if (due && typeof due === "object" && "toJSDate" in (due as object)) {
        dueAt = toIso(due as ICAL.Time);
      } else if (typeof due === "string" && due) {
        const parsed = new Date(due);
        if (!Number.isNaN(parsed.getTime())) dueAt = parsed.toISOString();
      }

      tasks.push({
        id: uid,
        title,
        dueAt,
        completed,
        list: listName,
      });
    } catch {
      // skip malformed todo
    }
  }
  return tasks;
}

function supportsComponent(cal: DavCalendar, component: string) {
  const comps = (cal.components ?? []).map((c) => c.toUpperCase());
  if (comps.length === 0) return true;
  return comps.includes(component.toUpperCase());
}

/**
 * Upcoming events across all calendars that support VEVENT (next N days).
 */
export async function fetchIcloudCalendarEvents(options?: {
  daysAhead?: number;
  limit?: number;
}): Promise<CalendarEvent[]> {
  const daysAhead = options?.daysAhead ?? 14;
  const limit = options?.limit ?? 12;
  const client = await getClient();
  const calendars = (await client.fetchCalendars()) as DavCalendar[];

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + daysAhead);

  const timeRange = {
    start: start.toISOString(),
    end: end.toISOString(),
  };

  const collected: CalendarEvent[] = [];

  for (const calendar of calendars) {
    if (!supportsComponent(calendar, "VEVENT")) continue;
    try {
      const objects = await client.fetchCalendarObjects({
        calendar: calendar as never,
        timeRange,
        expand: true,
      });
      for (const obj of objects) {
        if (!obj.data) continue;
        collected.push(
          ...parseEventsFromIcal(obj.data, displayNameOf(calendar)),
        );
      }
    } catch {
      // skip calendars that reject query
    }
  }

  const now = Date.now();
  return collected
    .filter((e) => new Date(e.endsAt).getTime() >= now - 15 * 60 * 1000)
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    )
    .slice(0, limit);
}

/**
 * Incomplete reminders (VTODO) across reminder lists.
 */
export async function fetchIcloudReminders(options?: {
  limit?: number;
}): Promise<TaskItem[]> {
  const limit = options?.limit ?? 8;
  const client = await getClient();
  const calendars = (await client.fetchCalendars()) as DavCalendar[];

  const todoFilter = {
    "comp-filter": {
      _attributes: {
        name: "VCALENDAR",
      },
      "comp-filter": {
        _attributes: {
          name: "VTODO",
        },
      },
    },
  };

  const collected: TaskItem[] = [];

  for (const calendar of calendars) {
    // Prefer calendars that advertise VTODO; also try others that might be reminder lists.
    const isTodoCal = supportsComponent(calendar, "VTODO");
    const name = displayNameOf(calendar).toLowerCase();
    const looksLikeReminders =
      isTodoCal ||
      name.includes("reminder") ||
      name.includes("tasks") ||
      name.includes("todo");
    if (!looksLikeReminders && !isTodoCal) {
      // Still try if calendar only has VTODO or empty components
      if (
        calendar.components &&
        calendar.components.length > 0 &&
        !supportsComponent(calendar, "VTODO")
      ) {
        continue;
      }
    }

    try {
      const objects = await client.fetchCalendarObjects({
        calendar: calendar as never,
        filters: todoFilter,
      });
      for (const obj of objects) {
        if (!obj.data) continue;
        collected.push(...parseTodosFromIcal(obj.data, displayNameOf(calendar)));
      }
    } catch {
      // skip
    }
  }

  // If nothing found via VTODO filter, fall back: scan all calendars without filter and parse VTODO only.
  if (collected.length === 0) {
    for (const calendar of calendars) {
      try {
        const objects = await client.fetchCalendarObjects({
          calendar: calendar as never,
        });
        for (const obj of objects) {
          if (!obj.data || !/BEGIN:VTODO/i.test(obj.data)) continue;
          collected.push(
            ...parseTodosFromIcal(obj.data, displayNameOf(calendar)),
          );
        }
      } catch {
        // skip
      }
    }
  }

  return collected
    .filter((t) => !t.completed)
    .sort((a, b) => {
      const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aDue - bDue;
    })
    .slice(0, limit);
}
