import { apiRequest, setAccessToken } from "./client";

export type ThemePreference = "light" | "dark" | "system";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer" | "user";
  themePreference: ThemePreference;
}

interface AuthResult {
  user: AuthUser;
  accessToken: string;
}

async function establishSession(path: string, body?: object) {
  const result = await apiRequest<AuthResult>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  }, false);
  setAccessToken(result.accessToken);
  return result.user;
}

export const authApi = {
  login: (email: string, password: string) => establishSession("/auth/login", { email, password }),
  register: (name: string, email: string, password: string) =>
    establishSession("/auth/register", { name, email, password }),
  restore: () => establishSession("/auth/refresh"),
  updateThemePreference: async (themePreference: ThemePreference) => {
    const result = await apiRequest<{ user: AuthUser }>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ themePreference }),
    });
    return result.user;
  },
  logout: async () => {
    try {
      await apiRequest<void>("/auth/logout", { method: "POST" }, false);
    } finally {
      setAccessToken(null);
    }
  },
};

