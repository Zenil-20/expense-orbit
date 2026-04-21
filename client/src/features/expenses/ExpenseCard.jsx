import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
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

  return (
    <div className="exp-row">
      <div className="exp-icon" style={{ background: `${meta.accent}22`, borderColor: `${meta.accent}55` }}>{meta.icon}</div>
      <div className="exp-meta">
        <div className="exp-name">{expense.name}</div>
        <div className="exp-sub">
          {expense.category || "Other"} · {typeLabel(expense.type, expense.recurringType)}
          {showDue && <> · Next: {dueLabel(expense.nextDueDate)}</>}
          {!showDue && expense.date && <> · {formatDate(expense.date)}</>}
        </div>
      </div>
      <div className="exp-amount">{formatCurrency(expense.amount)}</div>
      <div className="exp-actions">
        <Badge variant={status.variant}>{status.label}</Badge>
        {expense.status !== "paid" && (
          <Button variant="secondary" size="sm" onClick={() => onMarkPaid(expense)}>Mark paid</Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => onEdit(expense)}>Edit</Button>
        {expense.type === "recurring" && onTestOverdue && (
          <Button variant="ghost" size="sm" onClick={() => onTestOverdue(expense)}>Test email</Button>
        )}
        <Button variant="danger" size="sm" onClick={() => onDelete(expense)}>Delete</Button>
      </div>
    </div>
  );
}

function typeLabel(type, recurring) {
  if (type === "recurring") return `Recurring · ${recurring || "—"}`;
  if (type === "flexible") return "Flexible";
  return "One-time";
}
