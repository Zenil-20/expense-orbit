import { getToken, clearSession } from "./auth";

const API_ROOT = import.meta.env.VITE_API_ROOT || "/api";

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_ROOT}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    if (res.status === 401) clearSession();
    throw new Error(data?.message || data?.msg || `Request failed (${res.status})`);
  }
  return data;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

export const api = {
  register:  (p) => request("/auth/register", { method: "POST", body: JSON.stringify(p) }),
  login:     (p) => request("/auth/login",    { method: "POST", body: JSON.stringify(p) }),
  me:        ()  => request("/auth/me"),
  categories:()  => request("/auth/categories"),
  addCategory:(p)=> request("/auth/categories", { method: "POST", body: JSON.stringify(p) }),
  requestReminderOtp: (p) => request("/auth/reminder-email/request-otp", { method: "POST", body: JSON.stringify(p) }),
  verifyReminderOtp:  (p) => request("/auth/reminder-email/verify-otp",  { method: "POST", body: JSON.stringify(p) }),
  resendTestEmail:    ()  => request("/auth/reminder-email/test",        { method: "POST", body: JSON.stringify({}) }),

  expenses:     ()  => request("/expenses"),
  filteredExpenses: ({ filter, startDate, endDate, page = 1, limit = 100 } = {}) => {
    const qs = new URLSearchParams({ filter, page: String(page), limit: String(limit) });
    if (startDate) qs.set("startDate", startDate);
    if (endDate)   qs.set("endDate", endDate);
    return request(`/expenses/filter?${qs.toString()}`);
  },
  expenseTotal: ()  => request("/expenses/total"),
  createExpense:(p) => request("/expenses", { method: "POST", body: JSON.stringify(p) }),
  updateExpense:(id, p) => request(`/expenses/${id}`, { method: "PUT", body: JSON.stringify(p) }),
  markPaid:     (id) => request(`/expenses/${id}/pay`, { method: "PUT", body: JSON.stringify({}) }),
  deleteExpense:(id) => request(`/expenses/${id}`, { method: "DELETE" }),
  testOverdue:  (id) => request(`/expenses/${id}/test-overdue-email`, { method: "POST", body: JSON.stringify({}) }),

  statementPdfUrl: (range) => {
    const base = `${API_ROOT}/expenses/statement.pdf`;
    if (!range || !range.preset || range.preset === "all") return base;
    const qs = new URLSearchParams({ filter: range.preset });
    if (range.startDate) qs.set("startDate", range.startDate);
    if (range.endDate)   qs.set("endDate", range.endDate);
    return `${base}?${qs.toString()}`;
  }
};
