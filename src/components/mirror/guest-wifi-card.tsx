"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { SectionLabel } from "@/components/mirror/section-label";
import { cn } from "@/lib/utils";
import { guestWifiDefaults, wifiQrPayload } from "@/lib/wifi";

export function GuestWifiCard({ compact = false }: { compact?: boolean }) {
  const { ssid, password, security, label } = guestWifiDefaults;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const payload = wifiQrPayload({ ssid, password, security });

    void QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: compact ? 96 : 180,
      color: { dark: "#0a0a0a", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [ssid, password, security, compact]);

  return (
    <section className="mirror-fade-in-delay-2">
      <SectionLabel compact={compact}>{label}</SectionLabel>

      <div
        className={cn(
          "guest-wifi-card flex items-stretch overflow-hidden rounded-xl bg-white text-zinc-900 shadow-[0_0_0_1px_rgb(255_255_255_/_8%),0_12px_28px_rgb(0_0_0_/_30%)]",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-center bg-white",
            compact ? "p-2" : "p-4",
          )}
        >
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt={`QR code to join ${ssid}`}
              className={cn(
                "rounded-md",
                compact ? "size-[3.4rem]" : "size-[7.5rem]",
              )}
            />
          ) : (
            <div
              className={cn(
                "rounded-md bg-zinc-100",
                compact ? "size-[3.4rem]" : "size-[7.5rem]",
              )}
            />
          )}
        </div>

        <div
          aria-hidden
          className="my-3 w-px shrink-0 self-stretch bg-zinc-200"
        />

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col justify-center",
            compact ? "gap-1 px-2.5 py-1.5" : "gap-3 px-5 py-4",
          )}
        >
          <div>
            <p
              className={cn(
                "font-medium tracking-[0.14em] text-zinc-400 uppercase",
                compact ? "text-[0.5rem]" : "text-[0.65rem]",
              )}
            >
              SSID
            </p>
            <p
              className={cn(
                "truncate font-display font-semibold tracking-tight text-zinc-900",
                compact ? "text-xs" : "text-xl",
              )}
            >
              {ssid}
            </p>
          </div>
          <div>
            <p
              className={cn(
                "font-medium tracking-[0.14em] text-zinc-400 uppercase",
                compact ? "text-[0.5rem]" : "text-[0.65rem]",
              )}
            >
              Password
            </p>
            <p
              className={cn(
                "truncate font-display font-semibold tracking-tight text-zinc-900 tabular-nums",
                compact ? "text-xs" : "text-xl",
              )}
            >
              {password}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
