import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";
import { formatCurrency } from "../../lib/format";
import { avatarColor, initials } from "./utils";
import { useGroup } from "./useGroups";
import SplitForm from "./SplitForm";
import SplitCard from "./SplitCard";
import { useFriends } from "./useFriends";
import AddMembersModal from "./AddMembersModal";

export default function GroupDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const { user } = useAuth();
  const { data, loading, error, reload } = useGroup(id);
  const { friends } = useFriends();

  const [addOpen, setAddOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [settling, setSettling] = useState(false);

  if (loading && !data) {
    return (
      <div className="page-transition stack gap-3">
        <div className="skeleton" style={{ height: 60 }} />
        <div className="skeleton" style={{ height: 120 }} />
        <div className="skeleton" style={{ height: 80 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-transition">
        <Link to="/app/splitwise" className="link-btn" style={{ display: "inline-block", marginBottom: 12 }}>← Back to groups</Link>
        <EmptyState title="Couldn't open group" description={error} />
      </div>
    );
  }
  if (!data) return null;

  const { group, expenses, balances, settlement } = data;
  const isSettled = group.status === "settled";

  // Group members sorted: current user first, others by name. Used in the form.
  const groupFriends = group.members
    .filter((m) => String(m._id) !== String(user.id))
    .map((m) => ({ _id: m._id, name: m.name, email: m.email }));

  const onAddExpense = async ({ endpoint, payload }) => {
    setSubmitting(true);
    try {
      const enriched = { ...payload, group: group._id };
      if (endpoint === "equal") await api.createEqualSplit(enriched);
      else await api.createUnequalSplit(enriched);
      toast.success("Expense added", payload.name);
      setAddOpen(false);
      await reload();
    } catch (err) {
      toast.error("Couldn't add expense", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onSettleUp = async () => {
    setSettling(true);
    try {
      const res = await api.settleGroup(group._id);
      if (res.legs?.length === 0) toast.success("Already even", res.message || "Nothing to settle");
      else toast.success("Settle-up plan ready", `${res.legs.length} payment${res.legs.length === 1 ? "" : "s"} to make`);
      await reload();
    } catch (err) {
      toast.error("Couldn't compute settlement", err.message);
    } finally {
      setSettling(false);
    }
  };

  const onMarkPaid = async (legId) => {
    try {
      const res = await api.markSettlementPaid(group._id, legId);
      if (res.allSettled) {
        toast.success("All settled! 🎉", "Everyone in the group has been notified by email.");
      } else {
        toast.success("Marked paid");
      }
      await reload();
    } catch (err) {
      toast.error("Couldn't update", err.message);
    }
  };

  return (
    <div className="page-transition">
      <Link to="/app/splitwise" className="link-btn" style={{ display: "inline-block", marginBottom: 12 }}>← Back to groups</Link>

      <div className="page-head">
        <div style={{ minWidth: 0 }}>
          <div className="page-title" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span>{group.name}</span>
            {isSettled && <span className="badge badge-success">Settled</span>}
            {!isSettled && group.status === "settling" && <span className="badge badge-info">Settling up</span>}
          </div>
          <div className="page-sub">
            {group.members.length} members · created by {String(group.createdBy._id) === String(user.id) ? "you" : group.createdBy.name}
          </div>
        </div>
        {!isSettled && (
          <Button variant="primary" onClick={() => setAddOpen(true)}>+ Add expense</Button>
        )}
      </div>

      {/* Members strip */}
      <div className="group-members-strip">
        {group.members.map((m) => {
          const isMe = String(m._id) === String(user.id);
          return (
            <div key={m._id} className="group-member-pill" title={`${m.name} · ${m.email}`}>
              <span className="chip-avatar" title={isMe ? `${m.name} (you)` : m.name} style={{ background: avatarColor(m._id) }}>
                {initials(m.name)}
              </span>
              <span>{isMe ? "You" : m.name}</span>
            </div>
          );
        })}
        {!isSettled && (
          <button type="button" className="group-member-add" onClick={() => setMembersOpen(true)}>
            <span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            <span>Add members</span>
          </button>
        )}
      </div>

      {isSettled && (
        <div className="settle-banner">
          <div className="settle-banner-emoji">🎉</div>
          <div>
            <div className="settle-banner-title">All settled</div>
            <div className="settle-banner-sub">
              Every payment in this group has been confirmed. We've emailed everyone the good news.
            </div>
          </div>
        </div>
      )}

      {/* Balance grid */}
      <div className="balance-grid">
        {balances.map((b) => {
          const isMe = String(b.user._id) === String(user.id);
          const tone = b.net > 0.01 ? "pos" : b.net < -0.01 ? "neg" : "zero";
          return (
            <div key={b.user._id} className={`balance-card balance-${tone}`} title={`${b.user.name} · ${b.user.email}`}>
              <span className="chip-avatar" title={isMe ? `${b.user.name} (you)` : b.user.name} style={{ background: avatarColor(b.user._id), width: 36, height: 36, fontSize: 12 }}>
                {initials(b.user.name)}
              </span>
              <div className="balance-meta">
                <div className="balance-name">{isMe ? "You" : b.user.name}</div>
                <div className="balance-amt">
                  {tone === "pos" && <>+{formatCurrency(b.net)} <span className="balance-tag">owed</span></>}
                  {tone === "neg" && <>-{formatCurrency(Math.abs(b.net))} <span className="balance-tag">owes</span></>}
                  {tone === "zero" && <>{formatCurrency(0)} <span className="balance-tag">even</span></>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Settlement plan */}
      {settlement && settlement.legs.length > 0 && !isSettled && (
        <div className={`settle-panel ${settlement.stale ? "is-stale" : ""}`}>
          {settlement.stale && (
            <div className="settle-stale">
              <div>
                <div className="settle-stale-title">Plan is out of date</div>
                <div className="settle-stale-sub">An expense was added since this plan was generated. Regenerate to use current balances. Already-paid legs are kept.</div>
              </div>
              <Button size="sm" variant="primary" onClick={onSettleUp} loading={settling}>Regenerate plan</Button>
            </div>
          )}
          <div className="settle-panel-head">
            <div>
              <div className="settle-panel-title">Settle-up plan</div>
              <div className="settle-panel-sub">
                {settlement.legs.filter((l) => l.status === "pending").length} of {settlement.legs.length} payment(s) remaining.
                Anyone in a payment can mark it done.
              </div>
            </div>
          </div>
          <ul className="settle-list">
            {settlement.legs.map((leg) => {
              const iAmFrom = String(leg.from._id) === String(user.id);
              const iAmTo = String(leg.to._id) === String(user.id);
              const canMark = (iAmFrom || iAmTo) && leg.status === "pending";
              return (
                <li key={leg._id} className={`settle-leg ${leg.status === "paid" ? "is-paid" : ""}`}>
                  <span className="chip-avatar" style={{ background: avatarColor(leg.from._id) }}>{initials(leg.from.name)}</span>
                  <div className="settle-leg-arrow">→</div>
                  <span className="chip-avatar" style={{ background: avatarColor(leg.to._id) }}>{initials(leg.to.name)}</span>
                  <div className="settle-leg-meta">
                    <div className="settle-leg-line">
                      <strong>{iAmFrom ? "You" : leg.from.name}</strong> {leg.status === "paid" ? "paid" : "pays"}{" "}
                      <strong>{iAmTo ? "You" : leg.to.name}</strong>
                    </div>
                    <div className="settle-leg-amt">{formatCurrency(leg.amount)}</div>
                  </div>
                  {canMark ? (
                    <Button size="sm" variant="primary" onClick={() => onMarkPaid(leg._id)}>Mark paid</Button>
                  ) : leg.status === "paid" ? (
                    <span className="badge badge-success">Paid</span>
                  ) : (
                    <span className="badge badge-info">Pending</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Settle-up CTA */}
      {!settlement && expenses.length > 0 && !isSettled && (
        <div className="settle-cta">
          <div>
            <div className="settle-cta-title">Trip done?</div>
            <div className="settle-cta-sub">Generate the simplified payment plan — fewest transactions to balance everyone.</div>
          </div>
          <Button variant="primary" onClick={onSettleUp} loading={settling}>Settle up</Button>
        </div>
      )}

      {/* Expenses list */}
      <div className="section-head">
        <div className="section-title">Expenses</div>
        <div className="section-meta">{expenses.length} total</div>
      </div>

      {expenses.length === 0 ? (
        <EmptyState
          title="No expenses yet"
          description="Add the first shared expense to get this group rolling."
          action={!isSettled ? <Button variant="primary" onClick={() => setAddOpen(true)}>+ Add expense</Button> : null}
        />
      ) : (
        <div className="exp-list">
          {expenses.map((exp) => (
            <SplitCard key={exp._id} expense={exp} currentUserId={user.id} />
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add expense to group" size="lg">
        <SplitForm
          onSubmit={onAddExpense}
          onCancel={() => setAddOpen(false)}
          submitting={submitting}
          friends={groupFriends}
        />
      </Modal>

      <AddMembersModal
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        group={group}
        friends={friends}
        onAdded={reload}
      />
    </div>
  );
}
