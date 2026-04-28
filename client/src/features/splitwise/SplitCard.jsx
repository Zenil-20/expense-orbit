import Badge from "../../components/ui/Badge";
import { formatCurrency, formatDate } from "../../lib/format";
import { avatarColor, initials, userPosition } from "./utils";

export default function SplitCard({ expense, currentUserId }) {
  const pos = userPosition(expense, currentUserId);
  const payerIsMe = String(expense.paidBy._id) === String(currentUserId);
  const payerName = payerIsMe ? "You" : expense.paidBy.name;

  return (
    <article className="split-card">
      <div className="split-card-main">
        <div className="split-avatars" aria-label={`${expense.splitBetween.length} participant${expense.splitBetween.length === 1 ? "" : "s"}`}>
          {expense.splitBetween.slice(0, 4).map((u, idx) => {
            const isMe = String(u._id) === String(currentUserId);
            return (
              <span
                key={u._id}
                className="chip-avatar split-avatar-stack"
                style={{ background: avatarColor(u._id), zIndex: 4 - idx }}
                title={isMe ? `${u.name} (you)` : u.name}
              >
                {initials(u.name)}
              </span>
            );
          })}
          {expense.splitBetween.length > 4 && (
            <span
              className="chip-avatar split-avatar-stack split-avatar-more"
              title={expense.splitBetween.slice(4).map((u) => u.name).join(", ")}
            >
              +{expense.splitBetween.length - 4}
            </span>
          )}
        </div>

        <div className="split-meta">
          <div className="split-name">{expense.name}</div>
          <div className="split-sub">
            <span title={payerIsMe ? expense.paidBy.name : payerName}>{payerName} paid {formatCurrency(expense.amount)}</span>
            <span className="split-sub-sep">·</span>
            <span>{formatDate(expense.date)}</span>
            <span className="split-sub-sep">·</span>
            <span style={{ textTransform: "capitalize" }}>{expense.splitType}</span>
          </div>
        </div>

        <div className="split-amount-block">
          <div className="split-amount">{formatCurrency(expense.amount)}</div>
          {pos.role === "lender" && (
            <span className="split-tag split-tag-pos" title={`Others owe you ${formatCurrency(pos.amount)} from this expense`}>
              +{formatCurrency(pos.amount)} owed
            </span>
          )}
          {pos.role === "borrower" && (
            <span className="split-tag split-tag-neg" title={`You owe ${formatCurrency(pos.amount)} for this expense`}>
              -{formatCurrency(pos.amount)} you owe
            </span>
          )}
          {pos.role === "settled" && (
            <Badge variant="muted">Not in</Badge>
          )}
        </div>
      </div>
    </article>
  );
}
