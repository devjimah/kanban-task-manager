import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi } from "../api/auth";
import { queryClient } from "../queryClient";
import { AuthContext, type User } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let active = true;
    authApi.restore()
      .then((restoredUser) => { if (active) setUser(restoredUser); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setIsInitializing(false); });
    return () => { active = false; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setUser(await authApi.login(email, password));
      return true;
    } catch {
      return false;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      setUser(await authApi.register(name, email, password));
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    queryClient.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    isLoggedIn: user !== null,
    isInitializing,
    user,
    login,
    register,
    logout,
  }), [isInitializing, login, logout, register, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
