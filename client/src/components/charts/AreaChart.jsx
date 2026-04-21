import { useId, useMemo, useRef, useState } from "react";
import { formatCurrency } from "../../lib/format";
import useContainerWidth from "./useContainerWidth";

export default function AreaChart({ data, height = 240, color = "#2DD4BF", label = "Value" }) {
  const [wrapRef, w] = useContainerWidth(260);
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);
  const gradId = useId().replace(/:/g, "");

  const narrow = w < 520;
  const padL = narrow ? 34 : 46;
  const padR = narrow ? 10 : 16;
  const padT = 16;
  const padB = narrow ? 26 : 32;
  const h = narrow ? Math.min(height, 220) : height;
  const innerW = Math.max(40, w - padL - padR);
  const innerH = h - padT - padB;
  const lineCount = narrow ? 3 : 4;

  const { niceMax, pts, path, area } = useMemo(() => {
    if (!data || data.length < 2) return { niceMax: 0, pts: [], path: "", area: "" };
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
    return { niceMax, pts, path, area };
  }, [data, innerW, innerH, padL, padT]);

  if (!data || data.length < 2) return <div ref={wrapRef} />;

  const labelEvery = narrow ? Math.max(1, Math.ceil(data.length / 6)) : 1;

  const onMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.touches?.[0]?.clientX ?? e.clientX) - rect.left);
    let closest = 0, best = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const d = Math.abs(pts[i].x - mx);
      if (d < best) { best = d; closest = i; }
    }
    setHover(closest);
  };
  const clearHover = () => setHover(null);

  const tooltipLeft = hover !== null ? Math.max(60, Math.min(w - 60, pts[hover].x)) : 0;

  return (
    <div className="chart-wrap" ref={wrapRef} style={{ touchAction: "pan-y" }}>
      {w > 0 && (
        <svg
          ref={svgRef}
          width={w}
          height={h}
          style={{ display: "block", cursor: "crosshair", touchAction: "pan-y" }}
          onMouseMove={onMove}
          onMouseLeave={clearHover}
          onTouchStart={onMove}
          onTouchMove={onMove}
          onTouchEnd={clearHover}
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
                <text x={padL - 6} y={y + 4} textAnchor="end" className="chart-axis" fontSize={narrow ? 10 : 11}>
                  {formatShort(v)}
                </text>
              </g>
            );
          })}

          <path d={area} fill={`url(#${gradId})`} className="chart-area-fill" />
          <path d={path} fill="none" stroke={color} strokeWidth={narrow ? 2 : 2.4} strokeLinecap="round" strokeLinejoin="round" className="chart-line" />

          {pts.map((p, i) => (
            i % labelEvery === 0 && (
              <text key={i} x={p.x} y={h - 8} textAnchor="middle" className="chart-axis" fontSize={narrow ? 10 : 11}>{p.l}</text>
            )
          ))}

          {hover !== null && (
            <>
              <line x1={pts[hover].x} x2={pts[hover].x} y1={padT} y2={padT + innerH} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
              <circle cx={pts[hover].x} cy={pts[hover].y} r="6" fill={color} stroke="#0B1120" strokeWidth="3" />
            </>
          )}
        </svg>
      )}

      {hover !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: `${tooltipLeft}px`,
            top: `${pts[hover].y}px`
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
