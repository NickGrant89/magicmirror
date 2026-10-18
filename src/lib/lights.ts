import { hasLightsConfig, mirrorConfig } from "@/lib/config";

export type LightAction = "on" | "off";

export function lightsStatus() {
  const configured = hasLightsConfig();
  return {
    configured,
    label: mirrorConfig.lights.label,
    note: configured
      ? undefined
      : "Set LIGHTS_ON_URL / LIGHTS_OFF_URL (IFTTT or Home Assistant webhook that runs an Alexa routine).",
  };
}

export async function triggerLight(action: LightAction) {
  const url =
    action === "on"
      ? mirrorConfig.lights.onUrl.trim()
      : mirrorConfig.lights.offUrl.trim();

  if (!url) {
    throw new Error(
      `Missing LIGHTS_${action.toUpperCase()}_URL in .env.local`,
    );
  }

  const method = mirrorConfig.lights.method === "GET" ? "GET" : "POST";
  const res = await fetch(url, {
    method,
    headers:
      method === "POST"
        ? { "Content-Type": "application/json" }
        : undefined,
    body:
      method === "POST"
        ? JSON.stringify({ action, source: "magic-mirror" })
        : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Webhook HTTP ${res.status}`);
  }

  return { ok: true as const, action };
}
