const APP_NAME = process.env.APP_NAME || "Expense Orbit";
const APP_URL = process.env.APP_URL || "http://localhost:5173";
const APP_TAGLINE = "Clarity for every rupee you spend";

const BRAND_COLORS = {
  ink: "#0B1120",
  inkSoft: "#111B2E",
  surface: "#0F1A2E",
  paper: "#F7F5F0",
  paperSoft: "#EFEAE0",
  accent: "#F2B857",
  accentDeep: "#D98B2B",
  teal: "#2DD4BF",
  mint: "#22C55E",
  rose: "#F87171",
  text: "#E8ECF4",
  textMute: "#94A3B8"
};

const logoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" fill="none">
  <rect width="160" height="160" rx="36" fill="#0B1120"/>
  <circle cx="80" cy="80" r="52" stroke="url(#ring)" stroke-width="6" fill="none"/>
  <path d="M56 92 L76 72 L88 84 L108 60" stroke="#F2B857" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="108" cy="60" r="6" fill="#F2B857"/>
  <defs>
    <linearGradient id="ring" x1="28" y1="28" x2="132" y2="132" gradientUnits="userSpaceOnUse">
      <stop stop-color="#2DD4BF"/>
      <stop offset="1" stop-color="#F2B857"/>
    </linearGradient>
  </defs>
</svg>
`.trim();

const CATEGORY_META = {
  Housing:       { icon: "🏠", accent: "#8B5CF6" },
  Food:          { icon: "🍽️", accent: "#F97316" },
  Transport:     { icon: "🚗", accent: "#0EA5E9" },
  Entertainment: { icon: "🎬", accent: "#EC4899" },
  Utilities:     { icon: "💡", accent: "#F59E0B" },
  Health:        { icon: "💊", accent: "#10B981" },
  Education:     { icon: "📚", accent: "#3B82F6" },
  Savings:       { icon: "🪙", accent: "#14B8A6" },
  Maintenance:   { icon: "🛠️", accent: "#6366F1" },
  Other:         { icon: "📦", accent: "#64748B" }
};

function getCategoryMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META.Other;
}

module.exports = {
  APP_NAME,
  APP_URL,
  APP_TAGLINE,
  BRAND_COLORS,
  CATEGORY_META,
  getCategoryMeta,
  logoSvg
};
