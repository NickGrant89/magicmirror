import { NextResponse } from "next/server";
import { hasBlinkConfig } from "@/lib/config";
import { mockDoorbellEvent } from "@/lib/mocks";
import type { DoorbellPayload } from "@/lib/types";


/**
 * Returns the latest Blink doorbell event.
 * Live Blink wiring lands when BLINK_EMAIL + BLINK_PASSWORD are set.
 */
export async function GET() {
  if (hasBlinkConfig()) {
    // Hook: authenticate with Blink / home monitor bridge and map latest clip.
  }

  const payload: DoorbellPayload = {
    source: "mock",
    event: mockDoorbellEvent(),
    note: hasBlinkConfig()
      ? "Blink credentials detected — API client not wired yet; showing mock event."
      : "Mock doorbell. Set BLINK_EMAIL, BLINK_PASSWORD (optional BLINK_CLIENT_ID).",
  };

  return NextResponse.json(payload);
}
