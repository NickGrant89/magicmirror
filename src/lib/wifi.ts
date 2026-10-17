/** Escape special characters for WIFI: QR payloads. */
export function escapeWifiQrValue(value: string) {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

export function wifiQrPayload({
  ssid,
  password,
  security = "WPA",
  hidden = false,
}: {
  ssid: string;
  password: string;
  security?: "WPA" | "WEP" | "nopass";
  hidden?: boolean;
}) {
  const s = escapeWifiQrValue(ssid);
  const p = escapeWifiQrValue(password);
  const t = security === "nopass" ? "nopass" : security;
  const h = hidden ? "H:true;" : "";
  return `WIFI:T:${t};S:${s};P:${p};${h};`;
}

export const guestWifiDefaults = {
  ssid: process.env.NEXT_PUBLIC_WIFI_SSID ?? "DIGI-Guest",
  password: process.env.NEXT_PUBLIC_WIFI_PASSWORD ?? "Jtech123!",
  security: (process.env.NEXT_PUBLIC_WIFI_SECURITY as "WPA" | "WEP" | "nopass") ?? "WPA",
  label: process.env.NEXT_PUBLIC_WIFI_LABEL ?? "Guest Wi‑Fi",
};
