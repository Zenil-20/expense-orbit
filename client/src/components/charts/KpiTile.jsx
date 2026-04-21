import { useEffect, useRef, useState } from "react";

export default function KpiTile({ label, value, format = formatINR, accent = "var(--accent)", hint, delta, spark, compact }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div className={`kpi-tile ${compact ? "is-compact" : ""}`} ref={ref} onMouseMove={onMove}>
      <div className="kpi-accent" style={{ background: accent }} />
      <div className="kpi-label">{label}</div>
      <div className="kpi-value"><AnimatedValue value={value} format={format} /></div>
      {(hint || typeof delta === "number") && (
        <div className="kpi-meta">
          {typeof delta === "number" && (
            <span className={`kpi-delta ${delta >= 0 ? "up" : "down"}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: delta >= 0 ? "none" : "rotate(180deg)" }}>
                <path d="M7 14l5-5 5 5" />
              </svg>
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {hint && <span className="kpi-hint">{hint}</span>}
        </div>
      )}
      {spark && spark.length > 1 && <Sparkline points={spark} color={accent} />}
    </div>
  );
}

function formatINR(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Math.round(n));
}

function AnimatedValue({ value, format }) {
  const [shown, setShown] = useState(typeof value === "number" ? 0 : value);
  const raf = useRef(null);
  const from = useRef(0);

  useEffect(() => {
    if (typeof value !== "number") { setShown(value); return; }
    const start = performance.now();
    const dur = 700;
    const startVal = from.current;
    const delta = Number(value) - startVal;
    cancelAnimationFrame(raf.current);
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(startVal + delta * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else from.current = Number(value);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  if (typeof value === "string") return value;
  return format ? format(shown) : Math.round(shown);
}

function Sparkline({ points, color }) {
  const [hover, setHover] = useState(null);
  const w = 140, h = 40;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const span = max - min || 1;
  const step = w / (points.length - 1);
  const coords = points.map((v, i) => ({ x: i * step, y: h - ((v - min) / span) * h, v }));
  const path = coords.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  const gradId = `sg-${String(color).replace(/[^a-z0-9]/gi, "")}`;

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = w / rect.width;
    const mx = (e.clientX - rect.left) * scale;
    let best = 0, d = Infinity;
    for (let i = 0; i < coords.length; i++) {
      const dx = Math.abs(coords[i].x - mx);
      if (dx < d) { d = dx; best = i; }
    }
    setHover(best);
  };

  return (
    <svg className="kpi-spark" width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {hover !== null && (
        <>
          <line x1={coords[hover].x} x2={coords[hover].x} y1={0} y2={h} stroke={color} strokeDasharray="2 2" opacity="0.4" />
          <circle cx={coords[hover].x} cy={coords[hover].y} r="3.5" fill={color} stroke="#0B1120" strokeWidth="2" />
        </>
      )}
    </svg>
  );
}
