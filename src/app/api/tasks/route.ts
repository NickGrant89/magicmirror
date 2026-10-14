import { NextResponse } from "next/server";
import { hasAppleTasksConfig } from "@/lib/config";
import { mockTasks } from "@/lib/mocks";
import type { TasksPayload } from "@/lib/types";


/**
 * Returns reminders / tasks.
 * Live Apple Reminders wiring lands when APPLE_ID + APPLE_APP_PASSWORD are set.
 */
export async function GET() {
  if (hasAppleTasksConfig()) {
    // Hook: fetch Reminders (CalDAV VTODO or Reminders API bridge) here.
  }

  const payload: TasksPayload = {
    source: "mock",
    tasks: mockTasks().filter((task) => !task.completed).slice(0, 5),
    note: hasAppleTasksConfig()
      ? "Apple credentials detected — Reminders client not wired yet; showing mock tasks."
      : "Mock tasks. Set APPLE_ID and APPLE_APP_PASSWORD for Reminders.",
  };

  return NextResponse.json(payload);
}
