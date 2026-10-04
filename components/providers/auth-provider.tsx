"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { TOKEN_COOKIE, TOKEN_MAX_AGE } from "@/lib/auth-shared";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface RegisterInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readTokenCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeTokenCookie(token: string | null) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  if (token) {
    document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${TOKEN_MAX_AGE}; SameSite=Lax${secure}`;
  } else {
    document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax${secure}`;
  }
}

export function AuthProvider({
  initialUser = null,
  children,
}: {
  initialUser?: User | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);

  const loadUser = useCallback(async (activeToken: string) => {
    try {
      const me = await apiFetch<{ data: User }>("/auth/user", { token: activeToken });
      setUser(me.data);
    } catch {
      setUser(null);
      setToken(null);
      writeTokenCookie(null);
    }
  }, []);

  useEffect(() => {
    const existing = readTokenCookie();
    setToken(existing);
    if (existing && !initialUser) {
      loadUser(existing).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applySession = useCallback((nextToken: string, nextUser: User) => {
    // Persist the session synchronously: cookie + context. The caller then does
    // a soft router.push(); the RSC request for the destination carries the new
    // cookie, and client components already see the user from context.
    setToken(nextToken);
    setUser(nextUser);
    writeTokenCookie(nextToken);
  }, []);

  const login = useCallback<AuthContextValue["login"]>(
    async (email, password) => {
      const res = await apiFetch<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: { email, password, device_name: "web" },
      });
      applySession(res.token, res.user);
      return res.user;
    },
    [applySession],
  );

  const register = useCallback<AuthContextValue["register"]>(
    async (input) => {
      const res = await apiFetch<{ token: string; user: User }>("/auth/register", {
        method: "POST",
        body: input,
      });
      applySession(res.token, res.user);
      return res.user;
    },
    [applySession],
  );

  const logout = useCallback<AuthContextValue["logout"]>(async () => {
    try {
      if (token) await apiFetch("/auth/logout", { method: "POST", token });
    } catch {
      /* ignore network errors on logout */
    }
    setToken(null);
    setUser(null);
    writeTokenCookie(null);
    router.push("/");
    router.refresh();
  }, [router, token]);

  const refresh = useCallback(async () => {
    const current = readTokenCookie();
    setToken(current);
    if (current) await loadUser(current);
  }, [loadUser]);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, refresh }),
    [user, token, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
