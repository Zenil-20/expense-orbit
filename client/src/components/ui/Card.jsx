export default function Card({ title, subtitle, action, pad, className = "", children }) {
  const padCls = pad === "lg" ? "card-pad-lg" : pad === "sm" ? "card-pad-sm" : "";
  return (
    <section className={`card ${padCls} ${className}`}>
      {(title || action) && (
        <div className="card-header">
          <div>
            {title && <div className="card-title">{title}</div>}
            {subtitle && <div className="card-subtitle">{subtitle}</div>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
