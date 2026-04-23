import { useMemo, useState } from "react";

export const RANGES = {
  "30d": { label: "Last 30 days",  days: 30 },
  "90d": { label: "Last 90 days",  days: 90 },
  "6m":  { label: "Last 6 months", days: 182 },
  "1y":  { label: "Last 12 months", days: 365 },
  "ytd": { label: "Year to date",  ytd: true },
  "all": { label: "All time" }
};

export const DEFAULTS = { range: "all", type: "all", status: "all", categories: [] };

export function rangeStart(rangeKey) {
  const r = RANGES[rangeKey];
  if (!r) return null;
  const now = new Date();
  if (r.ytd) return new Date(now.getFullYear(), 0, 1);
  if (r.days) return new Date(now.getTime() - r.days * 86400000);
  return null;
}

export function useExpenseFilters(expenses, initial = DEFAULTS) {
  const [filters, setFilters] = useState({ ...DEFAULTS, ...initial });

  const update = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const reset = () => setFilters(DEFAULTS);

  const filtered = useMemo(() => {
    const start = rangeStart(filters.range);
    return expenses.filter((e) => {
      if (start) {
        const ref = e.type === "recurring" && e.nextDueDate ? new Date(e.nextDueDate) : new Date(e.date);
        if (Number.isNaN(ref.getTime()) || ref < start) return false;
      }
      if (filters.type !== "all" && e.type !== filters.type) return false;
      if (filters.status !== "all" && e.status !== filters.status) return false;
      if (filters.categories.length && !filters.categories.includes(e.category || "Other")) return false;
      return true;
    });
  }, [expenses, filters]);

  return { filtered, filters, update, reset };
}
