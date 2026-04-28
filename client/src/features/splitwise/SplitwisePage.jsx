import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";
import { formatCurrency } from "../../lib/format";
import { useSplitwise } from "./useSplitwise";
import { useFriends } from "./useFriends";
import { useGroups } from "./useGroups";
import { userPosition } from "./utils";
import SplitCard from "./SplitCard";
import SplitForm from "./SplitForm";
import FriendsModal from "./FriendsModal";
import GroupCard from "./GroupCard";
import CreateGroupModal from "./CreateGroupModal";

export default function SplitwisePage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { expenses, summary, loading: loadingSplits, reload: reloadSplits } = useSplitwise();
  const friendsState = useFriends();
  const { groups, loading: loadingGroups, reload: reloadGroups } = useGroups();

  const [addSplitOpen, setAddSplitOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const activeGroups   = useMemo(() => groups.filter((g) => g.status !== "settled"), [groups]);
  const settledGroups  = useMemo(() => groups.filter((g) => g.status === "settled"), [groups]);

  const onSubmitSplit = async ({ endpoint, payload }) => {
    setSubmitting(true);
    try {
      if (endpoint === "equal") await api.createEqualSplit(payload);
      else await api.createUnequalSplit(payload);
      toast.success("Split added", payload.name);
      setAddSplitOpen(false);
      await reloadSplits();
    } catch (err) {
      toast.error("Couldn't add split", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-transition">
      <div className="page-head">
        <div>
          <div className="page-title">Splitwise</div>
          <div className="page-sub">Trips, roommates, dinners — share expenses with friends and settle up cleanly.</div>
        </div>
        <div className="row gap-2 wrap">
          <Button variant="secondary" onClick={() => setFriendsOpen(true)}>
            Friends
            {friendsState.incoming.length > 0 && (
              <span className="badge badge-danger" style={{ marginLeft: 6 }}>{friendsState.incoming.length}</span>
            )}
          </Button>
          <Button variant="primary" onClick={() => setCreateGroupOpen(true)}>+ New group</Button>
        </div>
      </div>

      {/* Overall personal balance summary */}
      <div className="split-summary">
        <SummaryCard label="You're owed"  value={summary.youAreOwed} tone="pos" />
        <SummaryCard label="You owe"      value={summary.youOwe}     tone="neg" />
        <SummaryCard label="Net (personal)" value={summary.net}      tone={summary.net >= 0 ? "pos" : "neg"} emphasize />
      </div>

      {/* Groups */}
      <div className="section-head">
        <div className="section-title">Groups</div>
        <div className="section-meta">{activeGroups.length} active</div>
      </div>

      {loadingGroups && groups.length === 0 ? (
        <div className="stack gap-3">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 110 }} />)}
        </div>
      ) : activeGroups.length === 0 && settledGroups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          description="Create a group for your trip, flat, or recurring shared expenses. All members will see every expense and the balance."
          action={<Button variant="primary" onClick={() => setCreateGroupOpen(true)}>+ Create your first group</Button>}
        />
      ) : (
        <div className="group-list">
          {activeGroups.map((g) => <GroupCard key={g._id} group={g} />)}
        </div>
      )}

      {settledGroups.length > 0 && (
        <>
          <div className="section-head" style={{ marginTop: 28 }}>
            <div className="section-title" style={{ color: "var(--text-mute)" }}>Settled groups</div>
            <div className="section-meta">{settledGroups.length}</div>
          </div>
          <div className="group-list">
            {settledGroups.map((g) => <GroupCard key={g._id} group={g} />)}
          </div>
        </>
      )}

      {/* Personal (ad-hoc, non-group) splits */}
      <div className="section-head" style={{ marginTop: 28 }}>
        <div className="section-title">One-off splits</div>
        <Button size="sm" variant="ghost" onClick={() => setAddSplitOpen(true)} disabled={friendsState.friends.length === 0}>+ Add</Button>
      </div>

      {loadingSplits && expenses.length === 0 ? (
        <div className="stack gap-3">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 84 }} />)}
        </div>
      ) : expenses.length === 0 ? (
        <EmptyState
          title="No one-off splits"
          description="Use this for quick splits with friends that don't belong to a group — like splitting a single dinner."
        />
      ) : (
        <div className="exp-list">
          {expenses.map((exp) => (
            <SplitCard key={exp._id} expense={exp} currentUserId={user.id} />
          ))}
        </div>
      )}

      <Modal open={addSplitOpen} onClose={() => setAddSplitOpen(false)} title="Add a one-off split" size="lg">
        <SplitForm
          onSubmit={onSubmitSplit}
          onCancel={() => setAddSplitOpen(false)}
          submitting={submitting}
          friends={friendsState.friends}
          onManageFriends={() => { setAddSplitOpen(false); setFriendsOpen(true); }}
        />
      </Modal>

      <CreateGroupModal
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        friends={friendsState.friends}
        onCreated={(g) => { reloadGroups(); navigate(`/app/splitwise/groups/${g._id}`); }}
        onManageFriends={() => { setCreateGroupOpen(false); setFriendsOpen(true); }}
      />

      <FriendsModal
        open={friendsOpen}
        onClose={() => setFriendsOpen(false)}
        friends={friendsState.friends}
        incoming={friendsState.incoming}
        outgoing={friendsState.outgoing}
        reload={friendsState.reload}
      />
    </div>
  );
}

function SummaryCard({ label, value, tone, emphasize }) {
  const cls = tone === "pos" ? "split-summary-pos" : "split-summary-neg";
  return (
    <div className={`split-summary-card ${emphasize ? "is-emph" : ""}`}>
      <div className="split-summary-label">{label}</div>
      <div className={`split-summary-value ${cls}`}>
        {tone === "pos" ? "+" : value === 0 ? "" : "-"}{formatCurrency(Math.abs(value))}
      </div>
    </div>
  );
}
