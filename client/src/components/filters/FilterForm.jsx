import { useEffect, useState } from "react";
import { RANGES } from "../../features/expenses/useExpenseFilters";
import { api } from "../../lib/api";
import { DEFAULT_CATEGORIES, getCategoryMeta } from "../../lib/categories";

const TYPES = [
  { value: "all",       label: "All types" },
  { value: "recurring", label: "Recurring" },
  { value: "one-time",  label: "One-time" },
  { value: "flexible",  label: "Flexible" }
];
const STATUSES = [
  { value: "all",     label: "Any" },
  { value: "pending", label: "Pending" },
  { value: "paid",    label: "Paid" },
  { value: "overdue", label: "Overdue" }
];

export default function FilterForm({ filters, onChange }) {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    api.categories().then((d) => setCategories(d.categories || DEFAULT_CATEGORIES)).catch(() => {});
  }, []);

  const toggleCategory = (c) => {
    const next = filters.categories.includes(c)
      ? filters.categories.filter((x) => x !== c)
      : [...filters.categories, c];
    onChange({ categories: next });
  };

  return (
    <div className="stack gap-5">
      <Section label="Date range">
        <div className="chip-row">
          {Object.entries(RANGES).map(([key, r]) => (
            <button
              key={key}
              type="button"
              className={`chip ${filters.range === key ? "is-active" : ""}`}
              onClick={() => onChange({ range: key })}
            >{r.label}</button>
          ))}
        </div>
      </Section>

      <Section label="Type">
        <div className="chip-row">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`chip ${filters.type === t.value ? "is-active" : ""}`}
              onClick={() => onChange({ type: t.value })}
            >{t.label}</button>
          ))}
        </div>
      </Section>

      <Section label="Status">
        <div className="chip-row">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`chip ${filters.status === s.value ? "is-active" : ""}`}
              onClick={() => onChange({ status: s.value })}
            >{s.label}</button>
          ))}
        </div>
      </Section>

      <Section label={`Categories${filters.categories.length ? ` · ${filters.categories.length} selected` : ""}`}>
        <div className="chip-row">
          {categories.map((c) => {
            const meta = getCategoryMeta(c);
            const on = filters.categories.includes(c);
            return (
              <button
                key={c}
                type="button"
                className={`chip chip-cat ${on ? "is-active" : ""}`}
                onClick={() => toggleCategory(c)}
                style={on ? { borderColor: meta.accent, color: meta.accent } : undefined}
              >
                <span aria-hidden>{meta.icon}</span> {c}
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div className="stack gap-2">
      <div className="filter-label">{label}</div>
      {children}
    </div>
  );
}

export function countActive(filters, defaults) {
  let n = 0;
  if (filters.range !== defaults.range) n++;
  if (filters.type !== defaults.type) n++;
  if (filters.status !== defaults.status) n++;
  if (filters.categories.length) n++;
  return n;
}
