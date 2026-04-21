import { useRef, useState } from "react";
import { formatCurrency } from "../../lib/format";

export default function BarChart({ data, height = 260, color = "#2DD4BF", orientation = "vertical" }) {
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);

  if (!data || data.length === 0) return null;
  if (orientation === "horizontal") return <HorizontalBars data={data} height={height} color={color} hover={hover} setHover={setHover} svgRef={svgRef} />;

  const w = 720;
  const padL = 44, padR = 16, padT = 16, padB = 40;
  const innerW = w - padL - padR;
  const innerH = height - padT - padB;
  const max = Math.max(...data.map((d) => d.value), 1);
  const niceMax = niceCeil(max);
  const slot = innerW / data.length;
  const barW = Math.min(64, slot * 0.6);
  const lines = 4;

  return (
    <div className="chart-wrap">
      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${w} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
        onMouseLeave={() => setHover(null)}
      >
        {Array.from({ length: lines + 1 }).map((_, i) => {
          const y = padT + (innerH * i) / lines;
          const v = niceMax - (niceMax * i) / lines;
          return (
            <g key={i}>
              <line x1={padL} x2={w - padR} y1={y} y2={y} className="chart-grid" strokeWidth="1" />
              <text x={padL - 8} y={y + 3} textAnchor="end" className="chart-axis">{formatShort(v)}</text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const bh = Math.max(2, (d.value / niceMax) * innerH);
          const x = padL + i * slot + (slot - barW) / 2;
          const y = padT + innerH - bh;
          const c = d.color || color;
          const hovered = hover === i;
          return (
            <g key={d.label + i} onMouseEnter={() => setHover(i)}>
              <rect x={x - 2} y={padT} width={barW + 4} height={innerH} fill="transparent" />
              <rect
                className="chart-bar"
                x={x}
                y={y}
                width={barW}
                height={bh}
                rx={Math.min(6, barW / 3)}
                fill={c}
                opacity={hover !== null && !hovered ? 0.35 : 1}
                style={{ animationDelay: `${i * 50}ms`, transition: "opacity 180ms ease" }}
              />
              {hovered && (
                <text x={x + barW / 2} y={y - 6} textAnchor="middle" fill="#F8FAFC" fontSize="11" fontWeight="700">
                  {formatCurrency(d.value)}
                </text>
              )}
              <text x={x + barW / 2} y={height - 14} textAnchor="middle" className="chart-axis">{truncate(d.label, 12)}</text>
            </g>
          );
        })}
      </svg>

      {hover !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: `${((padL + hover * slot + slot / 2) / w) * 100}%`,
            top: `${((padT + innerH - (data[hover].value / niceMax) * innerH) / height) * 100}%`
          }}
        >
          <div className="chart-tooltip-title">{data[hover].label}</div>
          <div className="chart-tooltip-value">{formatCurrency(data[hover].value)}</div>
          <div className="chart-tooltip-sub">
            {Math.round((data[hover].value / data.reduce((s, d) => s + d.value, 0)) * 100)}% of total
          </div>
        </div>
      )}
    </div>
  );
}

function HorizontalBars({ data, height, color, hover, setHover }) {
  const w = 720;
  const padL = 140, padR = 72, padT = 12, padB = 12;
  const innerH = height - padT - padB;
  const innerW = w - padL - padR;
  const max = Math.max(...data.map((d) => d.value), 1);
  const rowH = innerH / data.length;
  const barH = Math.min(22, rowH * 0.6);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <div className="chart-wrap">
      <svg width="100%" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }} onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => {
          const y = padT + i * rowH + (rowH - barH) / 2;
          const bw = Math.max(4, (d.value / max) * innerW);
          const c = d.color || color;
          const hovered = hover === i;
          return (
            <g key={d.label + i} onMouseEnter={() => setHover(i)}>
              <rect x={0} y={padT + i * rowH} width={w} height={rowH} fill="transparent" />
              <text x={padL - 10} y={y + barH / 2 + 4} textAnchor="end" fill="#CBD5E1" fontSize="12">{truncate(d.label, 18)}</text>
              <rect x={padL} y={y} width={innerW} height={barH} rx={barH / 2} fill="rgba(148, 163, 184, 0.08)" />
              <rect
                x={padL}
                y={y}
                width={bw}
                height={barH}
                rx={barH / 2}
                fill={c}
                opacity={hover !== null && !hovered ? 0.4 : 1}
                style={{
                  transformOrigin: `${padL}px ${y + barH / 2}px`,
                  animation: "barGrowX 700ms var(--ease) both",
                  animationDelay: `${i * 50}ms`,
                  transition: "opacity 180ms ease"
                }}
              />
              <text x={padL + innerW + 8} y={y + barH / 2 + 4} fill="#F8FAFC" fontSize="12" fontWeight="700">
                {formatCurrency(d.value)}
              </text>
              {hovered && (
                <text x={padL + bw + 8} y={y - 2} fontSize="10" fill={c} fontWeight="700">
                  {Math.round((d.value / total) * 100)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>
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
function truncate(s, n) { return s && s.length > n ? s.slice(0, n - 1) + "…" : s; }
