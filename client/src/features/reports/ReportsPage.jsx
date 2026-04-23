import { useMemo, useState } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Drawer from "../../components/ui/Drawer";
import EmptyState from "../../components/ui/EmptyState";
import KpiTile from "../../components/charts/KpiTile";
import AreaChart from "../../components/charts/AreaChart";
import BarChart from "../../components/charts/BarChart";
import DonutChart from "../../components/charts/DonutChart";
import FilterForm, { countActive } from "../../components/filters/FilterForm";
import DateRangeChips, { describeRange } from "../../components/filters/DateRangeChips";
import { useExpenses } from "../expenses/useExpenses";
import { useExpenseFilters, DEFAULTS as FILTER_DEFAULTS } from "../expenses/useExpenseFilters";
import { useToast } from "../../context/ToastContext";
import { getToken } from "../../lib/auth";
import { computeKpis, monthlySeries, categoryBreakdown, typeBreakdown } from "../dashboard/analytics";
import { formatCurrency } from "../../lib/format";
import { getCategoryMeta } from "../../lib/categories";

const API_ROOT = import.meta.env.VITE_API_ROOT || "/api";
const TREND_OPTIONS = [
  { value: 6,  label: "6 months" },
  { value: 12, label: "12 months" },
  { value: 24, label: "24 months" }
];

export default function ReportsPage() {
  const { expenses, loading, range, setRange } = useExpenses();
  const { filtered, filters, update, reset } = useExpenseFilters(expenses);
  const toast = useToast();
  const [trendMonths, setTrendMonths] = useState(12);
  const [downloading, setDownloading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilters = countActive(filters, FILTER_DEFAULTS);

  const k = useMemo(() => computeKpis(filtered), [filtered]);
  const monthly = useMemo(() => monthlySeries(filtered, trendMonths), [filtered, trendMonths]);
  const cats = useMemo(() => categoryBreakdown(filtered, 10), [filtered]);
  const types = useMemo(() => typeBreakdown(filtered), [filtered]);
  const statusMix = useMemo(() => buildStatusMix(filtered), [filtered]);

  const catBars = cats.map(([name, value]) => ({
    label: name,
    value,
    color: getCategoryMeta(name).accent
  }));

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API_ROOT}/expenses/statement.pdf`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SLA-ExpenseOrbit-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success("SLA statement ready", "The PDF has been downloaded.");
    } catch (err) {
      toast.error("Couldn't generate PDF", err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="page-transition">
      <div className="page-head">
        <div>
          <div className="page-title">Analytics</div>
          <div className="page-sub">Filter, slice, and drill into every rupee — then export an SLA statement.</div>
        </div>
        <div className="row gap-3 wrap">
          <div className="filter-trigger-wrap">
            <Button variant="secondary" onClick={() => setFiltersOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M6 12h12M10 18h4" /></svg>
              Filters
            </Button>
            {activeFilters > 0 && <span className="filter-trigger-count">{activeFilters}</span>}
          </div>
          <Button variant="primary" onClick={downloadPdf} loading={downloading}>
            Download SLA PDF
          </Button>
        </div>
      </div>

      <div className="filter-bar filter-range-bar" style={{ marginBottom: 18 }}>
        <DateRangeChips range={range} onChange={setRange} />
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 400 }} />
      ) : expenses.length === 0 ? (
        <EmptyState
          title={range.preset === "all" ? "No expenses to analyze yet" : "No expenses in this range"}
          description={
            range.preset === "all"
              ? "Add a few expenses and return here for charts, filters, and a printable statement."
              : `Nothing found for ${describeRange(range)}. Try a wider range.`
          }
          action={range.preset !== "all" ? <Button variant="secondary" onClick={() => setRange({ preset: "all", startDate: "", endDate: "" })}>Show all time</Button> : null}
        />
      ) : (
        <>
          {activeFilters > 0 && (
            <div className="row gap-3 wrap" style={{ marginBottom: 20, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text-soft)" }}>
                <strong style={{ color: "#F8FAFC" }}>{filtered.length}</strong> of {expenses.length} expenses match {activeFilters} active filter{activeFilters > 1 ? "s" : ""}.
              </span>
              <Button size="sm" variant="ghost" onClick={reset}>Reset filters</Button>
            </div>
          )}

          {filtered.length === 0 ? (
            <EmptyState
              title="No expenses match these filters"
              description="Loosen a filter or reset to see everything."
              action={<Button variant="secondary" onClick={reset}>Reset filters</Button>}
            />
          ) : (
            <div className="stack gap-5">
              <div className="stats-grid">
                <KpiTile label="Total in view" value={k.total} accent="var(--accent)" hint={`${filtered.length} of ${expenses.length} expenses`} />
                <KpiTile label="Paid"          value={statusMix.paid.value}    accent="var(--mint)"   hint={`${statusMix.paid.count} items`} />
                <KpiTile label="Pending"       value={statusMix.pending.value} accent="var(--warning)" hint={`${statusMix.pending.count} items`} />
                <KpiTile label="Overdue"       value={statusMix.overdue.value} accent="var(--rose)"   hint={statusMix.overdue.count ? `${statusMix.overdue.count} items` : "All clear"} />
              </div>

              <Card
                title="Spend trend"
                subtitle="Monthly totals — hover the line to inspect any month"
                action={
                  <div className="chart-toolbar">
                    {TREND_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        className={`chart-toolbar-btn ${trendMonths === o.value ? "is-active" : ""}`}
                        onClick={() => setTrendMonths(o.value)}
                      >{o.label}</button>
                    ))}
                  </div>
                }
              >
                <AreaChart data={monthly} color="#F2B857" height={260} label="Monthly total" />
              </Card>

              <div className="dash-grid">
                <Card title="Category ranking" subtitle="Top categories by amount — hover a row for share">
                  {catBars.length === 0 ? <EmptyState title="No data" /> : (
                    <BarChart data={catBars} orientation="horizontal" height={Math.max(220, catBars.length * 36)} />
                  )}
                </Card>

                <Card title="Category share" subtitle="Percent of total spend">
                  {cats.length === 0 ? <EmptyState title="No data" /> : (
                    <DonutChart entries={cats} size={220} thickness={24} />
                  )}
                </Card>
              </div>

              <div className="dash-grid">
                <Card title="Spend by type" subtitle="Recurring vs one-time vs flexible">
                  {types.every((t) => t.value === 0) ? <EmptyState title="No data" /> : (
                    <BarChart data={types} height={240} />
                  )}
                </Card>

                <Card title="Payment status" subtitle="Amount by status">
                  <BarChart
                    data={[
                      { label: "Paid",    value: statusMix.paid.value,    color: "#22C55E" },
                      { label: "Pending", value: statusMix.pending.value, color: "#F2B857" },
                      { label: "Overdue", value: statusMix.overdue.value, color: "#F87171" }
                    ]}
                    height={240}
                  />
                </Card>
              </div>
            </div>
          )}
        </>
      )}

      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        subtitle={`${filtered.length} of ${expenses.length} expenses match`}
        footer={
          <>
            <Button variant="ghost" onClick={reset} disabled={activeFilters === 0}>Reset all</Button>
            <Button variant="primary" onClick={() => setFiltersOpen(false)}>
              Apply {activeFilters > 0 && `(${activeFilters})`}
            </Button>
          </>
        }
      >
        <FilterForm filters={filters} onChange={update} />
      </Drawer>
    </div>
  );
}

function buildStatusMix(expenses) {
  const out = { paid: { value: 0, count: 0 }, pending: { value: 0, count: 0 }, overdue: { value: 0, count: 0 } };
  for (const e of expenses) {
    const bucket = out[e.status] || out.pending;
    bucket.value += Number(e.amount) || 0;
    bucket.count += 1;
  }
  return out;
}
