"use client";

import { SectionLabel } from "@/components/mirror/section-label";
import { formatRelativeShort } from "@/lib/format";
import type { TasksPayload } from "@/lib/types";

export function TasksPanel({
  data,
  loading,
  error,
  compact = false,
}: {
  data: TasksPayload | null;
  loading: boolean;
  error: string | null;
  compact?: boolean;
}) {
  const tasks = (data?.tasks ?? []).slice(0, compact ? 3 : 5);

  return (
    <section className="mirror-fade-in-delay-3">
      <SectionLabel compact={compact}>Reminders</SectionLabel>
      {loading && !data ? (
        <p className="text-sm text-white/40">Loading tasks…</p>
      ) : error && !data ? (
        <p className="text-sm text-white/50">Reminders unavailable</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-white/40">All clear</p>
      ) : (
        <ul className={compact ? "space-y-1.5" : "space-y-3"}>
          {tasks.map((task) => (
            <li key={task.id} className="flex items-start gap-2">
              <span
                aria-hidden
                className={
                  compact
                    ? "mt-1.5 size-1.5 shrink-0 rounded-full bg-white/55"
                    : "mt-2 size-2 shrink-0 rounded-full bg-white/55"
                }
              />
              <div className="min-w-0">
                <p
                  className={
                    compact
                      ? "truncate text-sm text-white/90"
                      : "text-lg text-white/90 md:text-xl"
                  }
                >
                  {task.title}
                </p>
                {!compact ? (
                  <p className="text-sm text-white/40">
                    {task.list ?? "Reminders"}
                    {task.dueAt ? ` · ${formatRelativeShort(task.dueAt)}` : ""}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      {!compact && data?.source === "mock" ? (
        <p className="mirror-footnote mt-4 text-[0.7rem] tracking-wide text-white/25">
          Mock · Apple Reminders hook ready
        </p>
      ) : null}
    </section>
  );
}
