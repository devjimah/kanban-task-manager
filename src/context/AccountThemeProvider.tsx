import { useCallback, type ReactNode } from "react";
import { authApi } from "../api/auth";
import { ThemeProvider } from "./ThemeContext";
import { useAuth } from "./useAuth";
import type { ThemePreference } from "./theme-context";

// What: Theme/auth bridge component.
// Does: Feeds the signed-in user's stored theme preference into ThemeProvider and
//       persists changes back to their account.
// If removed: ThemeProvider cannot read auth state (it would have to sit above
//             AuthProvider), and theme choices stay device-local.
export function AccountThemeProvider({ children }: { readonly children: ReactNode }) {
  const { user } = useAuth();

  const persist = useCallback(
    (preference: ThemePreference) => {
      // Only signed-in users have an account to persist to; logged-out choices
      // remain in local storage.
      if (!user) return;
      // Deliberately not awaited: the theme applies immediately and a failed
      // sync should never surface as a UI error or block rendering.
      void authApi.updateThemePreference(preference).catch(() => undefined);
    },
    [user],
  );

  return (
    <ThemeProvider accountPreference={user?.themePreference ?? null} onPreferenceChange={persist}>
      {children}
    </ThemeProvider>
  );
}
