const DEFAULT_CATEGORIES = [
  "Housing",
  "Food",
  "Transport",
  "Entertainment",
  "Utilities",
  "Health",
  "Education",
  "Savings",
  "Maintenance",
  "Other"
];

function normalizeCategoryName(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function isAllowedCategory(category, customCategories = []) {
  const normalized = normalizeCategoryName(category);
  if (!normalized) {
    return false;
  }

  const allowed = [...DEFAULT_CATEGORIES, ...customCategories].map(normalizeCategoryName);
  return allowed.includes(normalized);
}

module.exports = {
  DEFAULT_CATEGORIES,
  normalizeCategoryName,
  isAllowedCategory
};
