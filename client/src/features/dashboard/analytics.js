const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function computeKpis(expenses) {
  const now = new Date();
  const mStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const lastMStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

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
      const due = new Date(e.nextDueDate).getTime();
      const diff = Math.round((due - todayStart) / 86400000);
      if (diff >= 0 && diff <= 14) { upcoming += amount; upcomingCount++; }
    }
  }

  const delta = lastMonth === 0 ? null : ((thisMonth - lastMonth) / lastMonth) * 100;

  return { total, thisMonth, lastMonth, upcoming, overdue, upcomingCount, overdueCount, delta };
}

export function monthlySeries(expenses, months = 6) {
  const now = new Date();
  const buckets = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: MONTH_LABELS[d.getMonth()],
      value: 0
    });
  }
  const idx = new Map(buckets.map((b, i) => [b.key, i]));
  for (const e of expenses) {
    const d = new Date(e.date);
    if (Number.isNaN(d.getTime())) continue;
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    const i = idx.get(k);
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
