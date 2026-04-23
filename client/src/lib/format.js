export const APP_TIMEZONE = "Asia/Kolkata";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

export function formatCurrency(amount) {
  return inr.format(Number(amount || 0));
}

export function formatDate(d) {
  if (!d) return "-";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    timeZone: APP_TIMEZONE
  });
}

export function formatShortDate(d) {
  if (!d) return "-";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "numeric", month: "short",
    timeZone: APP_TIMEZONE
  });
}

/** Break a Date into its IST calendar parts. */
export function istParts(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false
  }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return {
    year: +get("year"),
    month: +get("month"),
    day: +get("day"),
    hour: +get("hour"),
    minute: +get("minute"),
    second: +get("second")
  };
}

/** Return the UTC instant at 00:00:00 IST for the given date's IST calendar day. */
export function istStartOfDay(date = new Date()) {
  const p = istParts(date);
  if (!p) return null;
  // IST is UTC+05:30 (no DST) → IST midnight = UTC (previous day) 18:30:00
  return new Date(Date.UTC(p.year, p.month - 1, p.day, -5, -30, 0));
}

/** Return the UTC instant at 00:00:00 IST for the first day of the date's IST calendar month. */
export function istStartOfMonth(date = new Date()) {
  const p = istParts(date);
  if (!p) return null;
  return new Date(Date.UTC(p.year, p.month - 1, 1, -5, -30, 0));
}

/** Return YYYY-MM-DD for the given moment, using the IST calendar day. */
export function toInputDate(d) {
  const date = d ? (d instanceof Date ? d : new Date(d)) : new Date();
  const p = istParts(date);
  if (!p) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Days between now and `d`, measured across IST calendar days. */
export function daysUntil(d) {
  if (!d) return null;
  const target = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(target.getTime())) return null;
  const start = istStartOfDay(new Date()).getTime();
  const end = istStartOfDay(target).getTime();
  return Math.round((end - start) / 86400000);
}

export function dueLabel(d) {
  const diff = daysUntil(d);
  if (diff === null) return "-";
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Tomorrow";
  if (diff < 7) return `In ${diff} days`;
  return formatShortDate(d);
}
