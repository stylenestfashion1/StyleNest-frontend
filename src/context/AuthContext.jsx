import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import * as authApi from "../api/auth";
import { TOKEN_KEY, setUnauthorizedHandler } from "../api/client";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem("stylenest_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(readStoredUser);

  const persist = useCallback((authResponse) => {
    const { token: newToken, fullName, email, role } = authResponse;
    localStorage.setItem(TOKEN_KEY, newToken);
    const nextUser = { fullName, email, role };
    localStorage.setItem("stylenest_user", JSON.stringify(nextUser));
    setToken(newToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("stylenest_user");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => logout());
  }, [logout]);

  const login = useCallback(
    async (credentials) => {
      const res = await authApi.login(credentials);
      persist(res);
      return res;
    },
    [persist]
  );

  const register = useCallback(
    async (data) => {
      const res = await authApi.register(data);
      persist(res);
      return res;
    },
    [persist]
  );

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isAdmin: user?.role === "ADMIN",
      login,
      register,
      logout,
    }),
    [token, user, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
