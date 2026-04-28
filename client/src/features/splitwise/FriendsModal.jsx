import { useState } from "react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { api } from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import { avatarColor, initials } from "./utils";

export default function FriendsModal({ open, onClose, friends, incoming, outgoing, reload }) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const res = await api.inviteFriend(trimmed);
      toast.success("Sent", res.message || "Invite sent");
      setEmail("");
      await reload();
    } catch (err) {
      toast.error("Couldn't send invite", err.message);
    } finally {
      setBusy(false);
    }
  };

  const accept = async (id) => {
    try { await api.acceptFriend(id); toast.success("Accepted"); reload(); }
    catch (err) { toast.error("Couldn't accept", err.message); }
  };
  const decline = async (id) => {
    try { await api.declineFriend(id); toast.success("Declined"); reload(); }
    catch (err) { toast.error("Couldn't decline", err.message); }
  };
  const remove = async (id, label) => {
    if (!window.confirm(`Remove ${label}? You'll need to re-invite to split with them again.`)) return;
    try { await api.removeFriend(id); toast.success("Removed"); reload(); }
    catch (err) { toast.error("Couldn't remove", err.message); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Friends" size="lg">
      <form onSubmit={submit} className="stack gap-3" noValidate>
        <Input
          label="Invite by email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john.doe@gmail.com"
          hint="They must already have an Expense Orbit account. Their profile is never browseable — you need to know the address."
          required
        />
        <div className="row gap-3" style={{ justifyContent: "flex-end" }}>
          <Button variant="primary" type="submit" loading={busy} disabled={!email.trim()}>Send invite</Button>
        </div>
      </form>

      {incoming.length > 0 && (
        <Section title={`Pending invitations (${incoming.length})`}>
          {incoming.map((u) => (
            <FriendRow key={u.friendshipId} user={u}>
              <Button size="sm" variant="primary" onClick={() => accept(u.friendshipId)}>Accept</Button>
              <Button size="sm" variant="ghost" onClick={() => decline(u.friendshipId)}>Decline</Button>
            </FriendRow>
          ))}
        </Section>
      )}

      {outgoing.length > 0 && (
        <Section title={`Sent (${outgoing.length})`}>
          {outgoing.map((u) => (
            <FriendRow key={u.friendshipId} user={u} muted>
              <span className="badge badge-info">Pending</span>
              <Button size="sm" variant="ghost" onClick={() => remove(u.friendshipId, u.name)}>Cancel</Button>
            </FriendRow>
          ))}
        </Section>
      )}

      <Section title={`Friends (${friends.length})`}>
        {friends.length === 0 ? (
          <div className="picker-empty" style={{ padding: 18 }}>
            No friends yet. Invite by email to start splitting.
          </div>
        ) : (
          friends.map((u) => (
            <FriendRow key={u.friendshipId} user={u}>
              <Button size="sm" variant="danger" onClick={() => remove(u.friendshipId, u.name)}>Remove</Button>
            </FriendRow>
          ))
        )}
      </Section>
    </Modal>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div className="field-label" style={{ marginBottom: 8 }}>{title}</div>
      <div className="stack gap-2">{children}</div>
    </div>
  );
}

function FriendRow({ user, children, muted }) {
  return (
    <div className={`friend-row ${muted ? "is-muted" : ""}`} title={`${user.name} · ${user.email}`}>
      <span className="chip-avatar" title={user.name} style={{ background: avatarColor(user._id), width: 32, height: 32, fontSize: 12 }}>
        {initials(user.name)}
      </span>
      <div className="friend-row-meta">
        <div className="friend-row-name">{user.name}</div>
        <div className="friend-row-email">{user.email}</div>
      </div>
      <div className="row gap-2" style={{ alignItems: "center" }}>{children}</div>
    </div>
  );
}
