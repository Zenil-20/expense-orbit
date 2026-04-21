import { forwardRef } from "react";

const Input = forwardRef(function Input({ label, hint, error, id, className = "", ...rest }, ref) {
  const inputId = id || rest.name;
  return (
    <div className="field">
      {label && <label className="field-label" htmlFor={inputId}>{label}</label>}
      <input ref={ref} id={inputId} className={`input ${className}`} {...rest} />
      {error ? <div className="field-error">{error}</div> : hint && <div className="field-hint">{hint}</div>}
    </div>
  );
});

export default Input;
