import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div className="user-menu" ref={ref}>
      <button type="button" className="user-trigger" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        <span className="user-avatar" aria-hidden>{initials(user.name)}</span>
        <span className="user-name-wrap">
          <span className="user-name">{user.name}</span>
          <span className="user-email">{user.email}</span>
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`user-caret ${open ? "open" : ""}`}><polyline points="6 9 12 15 18 9" /></svg>
      </button>

      {open && (
        <div className="user-dropdown" role="menu">
          <div className="user-dropdown-head">
            <div className="user-avatar lg" aria-hidden>{initials(user.name)}</div>
            <div style={{ minWidth: 0 }}>
              <div className="user-dropdown-name">{user.name}</div>
              <div className="user-dropdown-email">{user.email}</div>
            </div>
          </div>
          <div className="user-dropdown-divider" />
          <Link to="/app/settings" role="menuitem" className="user-dropdown-item" onClick={() => setOpen(false)}>
            <MenuIcon d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            Settings
          </Link>
          <Link to="/app/reports" role="menuitem" className="user-dropdown-item" onClick={() => setOpen(false)}>
            <MenuIcon d="M4 4h12l4 4v12a2 2 0 0 1-2 2H4zM14 4v6h6M9 13h6M9 17h6" />
            Reports & PDF
          </Link>
          <div className="user-dropdown-divider" />
          <button type="button" role="menuitem" className="user-dropdown-item danger" onClick={() => { setOpen(false); logout(); }}>
            <MenuIcon d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuIcon({ d }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}
