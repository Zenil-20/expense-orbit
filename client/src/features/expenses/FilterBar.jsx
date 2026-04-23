import { Input, Select } from "../../components/ui";
import DateRangeChips from "../../components/filters/DateRangeChips";
import { DEFAULT_CATEGORIES } from "../../lib/categories";

const TYPES = [
  { value: "", label: "All types" },
  { value: "recurring", label: "Recurring" },
  { value: "one-time", label: "One-time" },
  { value: "flexible", label: "Flexible" }
];
const STATUSES = [
  { value: "", label: "Any status" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" }
];

export default function FilterBar({ value, onChange, range, onRangeChange, categories }) {
  const set = (key, v) => onChange({ ...value, [key]: v });
  const cats = categories?.length ? categories : DEFAULT_CATEGORIES;

  return (
    <div className="stack gap-3" style={{ marginBottom: 18 }}>
      <div className="filter-bar filter-range-bar">
        <DateRangeChips range={range} onChange={onRangeChange} />
      </div>

      <div className="filter-bar">
        <Input label="Search" name="q" placeholder="Name contains…" value={value.q} onChange={(e) => set("q", e.target.value)} />
        <Select label="Type" value={value.type} onChange={(e) => set("type", e.target.value)}>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
        <Select label="Category" value={value.category} onChange={(e) => set("category", e.target.value)}>
          <option value="">All categories</option>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select label="Status" value={value.status} onChange={(e) => set("status", e.target.value)}>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
      </div>
    </div>
  );
}
