import { useEffect, useRef, useState } from "react";

export default function Menu({ trigger, items, align = "right" }) {
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

  return (
    <div className="menu-wrap" ref={ref}>
      <button type="button" className="menu-trigger" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        {trigger || (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="12" cy="19" r="1.2" />
          </svg>
        )}
      </button>
      {open && (
        <div className={`menu-pop menu-pop-${align}`} role="menu">
          {items.filter(Boolean).map((it, i) =>
            it.divider ? (
              <div key={`d-${i}`} className="menu-divider" />
            ) : (
              <button
                key={it.label}
                type="button"
                role="menuitem"
                className={`menu-item ${it.danger ? "is-danger" : ""}`}
                onClick={() => { setOpen(false); it.onClick?.(); }}
              >
                {it.icon && <span className="menu-icon" aria-hidden>{it.icon}</span>}
                <span>{it.label}</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
