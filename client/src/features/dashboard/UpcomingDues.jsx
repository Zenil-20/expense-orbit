import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Badge from "../../components/ui/Badge";
import { getCategoryMeta } from "../../lib/categories";
import { dueLabel, formatCurrency, daysUntil } from "../../lib/format";

export default function UpcomingDues({ expenses }) {
  const items = expenses
    .filter((e) => e.type === "recurring" && e.nextDueDate)
    .map((e) => ({ ...e, _d: daysUntil(e.nextDueDate) }))
    .filter((e) => e._d !== null && e._d <= 14)
    .sort((a, b) => a._d - b._d)
    .slice(0, 6);

  return (
    <Card title="Upcoming dues" subtitle="Recurring expenses in the next 14 days">
      {items.length === 0 ? (
        <EmptyState title="Nothing due soon" description="You're on top of things." />
      ) : (
        <div className="exp-list">
          {items.map((e) => {
            const meta = getCategoryMeta(e.category);
            const variant = e._d < 0 ? "danger" : e._d === 0 ? "warning" : "info";
            return (
              <div key={e._id} className="exp-row">
                <div className="exp-icon" style={{ background: `${meta.accent}22`, borderColor: `${meta.accent}55` }}>{meta.icon}</div>
                <div className="exp-meta">
                  <div className="exp-name">{e.name}</div>
                  <div className="exp-sub">{e.category || "Other"} · {e.recurringType}</div>
                </div>
                <div className="exp-amount">{formatCurrency(e.amount)}</div>
                <Badge variant={variant}>{dueLabel(e.nextDueDate)}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
