import { Link } from "react-router-dom";
import { Suspense, lazy } from "react";
import Button from "../../components/ui/Button";
import { Wordmark } from "../../components/brand/Logo";

const Orb3D = lazy(() => import("../../components/brand/Orb3D"));

const features = [
  { icon: "◐", title: "Recurring, remembered", body: "Bills, subscriptions, EMIs — set them once and get branded reminders by email a day ahead." },
  { icon: "◎", title: "One verified inbox", body: "Verify your reminder email with a one-time code. Confirmations send automatically." },
  { icon: "◇", title: "Category clarity", body: "Ten curated categories plus your own. See where your rupees actually go." },
  { icon: "◊", title: "Paid in one tap", body: "Mark paid and the next due date rolls forward on the right cadence — daily, weekly, monthly, yearly." },
  { icon: "◈", title: "Built for every screen", body: "Feels right on a phone in your hand, on a tablet at the café, or on a widescreen at your desk." },
  { icon: "◉", title: "Private by default", body: "Your data stays scoped to you. Password hashing, session tokens, verified email channels." }
];

export default function LandingPage() {
  return (
    <>
      <header className="landing-nav">
        <Wordmark />
        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/login"><Button variant="ghost">Sign in</Button></Link>
          <Link to="/register"><Button variant="primary">Get started</Button></Link>
        </div>
      </header>

      <section className="container landing-hero">
        <span className="landing-eyebrow">New - branded email reminders</span>
        <h1 className="landing-title">Clarity for every rupee you spend.</h1>
        <p className="landing-lead">
          Expense Orbit tracks recurring bills, one-off purchases, and flexible costs in one place —
          then quietly reminds you before anything goes overdue.
        </p>
        <div className="landing-cta">
          <Link to="/register"><Button variant="primary" size="lg">Create free account</Button></Link>
          <Link to="/login"><Button variant="secondary" size="lg">I already have one</Button></Link>
        </div>

        <div className="landing-hero-visual">
          <Suspense fallback={null}>
            <Orb3D />
          </Suspense>
        </div>

        <div className="landing-mock" style={{ marginTop: 24 }}>
          <div className="landing-mock-inner">
            <MockDashboard />
          </div>
        </div>
      </section>

      <section className="container">
        <div className="features">
          {features.map((f) => (
            <article key={f.title} className="feature">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="container landing-foot">
        <div>© {new Date().getFullYear()} Expense Orbit</div>
        <div>Built for mobile, tablet, and desktop.</div>
      </footer>
    </>
  );
}

function MockDashboard() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {[
          { label: "This month", v: "₹42,380", a: "var(--accent)" },
          { label: "Upcoming", v: "₹8,120",  a: "var(--teal)" },
          { label: "Overdue",  v: "₹0",       a: "var(--mint)" }
        ].map((c) => (
          <div key={c.label} style={{ padding: 18, background: "rgba(11,17,32,0.7)", border: "1px solid var(--line)", borderRadius: 14 }}>
            <div style={{ height: 3, width: 32, background: c.a, borderRadius: 3, marginBottom: 10 }} />
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-mute)", fontWeight: 700 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6, color: "#F8FAFC", fontFamily: "var(--font-display)" }}>{c.v}</div>
          </div>
        ))}
      </div>
      {[
        { i: "🏠", n: "Apartment rent",    c: "Housing",   a: "₹28,000", s: "Due in 3 days" },
        { i: "💡", n: "Electricity",       c: "Utilities", a: "₹1,820",  s: "Tomorrow" },
        { i: "🎬", n: "Streaming bundle",  c: "Entertainment", a: "₹649", s: "In 5 days" }
      ].map((r) => (
        <div key={r.n} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14, alignItems: "center", padding: 14, background: "rgba(15,26,46,0.6)", border: "1px solid var(--line)", borderRadius: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid var(--line-strong)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{r.i}</div>
          <div>
            <div style={{ fontWeight: 700, color: "#F8FAFC" }}>{r.n}</div>
            <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>{r.c} · {r.s}</div>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "#F8FAFC" }}>{r.a}</div>
        </div>
      ))}
    </div>
  );
}
