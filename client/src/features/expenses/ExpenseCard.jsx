import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Menu from "../../components/ui/Menu";
import { getCategoryMeta } from "../../lib/categories";
import { formatCurrency, formatDate, dueLabel } from "../../lib/format";

const STATUS = {
  pending: { variant: "info",    label: "Pending" },
  paid:    { variant: "success", label: "Paid" },
  overdue: { variant: "danger",  label: "Overdue" }
};

export default function ExpenseCard({ expense, onEdit, onDelete, onMarkPaid, onTestOverdue }) {
  const meta = getCategoryMeta(expense.category);
  const status = STATUS[expense.status] || STATUS.pending;
  const showDue = expense.type === "recurring" && expense.nextDueDate;

  const menuItems = [
    { label: "Edit", icon: <Icon d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />, onClick: () => onEdit(expense) },
    expense.type === "recurring" && onTestOverdue && {
      label: "Send test email",
      icon: <Icon d="M4 4h16v16H4zM4 4l8 8 8-8" />,
      onClick: () => onTestOverdue(expense)
    },
    { divider: true },
    { label: "Delete", icon: <Icon d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />, onClick: () => onDelete(expense), danger: true }
  ];

  return (
    <article className="exp-card">
      <div className="exp-card-main">
        <div className="exp-icon" style={{ background: `${meta.accent}22`, borderColor: `${meta.accent}55` }}>{meta.icon}</div>
        <div className="exp-meta">
          <div className="exp-name">{expense.name}</div>
          <div className="exp-sub">
            {expense.category || "Other"} · {typeLabel(expense.type, expense.recurringType)}
            {showDue && <> · {dueLabel(expense.nextDueDate)}</>}
            {!showDue && expense.date && <> · {formatDate(expense.date)}</>}
          </div>
        </div>
        <div className="exp-amount-block">
          <div className="exp-amount">{formatCurrency(expense.amount)}</div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </div>
      <div className="exp-card-actions">
        {expense.status !== "paid" && (
          <Button variant="primary" size="sm" onClick={() => onMarkPaid(expense)}>
            Mark paid
          </Button>
        )}
        <Menu items={menuItems} />
      </div>
    </article>
  );
}

function Icon({ d }) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

function typeLabel(type, recurring) {
  if (type === "recurring") return `Recurring · ${recurring || "—"}`;
  if (type === "flexible") return "Flexible";
  return "One-time";
}
