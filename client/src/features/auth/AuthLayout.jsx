import { Link } from "react-router-dom";
import { Wordmark } from "../../components/brand/Logo";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-wrap">
      <aside className="auth-hero">
        <Link to="/" style={{ display: "inline-flex" }}><Wordmark /></Link>
        <div>
          <h1 className="auth-hero-title">A calmer way to track what you spend.</h1>
          <p className="auth-hero-lead">
            One dashboard for recurring bills, one-offs, and flexible costs. Branded reminders that land before anything goes overdue.
          </p>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>© {new Date().getFullYear()} Expense Orbit</div>
      </aside>
      <div className="auth-panel">
        <div className="auth-form">
          <div>
            <div className="auth-title">{title}</div>
            {subtitle && <div className="auth-sub">{subtitle}</div>}
          </div>
          {children}
          {footer && <div className="auth-switch">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
