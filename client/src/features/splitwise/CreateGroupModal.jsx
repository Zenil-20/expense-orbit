import { useState } from "react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import UserPicker from "./UserPicker";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";

export default function CreateGroupModal({ open, onClose, friends, onCreated, onManageFriends }) {
  const { user } = useAuth();
  const toast = useToast();
  const [name, setName] = useState("");
  const [members, setMembers] = useState([]);
  const [busy, setBusy] = useState(false);

  const reset = () => { setName(""); setMembers([]); };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || members.length === 0) return;
    setBusy(true);
    try {
      const res = await api.createGroup({
        name: name.trim(),
        memberIds: members.map((m) => m._id)
      });
      toast.success("Group created", res.name || name);
      reset();
      onClose();
      onCreated?.(res);
    } catch (err) {
      toast.error("Couldn't create group", err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="New group" size="lg">
      <form onSubmit={submit} className="stack gap-4" noValidate>
        <Input
          label="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`e.g. Goa Trip ${new Date().getFullYear()}`}
          required
        />
        <UserPicker
          label="Members"
          value={members}
          onChange={setMembers}
          friends={friends}
          includeMe
          currentUser={user}
          onManageFriends={onManageFriends}
          hint="Pick from your accepted friends. They'll see all group expenses and balances."
        />
        <div className="row gap-3" style={{ justifyContent: "flex-end" }}>
          <Button variant="ghost" type="button" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button variant="primary" type="submit" loading={busy} disabled={!name.trim() || members.length === 0}>
            Create group
          </Button>
        </div>
      </form>
    </Modal>
  );
}
