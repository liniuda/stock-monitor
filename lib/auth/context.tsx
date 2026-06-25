"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { AuthResponse } from "./types";

interface AuthContextValue {
  user: AuthResponse | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Static export: auto-login as demo user (no server API needed)
const DEMO_USER: AuthResponse = {
  id: "demo",
  username: "演示用户",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(DEMO_USER);
  const [isLoading] = useState(false);

  const login = useCallback(async (_username: string, _password: string) => {
    setUser(DEMO_USER);
  }, []);

  const register = useCallback(async (_username: string, _password: string) => {
    setUser(DEMO_USER);
  }, []);

  const logout = useCallback(async () => {
    // Keep demo user logged in for static deployment
    setUser(DEMO_USER);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
