import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Drawer({ open, onClose, title, subtitle, children, footer, width = 420 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return createPortal(
    <div className={`drawer-root ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ width }}
      >
        <header className="drawer-head">
          <div style={{ minWidth: 0 }}>
            <div className="drawer-title">{title}</div>
            {subtitle && <div className="drawer-sub">{subtitle}</div>}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close filters">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer && <footer className="drawer-foot">{footer}</footer>}
      </aside>
    </div>,
    document.body
  );
}
