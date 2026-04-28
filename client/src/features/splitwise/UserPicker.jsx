import { useEffect, useMemo, useRef, useState } from "react";
import { avatarColor, initials } from "./utils";

// Friends-only multi-select. The list of selectable users is bounded by the user's accepted friends
// (passed in via `friends`). No server-side search of all users — that would expose a directory.
export default function UserPicker({
  value = [],
  onChange,
  friends = [],
  includeMe,
  currentUser,
  label = "Split with",
  hint,
  onManageFriends
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selectedIds = useMemo(() => new Set(value.map((u) => u._id)), [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return friends
      .filter((u) => !selectedIds.has(u._id))
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [friends, selectedIds, query]);

  const add = (user) => {
    onChange([...value, user]);
    setQuery("");
    setOpen(false);
  };
  const remove = (id) => onChange(value.filter((u) => u._id !== id));

  return (
    <div className="field" ref={wrapRef}>
      <span className="field-label">{label}</span>

      <div className="picker">
        <div className="picker-chips">
          {includeMe && currentUser && (
            <span className="chip chip-self" title={`${currentUser.name} (you)`}>
              <span className="chip-avatar" title={currentUser.name} style={{ background: avatarColor(currentUser.id) }}>{initials(currentUser.name)}</span>
              <span>You</span>
            </span>
          )}
          {value.map((u) => (
            <span key={u._id} className="chip" title={`${u.name} · ${u.email}`}>
              <span className="chip-avatar" title={u.name} style={{ background: avatarColor(u._id) }}>{initials(u.name)}</span>
              <span>{u.name}</span>
              <button type="button" className="chip-x" onClick={() => remove(u._id)} aria-label={`Remove ${u.name}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </span>
          ))}
          <input
            className="picker-input"
            type="text"
            placeholder={friends.length === 0
              ? "No friends yet — invite someone first"
              : value.length ? "Add another friend…" : "Pick a friend"}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            disabled={friends.length === 0}
          />
        </div>

        {open && (
          <div className="picker-pop">
            {friends.length === 0 ? (
              <div className="picker-empty">
                <div style={{ marginBottom: 10 }}>You don't have any friends on the platform yet.</div>
                {onManageFriends && (
                  <button type="button" className="link-btn" onClick={onManageFriends}>Invite a friend by email →</button>
                )}
              </div>
            ) : filtered.length === 0 ? (
              <div className="picker-empty">
                {query ? "No friend matches that search." : "All your friends are already in this split."}
              </div>
            ) : (
              filtered.map((u) => (
                <button key={u._id} type="button" className="picker-item" onClick={() => add(u)} title={`${u.name} · ${u.email}`}>
                  <span className="chip-avatar" title={u.name} style={{ background: avatarColor(u._id) }}>{initials(u.name)}</span>
                  <span className="picker-meta">
                    <span className="picker-name">{u.name}</span>
                    <span className="picker-email">{u.email}</span>
                  </span>
                  <span className="picker-add">+ Add</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}
