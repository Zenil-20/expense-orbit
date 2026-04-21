export default function Badge({ variant = "muted", children, dot }) {
  return (
    <span className={`badge badge-${variant}`}>
      {dot && <span className="badge-dot" style={{ background: "currentColor" }} />}
      {children}
    </span>
  );
}
