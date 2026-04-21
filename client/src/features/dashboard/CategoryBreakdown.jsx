import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import DonutChart from "../../components/charts/DonutChart";
import { getCategoryMeta } from "../../lib/categories";
import { formatCurrency } from "../../lib/format";

export default function CategoryBreakdown({ expenses, limit = 6, title = "Spend by category", subtitle = "Hover a segment to see details" }) {
  const byCategory = expenses.reduce((acc, e) => {
    const key = e.category || "Other";
    acc[key] = (acc[key] || 0) + (Number(e.amount) || 0);
    return acc;
  }, {});
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, limit);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  return (
    <Card title={title} subtitle={subtitle}>
      {entries.length === 0 ? (
        <EmptyState title="No data yet" description="Add expenses to see a breakdown." />
      ) : (
        <div className="ring-wrap">
          <DonutChart entries={entries} size={200} thickness={22} />
          <div className="ring-legend">
            {entries.map(([name, value]) => {
              const meta = getCategoryMeta(name);
              const pct = total ? Math.round((value / total) * 100) : 0;
              return (
                <div key={name} className="ring-legend-row">
                  <span className="ring-legend-label">
                    <span className="ring-dot" style={{ background: meta.accent }} />
                    <span>{meta.icon} {name}</span>
                  </span>
                  <span className="ring-legend-val">{formatCurrency(value)} · {pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
