"use client";

import { SectionLabel } from "@/components/mirror/section-label";
import { formatRelativeShort } from "@/lib/format";
import type { TasksPayload } from "@/lib/types";

export function TasksPanel({
  data,
  loading,
  error,
}: {
  data: TasksPayload | null;
  loading: boolean;
  error: string | null;
}) {
  const tasks = data?.tasks ?? [];

  return (
    <section className="mirror-fade-in-delay-3">
      <SectionLabel>Reminders</SectionLabel>
      {loading && !data ? (
        <p className="text-white/40">Loading tasks…</p>
      ) : error && !data ? (
        <p className="text-white/50">Reminders unavailable</p>
      ) : tasks.length === 0 ? (
        <p className="text-white/40">All clear</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-2 size-2 shrink-0 rounded-full bg-white/55"
              />
              <div className="min-w-0">
                <p className="text-lg text-white/90 md:text-xl">{task.title}</p>
                <p className="text-sm text-white/40">
                  {task.list ?? "Reminders"}
                  {task.dueAt ? ` · ${formatRelativeShort(task.dueAt)}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {data?.source === "mock" ? (
        <p className="mt-4 text-[0.7rem] tracking-wide text-white/25">
          Mock · Apple Reminders hook ready
        </p>
      ) : null}
    </section>
  );
}
