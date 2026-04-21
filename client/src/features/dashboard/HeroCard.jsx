import DonutChart from "../../components/charts/DonutChart";
import { formatCurrency } from "../../lib/format";

export default function HeroCard({ thisMonth, lastMonth, delta, categoryEntries }) {
  return (
    <div className="hero-card">
      <div>
        <div className="hero-label">This month so far</div>
        <div className="hero-value">{formatCurrency(thisMonth)}</div>
        <div className="hero-sub">
          {typeof delta === "number" ? (
            <>
              <span className={`kpi-delta ${delta >= 0 ? "up" : "down"}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: delta >= 0 ? "none" : "rotate(180deg)" }}>
                  <path d="M7 14l5-5 5 5" />
                </svg>
                {Math.abs(delta).toFixed(1)}%
              </span>
              <span style={{ marginLeft: 10 }}>vs {formatCurrency(lastMonth)} last month</span>
            </>
          ) : (
            <span>Track a few more months to see how you're trending.</span>
          )}
        </div>
      </div>
      <div className="hero-ring">
        {categoryEntries.length > 0 ? (
          <DonutChart entries={categoryEntries.slice(0, 5)} size={140} thickness={14} />
        ) : (
          <div style={{ width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-mute)", fontSize: 12 }}>
            No spend yet
          </div>
        )}
      </div>
    </div>
  );
}
