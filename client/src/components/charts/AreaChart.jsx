import { useId, useMemo, useRef, useState } from "react";
import { formatCurrency } from "../../lib/format";

export default function AreaChart({ data, height = 240, color = "#2DD4BF", label = "Value" }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);
  const gradId = useId().replace(/:/g, "");

  const w = 720;
  const padL = 44, padR = 16, padT = 16, padB = 32;
  const innerW = w - padL - padR;
  const innerH = height - padT - padB;

  const { max, niceMax, pts, path, area, lineCount } = useMemo(() => {
    if (!data || data.length < 2) return { max: 0, niceMax: 0, pts: [], path: "", area: "" };
    const max = Math.max(...data.map((d) => d.value), 1);
    const step = innerW / (data.length - 1);
    const niceMax = niceCeil(max);
    const pts = data.map((d, i) => ({
      x: padL + i * step,
      y: padT + innerH - (d.value / niceMax) * innerH,
      v: d.value, l: d.label
    }));
    const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const area = `${path} L ${pts[pts.length - 1].x} ${padT + innerH} L ${pts[0].x} ${padT + innerH} Z`;
    return { max, niceMax, pts, path, area, lineCount: 4 };
  }, [data, innerW, innerH, padL, padT]);

  if (!data || data.length < 2) return null;

  const onMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scale = w / rect.width;
    const mx = (e.clientX - rect.left) * scale;
    let closest = 0, best = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const d = Math.abs(pts[i].x - mx);
      if (d < best) { best = d; closest = i; }
    }
    setHover(closest);
  };

  return (
    <div className="chart-wrap">
      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${w} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        style={{ cursor: "crosshair", display: "block" }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.42" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {Array.from({ length: lineCount + 1 }).map((_, i) => {
          const y = padT + (innerH * i) / lineCount;
          const v = niceMax - (niceMax * i) / lineCount;
          return (
            <g key={i}>
              <line x1={padL} x2={w - padR} y1={y} y2={y} className="chart-grid" strokeWidth="1" />
              <text x={padL - 8} y={y + 3} textAnchor="end" className="chart-axis">{formatShort(v)}</text>
            </g>
          );
        })}

        <path d={area} fill={`url(#${gradId})`} className="chart-area-fill" />
        <path d={path} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="chart-line" />

        {pts.map((p, i) => (
          <text key={i} x={p.x} y={height - 10} textAnchor="middle" className="chart-axis">{p.l}</text>
        ))}

        {hover !== null && (
          <>
            <line x1={pts[hover].x} x2={pts[hover].x} y1={padT} y2={padT + innerH} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <circle cx={pts[hover].x} cy={pts[hover].y} r="6" fill={color} stroke="#0B1120" strokeWidth="3" />
          </>
        )}
      </svg>

      {hover !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: `${(pts[hover].x / w) * 100}%`,
            top: `${(pts[hover].y / height) * 100}%`
          }}
        >
          <div className="chart-tooltip-title">{pts[hover].l}</div>
          <div className="chart-tooltip-value">{formatCurrency(pts[hover].v)}</div>
          <div className="chart-tooltip-sub">{label}</div>
        </div>
      )}
    </div>
  );
}

function niceCeil(n) {
  if (n <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(n)));
  const rel = n / mag;
  if (rel <= 1) return 1 * mag;
  if (rel <= 2) return 2 * mag;
  if (rel <= 5) return 5 * mag;
  return 10 * mag;
}

function formatShort(n) {
  if (n >= 1e7) return "₹" + (n / 1e7).toFixed(1) + "Cr";
  if (n >= 1e5) return "₹" + (n / 1e5).toFixed(1) + "L";
  if (n >= 1e3) return "₹" + (n / 1e3).toFixed(0) + "k";
  return "₹" + Math.round(n);
}
