import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import { Link } from "react-router-dom";
import { getCategoryMeta } from "../../lib/categories";
import { formatCurrency, formatShortDate } from "../../lib/format";

export default function ActivityFeed({ expenses }) {
  const items = [...expenses]
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
    .slice(0, 6);

  return (
    <Card
      title="Recent activity"
      subtitle="Latest expenses you've logged"
      action={<Link to="/app/expenses" style={{ fontSize: 12, color: "var(--teal)", fontWeight: 600 }}>View all →</Link>}
    >
      {items.length === 0 ? (
        <EmptyState title="Nothing logged yet" description="Your most recent expenses will show up here." />
      ) : (
        <div className="feed">
          {items.map((e) => {
            const meta = getCategoryMeta(e.category);
            return (
              <div key={e._id} className="feed-item">
                <div className="feed-dot" style={{ background: `${meta.accent}22`, borderColor: `${meta.accent}55` }}>{meta.icon}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="feed-title">{e.name}</div>
                  <div className="feed-sub">{e.category || "Other"} · {formatShortDate(e.date)}</div>
                </div>
                <div className="feed-amt">{formatCurrency(e.amount)}</div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
