import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import KpiTile from "../../components/charts/KpiTile";
import HeroCard from "./HeroCard";
import ActivityFeed from "./ActivityFeed";
import UpcomingDues from "./UpcomingDues";
import { useExpenses } from "../expenses/useExpenses";
import { useAuth } from "../../context/AuthContext";
import { computeKpis, monthlySeries, categoryBreakdown } from "./analytics";

export default function DashboardPage() {
  const { user } = useAuth();
  const { expenses, loading } = useExpenses();

  const k = loading ? null : computeKpis(expenses);
  const series = loading ? [] : monthlySeries(expenses, 6).map((m) => m.value);
  const cats = loading ? [] : categoryBreakdown(expenses, 6);

  return (
    <div className="page-transition">
      <div className="page-head">
        <div>
          <div className="page-title">Hi {firstName(user?.name)}.</div>
          <div className="page-sub">Here's the state of your money right now.</div>
        </div>
        <div className="row gap-3 wrap">
          <Link to="/app/reports"><Button variant="secondary">Analytics & PDF →</Button></Link>
          <Link to="/app/expenses?new=1"><Button variant="primary">+ Add expense</Button></Link>
        </div>
      </div>

      {loading ? (
        <SkeletonDashboard />
      ) : (
        <div className="stack gap-5">
          <HeroCard
            thisMonth={k.thisMonth}
            lastMonth={k.lastMonth}
            delta={typeof k.delta === "number" ? k.delta : undefined}
            categoryEntries={cats}
          />

          <div className="stats-grid">
            <KpiTile
              compact
              label="Total tracked"
              value={k.total}
              accent="var(--accent)"
              hint={`${expenses.length} expenses`}
              spark={series}
            />
            <KpiTile
              compact
              label="Upcoming (14 days)"
              value={k.upcoming}
              accent="var(--mint)"
              hint={k.upcomingCount ? `${k.upcomingCount} due soon` : "Nothing due soon"}
            />
            <KpiTile
              compact
              label="Overdue"
              value={k.overdue}
              accent="var(--rose)"
              hint={k.overdueCount ? `${k.overdueCount} past due` : "All clear"}
            />
            <KpiTile
              compact
              label="Avg per expense"
              value={expenses.length ? Math.round(k.total / expenses.length) : 0}
              accent="var(--teal)"
              hint="Mean amount"
            />
          </div>

          <div className="dash-grid">
            <ActivityFeed expenses={expenses} />
            <UpcomingDues expenses={expenses} />
          </div>
        </div>
      )}
    </div>
  );
}

function firstName(name) { return name ? name.trim().split(/\s+/)[0] : "there"; }

function SkeletonDashboard() {
  return (
    <div className="stack gap-5">
      <div className="skeleton" style={{ height: 180, borderRadius: 28 }} />
      <div className="stats-grid">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 120 }} />)}
      </div>
      <div className="dash-grid">
        <div className="skeleton" style={{ height: 280 }} />
        <div className="skeleton" style={{ height: 280 }} />
      </div>
    </div>
  );
}
