import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import { clearSession, hasSession, setToken } from "../lib/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(hasSession() ? "loading" : "unauthenticated");

  const refresh = useCallback(async () => {
    if (!hasSession()) {
      setUser(null);
      setStatus("unauthenticated");
      return;
    }
    try {
      const { user } = await api.me();
      setUser(user);
      setStatus("authenticated");
    } catch {
      clearSession();
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (payload) => {
    const { token, user } = await api.login(payload);
    setToken(token);
    setUser(user);
    setStatus("authenticated");
    return user;
  };

  const register = async (payload) => {
    const { token, user } = await api.register(payload);
    setToken(token);
    setUser(user);
    setStatus("authenticated");
    return user;
  };

  const logout = () => {
    clearSession();
    setUser(null);
    setStatus("unauthenticated");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, status, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
