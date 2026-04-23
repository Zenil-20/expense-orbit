import { Input } from "../ui";
import { toInputDate } from "../../lib/format";

const PRESETS = [
  { value: "all",     label: "All time" },
  { value: "daily",   label: "Today" },
  { value: "weekly",  label: "This week" },
  { value: "monthly", label: "This month" },
  { value: "yearly",  label: "This year" },
  { value: "custom",  label: "Custom" },
];

const clampFuture = (value, today) => (value && value > today ? today : value);
const minDate = (a, b) => (a && b ? (a < b ? a : b) : a || b || undefined);

export default function DateRangeChips({ range, onChange, className = "", compact = false }) {
  const setRange = (patch) => onChange({ ...range, ...patch });
  const isCustom = range?.preset === "custom";
  const today = toInputDate(new Date());

  const selectPreset = (preset) => {
    onChange({
      preset,
      startDate: preset === "custom" ? range?.startDate || "" : "",
      endDate:   preset === "custom" ? range?.endDate   || "" : "",
    });
  };

  return (
    <div className={`date-range ${compact ? "date-range-compact" : ""} ${className}`}>
      <div className="date-range-head">
        {!compact && <span className="date-range-label">Date range</span>}
        <div className="chip-row date-range-chips" role="tablist" aria-label="Date range">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              role="tab"
              aria-selected={range?.preset === p.value}
              className={`chip ${range?.preset === p.value ? "is-active" : ""}`}
              onClick={() => selectPreset(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isCustom && (
        <div className="date-range-dates">
          <Input
            label="From"
            type="date"
            name="startDate"
            value={range.startDate || ""}
            onChange={(e) => setRange({ startDate: clampFuture(e.target.value, today) })}
            max={minDate(range.endDate, today)}
          />
          <Input
            label="To"
            type="date"
            name="endDate"
            value={range.endDate || ""}
            onChange={(e) => setRange({ endDate: clampFuture(e.target.value, today) })}
            min={range.startDate || undefined}
            max={today}
          />
        </div>
      )}
    </div>
  );
}

export function describeRange(range) {
  if (!range || range.preset === "all") return "All time";
  if (range.preset === "custom") {
    if (!range.startDate || !range.endDate) return "Custom range";
    return `${range.startDate} → ${range.endDate}`;
  }
  return PRESETS.find((p) => p.value === range.preset)?.label || "All time";
}
