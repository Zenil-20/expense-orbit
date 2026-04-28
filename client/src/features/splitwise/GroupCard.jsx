import { Link } from "react-router-dom";
import { formatCurrency } from "../../lib/format";
import { avatarColor, initials } from "./utils";

export default function GroupCard({ group }) {
  const isSettled = group.status === "settled";
  const netTone = group.myNet > 0.01 ? "pos" : group.myNet < -0.01 ? "neg" : "zero";

  return (
    <Link to={`/app/splitwise/groups/${group._id}`} className="group-card">
      <div className="group-card-row">
        <div className="group-card-meta">
          <div className="group-card-name">{group.name}</div>
          <div className="group-card-sub">
            {group.memberCount} {group.memberCount === 1 ? "member" : "members"} ·{" "}
            {group.expenseCount} {group.expenseCount === 1 ? "expense" : "expenses"} ·{" "}
            {formatCurrency(group.totalSpent)} total
          </div>
        </div>

        <div className="group-card-right">
          {isSettled ? (
            <span className="badge badge-success">Settled</span>
          ) : group.status === "settling" ? (
            <span className="badge badge-info">Settling up</span>
          ) : null}

          {netTone === "pos" && (
            <div className="group-card-net group-card-net-pos">
              +{formatCurrency(group.myNet)}
              <span className="group-card-net-label">you're owed</span>
            </div>
          )}
          {netTone === "neg" && (
            <div className="group-card-net group-card-net-neg">
              -{formatCurrency(Math.abs(group.myNet))}
              <span className="group-card-net-label">you owe</span>
            </div>
          )}
          {netTone === "zero" && (
            <div className="group-card-net" style={{ color: "var(--text-soft)" }}>
              {formatCurrency(0)}
              <span className="group-card-net-label">all even</span>
            </div>
          )}
        </div>
      </div>

      <div className="group-card-avatars">
        {group.members.slice(0, 5).map((m, i) => (
          <span
            key={m._id}
            className="chip-avatar split-avatar-stack"
            style={{ background: avatarColor(m._id), zIndex: 5 - i }}
            title={m.name}
          >
            {initials(m.name)}
          </span>
        ))}
        {group.members.length > 5 && (
          <span className="chip-avatar split-avatar-stack split-avatar-more">+{group.members.length - 5}</span>
        )}
      </div>
    </Link>
  );
}
