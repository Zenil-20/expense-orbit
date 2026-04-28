import { useMemo, useState } from "react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import UserPicker from "./UserPicker";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";

export default function AddMembersModal({ open, onClose, group, friends, onAdded }) {
  const { user } = useAuth();
  const toast = useToast();
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);

  // Friends who aren't already in this group
  const eligible = useMemo(() => {
    if (!group) return [];
    const existing = new Set(group.members.map((m) => String(m._id)));
    return friends.filter((f) => !existing.has(String(f._id)));
  }, [friends, group]);

  const reset = () => setPicked([]);

  const submit = async (e) => {
    e.preventDefault();
    if (picked.length === 0) return;
    setBusy(true);
    try {
      await api.addGroupMembers(group._id, picked.map((u) => u._id));
      toast.success(
        picked.length === 1 ? "Member added" : `${picked.length} members added`,
        picked.map((u) => u.name).join(", ")
      );
      reset();
      onClose();
      onAdded?.();
    } catch (err) {
      toast.error("Couldn't add members", err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Add members" size="lg">
      <form onSubmit={submit} className="stack gap-4" noValidate>
        {eligible.length === 0 ? (
          <div className="picker-empty" style={{ padding: 20 }}>
            All your friends are already in this group. Invite more friends from <strong>Friends</strong> first.
          </div>
        ) : (
          <UserPicker
            label="Friends to add"
            value={picked}
            onChange={setPicked}
            friends={eligible}
            currentUser={user}
            hint="Pick from your accepted friends. They'll see all past and future expenses in this group."
          />
        )}
        <div className="row gap-3" style={{ justifyContent: "flex-end" }}>
          <Button variant="ghost" type="button" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button variant="primary" type="submit" loading={busy} disabled={picked.length === 0}>
            Add {picked.length > 0 ? `(${picked.length})` : ""}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
