import { createContext } from "react";

import type { AuthUser as User } from "../api/auth";

export type { User };

export interface AuthContextValue {
  isLoggedIn: boolean;
  isInitializing: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
