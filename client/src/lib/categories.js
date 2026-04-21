export const DEFAULT_CATEGORIES = [
  "Housing", "Food", "Transport", "Entertainment", "Utilities",
  "Health", "Education", "Savings", "Maintenance", "Other"
];

export const CATEGORY_META = {
  Housing:       { icon: "🏠", accent: "#A78BFA" },
  Food:          { icon: "🍽️", accent: "#FB923C" },
  Transport:     { icon: "🚗", accent: "#38BDF8" },
  Entertainment: { icon: "🎬", accent: "#F472B6" },
  Utilities:     { icon: "💡", accent: "#FBBF24" },
  Health:        { icon: "💊", accent: "#34D399" },
  Education:     { icon: "📚", accent: "#60A5FA" },
  Savings:       { icon: "🪙", accent: "#2DD4BF" },
  Maintenance:   { icon: "🛠️", accent: "#818CF8" },
  Other:         { icon: "📦", accent: "#94A3B8" }
};

export function getCategoryMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META.Other;
}
