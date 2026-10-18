"use client";

import { Lightbulb, LightbulbOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SectionLabel } from "@/components/mirror/section-label";
import type { LightsPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

async function fetchStatus(): Promise<LightsPayload> {
  const res = await fetch("/api/lights", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as LightsPayload;
}

async function postAction(action: "on" | "off"): Promise<LightsPayload> {
  const res = await fetch("/api/lights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as LightsPayload;
}

export function LightsPanel({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<LightsPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setData(await fetchStatus());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lights unavailable");
    }
  }, []);

  useEffect(() => {
    const boot = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(boot);
  }, [refresh]);

  async function run(action: "on" | "off") {
    setBusy(true);
    try {
      setData(await postAction(action));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const label = data?.label ?? "Lights";
  const last = data?.lastAction;

  return (
    <section className="mirror-fade-in-delay-3">
      <SectionLabel compact={compact}>Lights</SectionLabel>
      <div
        className={cn(
          "rounded-xl border border-white/10 bg-white/[0.03]",
          compact ? "px-2.5 py-2" : "px-4 py-3",
        )}
      >
        <p
          className={cn(
            "truncate font-display tracking-tight text-white",
            compact ? "text-sm" : "text-lg",
          )}
        >
          {label}
        </p>
        <p className="mt-0.5 text-[0.65rem] tracking-[0.14em] text-white/40 uppercase">
          {data?.configured
            ? last
              ? `Last · ${last}`
              : "Webhook ready"
            : "Setup needed"}
        </p>

        <div className={cn("flex gap-2", compact ? "mt-2" : "mt-3")}>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("on")}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1.5 text-[0.65rem] tracking-[0.12em] text-white/80 uppercase hover:bg-white/10 disabled:opacity-50"
          >
            <Lightbulb className="size-3.5 text-amber-200/90" aria-hidden />
            On
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("off")}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1.5 text-[0.65rem] tracking-[0.12em] text-white/80 uppercase hover:bg-white/10 disabled:opacity-50"
          >
            <LightbulbOff className="size-3.5 text-white/45" aria-hidden />
            Off
          </button>
        </div>

        {error ? (
          <p className="mt-1.5 text-[0.65rem] text-rose-300/80">{error}</p>
        ) : data?.note ? (
          <p className="mt-1.5 text-[0.65rem] leading-snug text-white/30">
            {data.note}
          </p>
        ) : null}
      </div>
    </section>
  );
}
