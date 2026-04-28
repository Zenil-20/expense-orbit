import { useEffect, useMemo, useState } from "react";
import { Input, Select, Button } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { toInputDate } from "../../lib/format";
import UserPicker from "./UserPicker";
import { avatarColor, initials, round2 } from "./utils";

const PAY_OPTIONS = [
  { value: "me",   label: "You" }
  // Filled in dynamically with selected participants below.
];

export default function SplitForm({ onSubmit, onCancel, submitting, friends = [], onManageFriends }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toInputDate(new Date()));
  const [participants, setParticipants] = useState([]); // other users
  const [paidBy, setPaidBy] = useState("me");           // "me" or another user's _id
  const [splitType, setSplitType] = useState("equal");
  const [unequalShares, setUnequalShares] = useState({}); // { userId: amountString }

  const everyone = useMemo(() => {
    if (!user) return participants;
    return [{ _id: user.id, name: user.name, email: user.email, isMe: true }, ...participants];
  }, [participants, user]);

  // Reset paidBy if the chosen payer leaves the split
  useEffect(() => {
    if (paidBy === "me") return;
    if (!participants.some((p) => p._id === paidBy)) setPaidBy("me");
  }, [participants, paidBy]);

  // Equal share preview
  const equalShare = useMemo(() => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0 || everyone.length === 0) return 0;
    return round2(n / everyone.length);
  }, [amount, everyone.length]);

  // Unequal totals
  const unequalTotal = useMemo(() => {
    return round2(everyone.reduce((sum, p) => sum + Number(unequalShares[p._id] || 0), 0));
  }, [unequalShares, everyone]);

  const totalAmount = round2(Number(amount || 0));
  const unequalDiff = round2(totalAmount - unequalTotal);
  const unequalValid = totalAmount > 0 && Math.abs(unequalDiff) < 0.01;

  const setShare = (id, val) => setUnequalShares((s) => ({ ...s, [id]: val }));

  // When switching to unequal, seed shares to equal split for a sane starting point
  const switchTo = (mode) => {
    setSplitType(mode);
    if (mode === "unequal" && totalAmount > 0 && everyone.length) {
      const seed = round2(totalAmount / everyone.length);
      const next = {};
      everyone.forEach((p) => { next[p._id] = String(seed); });
      setUnequalShares(next);
    }
  };

  const splitEvenly = () => {
    if (!totalAmount || !everyone.length) return;
    const seed = round2(totalAmount / everyone.length);
    const next = {};
    everyone.forEach((p) => { next[p._id] = String(seed); });
    setUnequalShares(next);
  };

  const submit = (e) => {
    e.preventDefault();

    if (!name.trim()) return;
    if (!totalAmount || totalAmount <= 0) return;
    if (participants.length === 0) return;

    const splitBetween = everyone.map((p) => p._id);
    const payerId = paidBy === "me" ? user.id : paidBy;

    if (splitType === "equal") {
      onSubmit({
        endpoint: "equal",
        payload: {
          name: name.trim(),
          amount: totalAmount,
          paidBy: payerId,
          splitBetween,
          date
        }
      });
      return;
    }

    if (!unequalValid) return;

    onSubmit({
      endpoint: "unequal",
      payload: {
        name: name.trim(),
        amount: totalAmount,
        paidBy: payerId,
        splitBetween,
        date,
        splits: everyone.map((p) => ({ user: p._id, amount: round2(Number(unequalShares[p._id] || 0)) }))
      }
    });
  };

  const canSubmit =
    name.trim() &&
    totalAmount > 0 &&
    participants.length > 0 &&
    (splitType === "equal" || unequalValid);

  return (
    <form onSubmit={submit} className="stack gap-4" noValidate>
      <Input
        label="Description"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Goa trip Airbnb"
        required
      />

      <div className="row gap-4 wrap">
        <div style={{ flex: 1, minWidth: 140 }}>
          <Input
            label="Amount (₹)"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            required
          />
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={toInputDate(new Date())}
          />
        </div>
      </div>

      <UserPicker
        value={participants}
        onChange={setParticipants}
        friends={friends}
        includeMe
        currentUser={user}
        onManageFriends={onManageFriends}
        hint="Only your accepted friends appear here. Invite by email from Friends to add someone new."
      />

      <div className="row gap-4 wrap">
        <div style={{ flex: 1, minWidth: 160 }}>
          <Select label="Paid by" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            <option value="me">You</option>
            {participants.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </Select>
        </div>

        <div style={{ flex: 1, minWidth: 160 }}>
          <span className="field-label" style={{ display: "block", marginBottom: 6 }}>Split type</span>
          <div className="seg" role="tablist">
            <button type="button" className={`seg-btn ${splitType === "equal" ? "is-on" : ""}`} onClick={() => switchTo("equal")}>Equally</button>
            <button type="button" className={`seg-btn ${splitType === "unequal" ? "is-on" : ""}`} onClick={() => switchTo("unequal")}>Unequally</button>
          </div>
        </div>
      </div>

      {everyone.length > 0 && (
        <div className="split-preview">
          <div className="split-preview-head">
            <span>Shares</span>
            {splitType === "equal"
              ? <span className="split-preview-meta">{everyone.length} {everyone.length === 1 ? "person" : "people"} · ₹{equalShare} each</span>
              : (
                <button type="button" className="link-btn" onClick={splitEvenly}>Split evenly</button>
              )}
          </div>

          <ul className="split-rows">
            {everyone.map((p) => {
              const isPayer = (paidBy === "me" && p.isMe) || paidBy === p._id;
              return (
                <li key={p._id} className="split-row">
                  <span className="chip-avatar" title={p.isMe ? `${p.name} (you)` : p.name} style={{ background: avatarColor(p._id) }}>{initials(p.name)}</span>
                  <span className="split-row-name">
                    {p.isMe ? "You" : p.name}
                    {isPayer && <span className="badge badge-info" style={{ marginLeft: 8 }}>Paid</span>}
                  </span>
                  {splitType === "equal" ? (
                    <span className="split-row-amt">₹{equalShare}</span>
                  ) : (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input split-row-input"
                      value={unequalShares[p._id] ?? ""}
                      onChange={(e) => setShare(p._id, e.target.value)}
                      placeholder="0"
                    />
                  )}
                </li>
              );
            })}
          </ul>

          {splitType === "unequal" && totalAmount > 0 && (
            <div className={`split-balance ${unequalValid ? "is-ok" : "is-warn"}`}>
              {unequalValid ? (
                <>✓ Shares add up to ₹{totalAmount}</>
              ) : (
                <>
                  Shares total ₹{unequalTotal} ·{" "}
                  {unequalDiff > 0
                    ? <>₹{unequalDiff} short of total</>
                    : <>₹{Math.abs(unequalDiff)} over total</>
                  }
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div className="row gap-3" style={{ justifyContent: "flex-end" }}>
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit" loading={submitting} disabled={!canSubmit}>
          Add split
        </Button>
      </div>
    </form>
  );
}
