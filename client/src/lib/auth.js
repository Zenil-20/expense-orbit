const TOKEN_KEY = "expense_orbit_token";

export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
export function clearSession() { localStorage.removeItem(TOKEN_KEY); }
export function hasSession() { return Boolean(getToken()); }
