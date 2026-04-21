import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const ToastContext = createContext(null);

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((toast) => {
    const id = ++idSeq;
    const t = {
      id,
      variant: toast.variant || "info",
      title: toast.title,
      description: toast.description,
      duration: toast.duration ?? 4200
    };
    setToasts((list) => [...list, t]);
    return id;
  }, []);

  const api = {
    toast: push,
    success: (title, description, opts) => push({ variant: "success", title, description, ...opts }),
    error:   (title, description, opts) => push({ variant: "error",   title, description, ...opts }),
    warning: (title, description, opts) => push({ variant: "warning", title, description, ...opts }),
    info:    (title, description, opts) => push({ variant: "info",    title, description, ...opts }),
    dismiss
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(<ToastRoot toasts={toasts} onDismiss={dismiss} />, document.body)}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function ToastRoot({ toasts, onDismiss }) {
  return (
    <div className="toast-root" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

const ICONS = { success: "✓", error: "!", warning: "!", info: "i" };

function ToastItem({ toast, onDismiss }) {
  const barRef = useRef(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar || !toast.duration) return;
    bar.animate(
      [{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }],
      { duration: toast.duration, easing: "linear", fill: "forwards" }
    );
    const id = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(id);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div className={`toast toast-${toast.variant}`} role="status">
      <div className="toast-icon" aria-hidden>{ICONS[toast.variant] || "i"}</div>
      <div className="toast-body">
        {toast.title && <div className="toast-title">{toast.title}</div>}
        {toast.description && <div className="toast-desc">{toast.description}</div>}
      </div>
      <button type="button" className="toast-close" onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
      <span ref={barRef} className="toast-progress" style={{ width: "100%" }} />
    </div>
  );
}
