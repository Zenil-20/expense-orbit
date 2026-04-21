import { useState } from "react";
import { formatCurrency } from "../../lib/format";
import { getCategoryMeta } from "../../lib/categories";

export default function DonutChart({ entries, size = 220, thickness = 22 }) {
  const [hover, setHover] = useState(null);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const radius = (size - thickness) / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;

  let acc = 0;
  const arcs = entries.map(([name, value], i) => {
    const frac = total ? value / total : 0;
    const start = acc * Math.PI * 2 - Math.PI / 2;
    const end = (acc + frac) * Math.PI * 2 - Math.PI / 2;
    acc += frac;
    return { name, value, frac, start, end, meta: getCategoryMeta(name), i };
  });

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }} onMouseLeave={() => setHover(null)}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(148, 163, 184, 0.08)" strokeWidth={thickness} />
        {arcs.map((a) => {
          const hovered = hover === a.i;
          const r = hovered ? radius + 4 : radius;
          const path = arcPath(cx, cy, r, a.start, a.end);
          return (
            <path
              key={a.name}
              d={path}
              fill="none"
              stroke={a.meta.accent}
              strokeWidth={thickness}
              strokeLinecap="butt"
              opacity={hover !== null && !hovered ? 0.35 : 1}
              onMouseEnter={() => setHover(a.i)}
              style={{ cursor: "pointer", transition: "opacity 180ms ease, d 180ms ease" }}
            />
          );
        })}

        <text x="50%" y="46%" textAnchor="middle" fontSize="10" letterSpacing="0.12em" fill="#94A3B8">
          {hover === null ? "TOTAL" : arcs[hover].name.toUpperCase()}
        </text>
        <text x="50%" y="58%" textAnchor="middle" fontSize="15" fontWeight="800" fill="#F8FAFC" fontFamily="Sora, Inter">
          {formatCurrency(hover === null ? total : arcs[hover].value)}
        </text>
        {hover !== null && (
          <text x="50%" y="70%" textAnchor="middle" fontSize="11" fill={arcs[hover].meta.accent} fontWeight="700">
            {Math.round(arcs[hover].frac * 100)}%
          </text>
        )}
      </svg>
    </div>
  );
}

function arcPath(cx, cy, r, a0, a1) {
  if (Math.abs(a1 - a0) < 0.0001) return "";
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}
