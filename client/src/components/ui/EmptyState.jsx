export default function EmptyState({ title, description, action, icon }) {
  return (
    <div className="empty">
      {icon && <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>}
      {title && <div className="empty-title">{title}</div>}
      {description && <div>{description}</div>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}
