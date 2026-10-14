"use client";

import { Pause, Play, Radio } from "lucide-react";
import { useRef, useState } from "react";
import { SectionLabel } from "@/components/mirror/section-label";
import { cn } from "@/lib/utils";

const DEFAULT_STREAM =
  process.env.NEXT_PUBLIC_RADIO_STREAM_URL ??
  "https://media-ssl.musicradio.com/CapitalXTRANationalMP3";

const STATION_NAME =
  process.env.NEXT_PUBLIC_RADIO_STATION_NAME ?? "Capital XTRA";

const STATION_TAGLINE =
  process.env.NEXT_PUBLIC_RADIO_STATION_TAGLINE ?? "UK · Hip-Hop & R&B";

export function RadioPanel() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "live" | "error">(
    "idle",
  );

  function ensureAudio() {
    if (audioRef.current) return audioRef.current;
    const audio = document.createElement("audio");
    audio.preload = "none";
    audio.addEventListener("playing", () => {
      setPlaying(true);
      setStatus("live");
    });
    audio.addEventListener("waiting", () => setStatus("loading"));
    audio.addEventListener("pause", () => setPlaying(false));
    audio.addEventListener("error", () => {
      setPlaying(false);
      setStatus("error");
    });
    audioRef.current = audio;
    return audio;
  }

  async function toggle() {
    const audio = ensureAudio();

    if (playing || (!audio.paused && audio.src)) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      setPlaying(false);
      setStatus("idle");
      return;
    }

    setStatus("loading");
    setPlaying(false);

    try {
      audio.src = DEFAULT_STREAM;
      await audio.play();
      setPlaying(true);
      setStatus("live");
    } catch {
      setPlaying(false);
      setStatus("error");
    }
  }

  return (
    <section className="mirror-fade-in-delay-2">
      <SectionLabel>Radio</SectionLabel>
      <button
        type="button"
        data-testid="capital-xtra-toggle"
        onClick={() => void toggle()}
        className={cn(
          "flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/40",
          status === "live" && "border-teal-300/35 bg-teal-400/10",
          status === "loading" && "border-white/25 bg-white/10",
          status === "error" && "border-rose-300/30 bg-rose-400/10",
        )}
      >
        <span
          className={cn(
            "inline-flex size-14 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white",
            status === "live" && "border-teal-300/50 bg-teal-400/15",
          )}
        >
          {playing || status === "live" ? (
            <Pause className="size-6" />
          ) : (
            <Play className="size-6 translate-x-0.5" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <Radio className="size-4 text-teal-300/80" aria-hidden />
            <span className="font-display text-2xl tracking-tight text-white md:text-3xl">
              {STATION_NAME}
            </span>
          </span>
          <span className="mt-1 block text-sm text-white/45">
            {STATION_TAGLINE}
          </span>
          <span className="mt-3 flex items-center gap-3">
            <Equalizer active={status === "live"} />
            <span className="text-xs tracking-[0.18em] text-white/40 uppercase">
              {status === "live"
                ? "On air"
                : status === "loading"
                  ? "Tuning…"
                  : status === "error"
                    ? "Stream unavailable"
                    : "Ready — press to play"}
            </span>
          </span>
        </span>
      </button>
    </section>
  );
}

function Equalizer({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "mirror-eq inline-flex h-3 items-end gap-0.5",
        active && "is-active",
      )}
      aria-hidden
    >
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}
