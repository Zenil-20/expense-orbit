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
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatShortDate(d) {
  if (!d) return "-";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function toInputDate(d) {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function daysUntil(d) {
  if (!d) return null;
  const now = new Date();
  const target = new Date(d);
  const msPerDay = 1000 * 60 * 60 * 24;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  return Math.round((end - start) / msPerDay);
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
