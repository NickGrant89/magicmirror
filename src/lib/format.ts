export function formatClockTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatClockSeconds(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    second: "2-digit",
  }).format(date);
}

export function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatEventTime(iso: string, allDay?: boolean) {
  if (allDay) return "All day";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatRelativeShort(iso: string, now = new Date()) {
  const diffMs = new Date(iso).getTime() - now.getTime();
  const abs = Math.abs(diffMs);
  const mins = Math.round(abs / 60000);

  if (mins < 1) return diffMs >= 0 ? "now" : "just now";
  if (mins < 60) {
    return diffMs >= 0 ? `in ${mins} min` : `${mins} min ago`;
  }

  const hours = Math.round(mins / 60);
  if (hours < 24) {
    return diffMs >= 0 ? `in ${hours} hr` : `${hours} hr ago`;
  }

  const days = Math.round(hours / 24);
  return diffMs >= 0 ? `in ${days}d` : `${days}d ago`;
}

export function formatCountdown(iso: string, now = new Date()) {
  const diffMs = Math.max(0, new Date(iso).getTime() - now.getTime());
  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (diffMs === 0) return "now";
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

function moneyDigits(value: number) {
  if (value > 0 && value < 0.001) return 6;
  if (value < 1) return 4;
  return 2;
}

export function formatMoney(value: number, currency: "USDT" | "GBP") {
  const digits = moneyDigits(value);
  if (currency === "GBP") {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: digits,
    }).format(value);
  }

  return `${value < 1 ? value.toFixed(digits) : value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })} USDT`;
}

export function formatPct(value?: number) {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
