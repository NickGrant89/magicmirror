import { NextResponse } from "next/server";
import { hasAppleTasksConfig } from "@/lib/config";
import { fetchIcloudReminders } from "@/lib/icloud-caldav";
import { mockTasks } from "@/lib/mocks";
import type { TasksPayload } from "@/lib/types";

/**
 * Reminders / tasks.
 * Live via iCloud CalDAV (VTODO) when APPLE_ID + APPLE_APP_PASSWORD are set.
 */
export async function GET() {
  if (hasAppleTasksConfig()) {
    try {
      const tasks = await fetchIcloudReminders({ limit: 8 });
      const payload: TasksPayload = {
        source: "live",
        tasks,
        note:
          tasks.length === 0
            ? "Connected to iCloud — no open reminders."
            : undefined,
      };
      return NextResponse.json(payload);
    } catch (err) {
      const detail =
        err instanceof Error ? err.message : "CalDAV request failed";
      return NextResponse.json({
        source: "mock",
        tasks: mockTasks().filter((task) => !task.completed).slice(0, 5),
        note: `iCloud reminders failed — showing mock. ${detail}`,
      } satisfies TasksPayload);
    }
  }

  const payload: TasksPayload = {
    source: "mock",
    tasks: mockTasks().filter((task) => !task.completed).slice(0, 5),
    note: "Mock tasks. Set APPLE_ID and APPLE_APP_PASSWORD (app-specific) for Reminders.",
  };

  return NextResponse.json(payload);
}
