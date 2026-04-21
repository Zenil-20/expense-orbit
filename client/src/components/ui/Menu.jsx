import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function Menu({ trigger, items, align = "right" }) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const ref = useRef(null);
  const sheetRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);

    if (isMobile) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = prev;
      };
    }
    const onDoc = (e) => {
      if (!ref.current?.contains(e.target) && !sheetRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, isMobile]);

  const visibleItems = items.filter(Boolean);

  const renderItems = (cls) => (
    <>
      {visibleItems.map((it, i) =>
        it.divider ? (
          <div key={`d-${i}`} className="menu-divider" />
        ) : (
          <button
            key={it.label}
            type="button"
            role="menuitem"
            className={`${cls} ${it.danger ? "is-danger" : ""}`}
            onClick={() => { setOpen(false); it.onClick?.(); }}
          >
            {it.icon && <span className="menu-icon" aria-hidden>{it.icon}</span>}
            <span>{it.label}</span>
          </button>
        )
      )}
    </>
  );

  return (
    <div className="menu-wrap" ref={ref}>
      <button
        type="button"
        className="menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More actions"
      >
        {trigger || (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="12" cy="19" r="1.2" />
          </svg>
        )}
      </button>

      {open && !isMobile && (
        <div className={`menu-pop menu-pop-${align}`} role="menu">
          {renderItems("menu-item")}
        </div>
      )}

      {open && isMobile && createPortal(
        <div className="sheet-root" role="dialog" aria-modal="true">
          <div className="sheet-backdrop" onClick={() => setOpen(false)} />
          <div className="sheet" ref={sheetRef}>
            <div className="sheet-grabber" aria-hidden />
            <div className="sheet-body">
              {renderItems("sheet-item")}
            </div>
            <button
              type="button"
              className="sheet-cancel"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
