import { istParts, istStartOfDay, istStartOfMonth } from "../../lib/format";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function istMonthKey(date) {
  const p = istParts(date);
  return p ? `${p.year}-${p.month - 1}` : null;
}

function istMonthOffsetStart(offset) {
  const now = istParts(new Date());
  const month = now.month - 1 + offset;
  const year = now.year + Math.floor(month / 12);
  const normMonth = ((month % 12) + 12) % 12;
  return new Date(Date.UTC(year, normMonth, 1, -5, -30, 0));
}

export function computeKpis(expenses) {
  const mStart = istStartOfMonth(new Date()).getTime();
  const lastMStart = istMonthOffsetStart(-1).getTime();
  const todayStart = istStartOfDay(new Date()).getTime();

  let total = 0, thisMonth = 0, lastMonth = 0, upcoming = 0, overdue = 0;
  let upcomingCount = 0, overdueCount = 0;

  for (const e of expenses) {
    const amount = Number(e.amount) || 0;
    total += amount;
    const d = new Date(e.date).getTime();
    if (!Number.isNaN(d)) {
      if (d >= mStart) thisMonth += amount;
      else if (d >= lastMStart && d < mStart) lastMonth += amount;
    }
    if (e.status === "overdue") { overdue += amount; overdueCount++; }
    if (e.type === "recurring" && e.status === "pending" && e.nextDueDate) {
      const due = istStartOfDay(new Date(e.nextDueDate));
      if (due) {
        const diff = Math.round((due.getTime() - todayStart) / 86400000);
        if (diff >= 0 && diff <= 14) { upcoming += amount; upcomingCount++; }
      }
    }
  }

  const delta = lastMonth === 0 ? null : ((thisMonth - lastMonth) / lastMonth) * 100;

  return { total, thisMonth, lastMonth, upcoming, overdue, upcomingCount, overdueCount, delta };
}

export function monthlySeries(expenses, months = 6) {
  const now = istParts(new Date());
  const buckets = [];
  for (let i = months - 1; i >= 0; i--) {
    const m = now.month - 1 - i;
    const year = now.year + Math.floor(m / 12);
    const normMonth = ((m % 12) + 12) % 12;
    buckets.push({
      key: `${year}-${normMonth}`,
      label: MONTH_LABELS[normMonth],
      value: 0
    });
  }
  const idx = new Map(buckets.map((b, i) => [b.key, i]));
  for (const e of expenses) {
    const key = istMonthKey(e.date);
    if (!key) continue;
    const i = idx.get(key);
    if (i !== undefined) buckets[i].value += Number(e.amount) || 0;
  }
  return buckets;
}

export function categoryBreakdown(expenses, limit = 6) {
  const map = expenses.reduce((acc, e) => {
    const key = e.category || "Other";
    acc[key] = (acc[key] || 0) + (Number(e.amount) || 0);
    return acc;
  }, {});
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export function typeBreakdown(expenses) {
  const map = { recurring: 0, "one-time": 0, flexible: 0 };
  for (const e of expenses) map[e.type] = (map[e.type] || 0) + (Number(e.amount) || 0);
  return [
    { label: "Recurring", value: map.recurring,    color: "#2DD4BF" },
    { label: "One-time",  value: map["one-time"],  color: "#F2B857" },
    { label: "Flexible",  value: map.flexible,     color: "#A78BFA" }
  ];
}
