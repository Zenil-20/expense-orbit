export default function Select({ label, hint, error, id, children, className = "", ...rest }) {
  const selectId = id || rest.name;
  return (
    <div className="field">
      {label && <label className="field-label" htmlFor={selectId}>{label}</label>}
      <select id={selectId} className={`select ${className}`} {...rest}>{children}</select>
      {error ? <div className="field-error">{error}</div> : hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}
