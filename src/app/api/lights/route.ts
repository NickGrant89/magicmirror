import { NextResponse } from "next/server";
import { hasLightsConfig } from "@/lib/config";
import { lightsStatus, triggerLight, type LightAction } from "@/lib/lights";
import type { LightsPayload } from "@/lib/types";

export async function GET() {
  const status = lightsStatus();
  const payload: LightsPayload = {
    source: status.configured ? "live" : "mock",
    configured: status.configured,
    label: status.label,
    lastAction: null,
    note: status.note,
  };
  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  let action: LightAction | undefined;
  try {
    const body = (await request.json()) as { action?: string };
    if (body.action === "on" || body.action === "off") {
      action = body.action;
    }
  } catch {
    action = undefined;
  }

  if (!action) {
    return NextResponse.json({ error: "action must be on or off" }, { status: 400 });
  }

  if (!hasLightsConfig()) {
    const status = lightsStatus();
    return NextResponse.json({
      source: "mock",
      configured: false,
      label: status.label,
      lastAction: action,
      note: `Mock ${action} — add LIGHTS_ON_URL / LIGHTS_OFF_URL to control real Alexa lights.`,
    } satisfies LightsPayload);
  }

  try {
    await triggerLight(action);
    const status = lightsStatus();
    return NextResponse.json({
      source: "live",
      configured: true,
      label: status.label,
      lastAction: action,
    } satisfies LightsPayload);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Webhook failed";
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
