export default function Logo({ size = 36, title = "Expense Orbit" }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 160 160" role="img" aria-label={title} style={{ display: "block", borderRadius: 10 }}>
      <rect width="160" height="160" rx="36" fill="#0B1120" />
      <circle cx="80" cy="80" r="52" stroke="url(#eoRing)" strokeWidth="6" fill="none" />
      <path d="M56 92 L76 72 L88 84 L108 60" stroke="#F2B857" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="108" cy="60" r="6" fill="#F2B857" />
      <defs>
        <linearGradient id="eoRing" x1="28" y1="28" x2="132" y2="132" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2DD4BF" />
          <stop offset="1" stopColor="#F2B857" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Wordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Logo size={32} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "-0.02em", color: "#F8FAFC", fontSize: 17 }}>
          Expense Orbit
        </span>
        <span style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: "0.18em", marginTop: 3 }}>
          Spend clarity
        </span>
      </div>
    </div>
  );
}
