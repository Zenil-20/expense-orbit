export default function Button({
  variant = "primary",
  size,
  block,
  loading,
  disabled,
  className = "",
  children,
  type = "button",
  ...rest
}) {
  const cls = [
    "btn",
    `btn-${variant}`,
    size === "lg" && "btn-lg",
    size === "sm" && "btn-sm",
    block && "btn-block",
    className
  ].filter(Boolean).join(" ");

  return (
    <button type={type} className={cls} disabled={disabled || loading} {...rest}>
      {loading && <span className="spinner" aria-hidden />}
      {children}
    </button>
  );
}
