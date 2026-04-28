// Pick a stable hue per user id so avatars render with consistent colors.
export function avatarColor(id = "") {
  const str = String(id);
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 60% 55%)`;
}

export function initials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function round2(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}

// For a split expense and the current user, describe their position:
//   { role: "lender" | "borrower" | "settled", amount }
export function userPosition(expense, currentUserId) {
  const idStr = String(currentUserId);
  const paidByMe = expense.paidBy && String(expense.paidBy._id) === idStr;
  const myShare = computeShare(expense, idStr);

  if (paidByMe) {
    const owedToMe = expense.amount - myShare;
    if (owedToMe <= 0.01) return { role: "settled", amount: 0 };
    return { role: "lender", amount: round2(owedToMe) };
  }

  const isParticipant = expense.splitBetween.some((u) => String(u._id) === idStr);
  if (!isParticipant) return { role: "settled", amount: 0 };

  return { role: "borrower", amount: round2(myShare) };
}

function computeShare(expense, idStr) {
  const isParticipant = expense.splitBetween.some((u) => String(u._id) === idStr);
  if (!isParticipant) return 0;

  if (expense.splitType === "unequal" && expense.splits?.length) {
    const mine = expense.splits.find((s) => s.user && String(s.user._id) === idStr);
    return mine ? Number(mine.amount) : 0;
  }
  return Number(expense.amount) / expense.splitBetween.length;
}
