"use client";

import { Bluetooth, Minus, Plus, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SectionLabel } from "@/components/mirror/section-label";
import type { BluetoothPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

async function fetchStatus(): Promise<BluetoothPayload> {
  const res = await fetch("/api/bluetooth", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as BluetoothPayload;
}

async function postAction(
  action: string,
  volumePct?: number,
): Promise<BluetoothPayload> {
  const res = await fetch("/api/bluetooth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, volumePct }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as BluetoothPayload;
}

export function SpeakerPanel({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<BluetoothPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const status = await fetchStatus();
      setData(status);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speaker unavailable");
    }
  }, []);

  useEffect(() => {
    const boot = setTimeout(() => {
      void refresh();
    }, 0);
    const id = setInterval(() => void refresh(), 8_000);
    return () => {
      clearTimeout(boot);
      clearInterval(id);
    };
  }, [refresh]);

  async function run(action: string, volumePct?: number) {
    setBusy(true);
    try {
      const next = await postAction(action, volumePct);
      setData(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const connected = Boolean(data?.connected);
  const muted = Boolean(data?.muted);
  const volume = data?.volumePct ?? 0;
  const name = data?.deviceName ?? "No speaker";

  return (
    <section className="mirror-fade-in-delay-3">
      <SectionLabel compact={compact}>Speaker</SectionLabel>

      <div
        className={cn(
          "rounded-xl border border-white/10 bg-white/[0.03]",
          compact ? "px-2.5 py-2" : "px-4 py-3",
        )}
      >
        <div className="flex items-center gap-2">
          <Bluetooth
            className={cn(
              compact ? "size-3.5" : "size-4",
              connected ? "text-teal-300" : "text-white/35",
            )}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "truncate font-display tracking-tight text-white",
                compact ? "text-sm" : "text-lg",
              )}
            >
              {name}
            </p>
            <p className="text-[0.65rem] tracking-[0.14em] text-white/40 uppercase">
              {connected ? "Connected" : "Not connected"}
              {data?.source === "mock" ? " · Mock" : ""}
            </p>
          </div>
          {!connected ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void run("connect")}
              className="rounded-full border border-white/15 px-2.5 py-1 text-[0.65rem] tracking-[0.12em] text-white/70 uppercase hover:bg-white/10 disabled:opacity-50"
            >
              Connect
            </button>
          ) : null}
        </div>

        <div className={cn("flex items-center gap-2", compact ? "mt-2" : "mt-3")}>
          <button
            type="button"
            aria-label={muted ? "Unmute" : "Mute"}
            disabled={busy}
            onClick={() => void run(muted ? "unmute" : "mute")}
            className="inline-flex size-8 items-center justify-center rounded-full border border-white/15 text-white/80 hover:bg-white/10 disabled:opacity-50"
          >
            {muted ? (
              <VolumeX className="size-3.5" />
            ) : (
              <Volume2 className="size-3.5" />
            )}
          </button>
          <button
            type="button"
            aria-label="Volume down"
            disabled={busy}
            onClick={() => void run("volume-down")}
            className="inline-flex size-8 items-center justify-center rounded-full border border-white/15 text-white/80 hover:bg-white/10 disabled:opacity-50"
          >
            <Minus className="size-3.5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  muted ? "bg-white/25" : "bg-teal-300/80",
                )}
                style={{ width: `${muted ? 0 : volume}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            aria-label="Volume up"
            disabled={busy}
            onClick={() => void run("volume-up")}
            className="inline-flex size-8 items-center justify-center rounded-full border border-white/15 text-white/80 hover:bg-white/10 disabled:opacity-50"
          >
            <Plus className="size-3.5" />
          </button>
          <span className="w-8 text-right text-xs tabular-nums text-white/55">
            {muted ? "—" : `${volume}%`}
          </span>
        </div>

        {error ? (
          <p className="mt-1.5 text-[0.65rem] text-rose-300/80">{error}</p>
        ) : data?.note ? (
          <p className="mt-1.5 text-[0.65rem] text-white/30">{data.note}</p>
        ) : null}
      </div>
    </section>
  );
}
