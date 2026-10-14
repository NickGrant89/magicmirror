"use client";

import { Pause, Play, Radio } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    const audio = document.createElement("audio");
    audio.preload = "none";
    audioRef.current = audio;

    const onPlaying = () => {
      setPlaying(true);
      setStatus("live");
    };
    const onWaiting = () => setStatus("loading");
    const onPause = () => setPlaying(false);
    const onError = () => {
      setPlaying(false);
      setStatus("error");
    };

    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, []);

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) {
      setStatus("error");
      return;
    }

    if (!audio.paused && !audio.ended) {
      audio.pause();
      setPlaying(false);
      setStatus("idle");
      return;
    }

    try {
      setStatus("loading");
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
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => void toggle()}
          aria-label={playing ? `Pause ${STATION_NAME}` : `Play ${STATION_NAME}`}
          className={cn(
            "inline-flex size-14 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
            playing && "border-teal-300/40 bg-teal-400/10",
          )}
        >
          {playing ? (
            <Pause className="size-6" />
          ) : (
            <Play className="size-6 translate-x-0.5" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-teal-300/80" aria-hidden />
            <p className="font-display text-2xl tracking-tight text-white md:text-3xl">
              {STATION_NAME}
            </p>
          </div>
          <p className="mt-1 text-sm text-white/45">{STATION_TAGLINE}</p>
          <div className="mt-3 flex items-center gap-3">
            <Equalizer active={playing && status === "live"} />
            <p className="text-xs tracking-[0.18em] text-white/40 uppercase">
              {status === "live"
                ? "On air"
                : status === "loading"
                  ? "Tuning…"
                  : status === "error"
                    ? "Stream unavailable"
                    : "Tap play"}
            </p>
          </div>
        </div>
      </div>
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
