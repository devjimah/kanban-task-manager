import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { ThemeContext, type Theme, type ThemePreference } from "./theme-context";

const STORAGE_KEY = "theme";

// What: System colour-scheme subscription function.
// Does: Notifies React when the operating system's colour scheme changes.
// If removed: A "system" preference would sample once and never track later changes.
function subscribeToSystemTheme(onChange: () => void) {
  const query = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!query) return () => undefined;
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// What: System colour-scheme query function.
// Does: Reports the operating system's current preference for dark mode.
// If removed: The "system" preference cannot be resolved to a concrete theme.
function systemTheme(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// What: Stored-preference reader function.
// Does: Recovers the last preference from local storage, defaulting to "system".
// If removed: Every page load would flash the default theme before the account
//             preference arrives, and logged-out users would lose their choice.
function storedPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

interface ThemeProviderProps {
  children: ReactNode;
  /** The signed-in user's stored preference, or null when logged out. */
  accountPreference?: ThemePreference | null;
  /** Persists a changed preference to the account. Omitted when logged out. */
  onPreferenceChange?: (preference: ThemePreference) => void;
}

export function ThemeProvider({
  children,
  accountPreference = null,
  onPreferenceChange,
}: Readonly<ThemeProviderProps>) {
  const [preference, setPreference] = useState<ThemePreference>(storedPreference);
  const [lastAccountPreference, setLastAccountPreference] = useState<ThemePreference | null>(null);
  // Subscribing through useSyncExternalStore keeps the OS theme in sync without
  // writing state from an effect, and stays correct under concurrent rendering.
  const osTheme = useSyncExternalStore(subscribeToSystemTheme, systemTheme, () => "light" as Theme);

  // Adopt the account preference once a session is restored, so a user's theme
  // follows them to a new browser. Local storage still drives the first paint.
  //
  // Derived during render rather than in an effect: React re-renders
  // immediately with the new value, so there is no frame showing the stale
  // theme. Comparing against the last seen account value means a later local
  // toggle is not overwritten on every render.
  if (accountPreference && accountPreference !== lastAccountPreference) {
    setLastAccountPreference(accountPreference);
    setPreference(accountPreference);
  }

  const theme: Theme = preference === "system" ? osTheme : preference;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, preference);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [preference, theme]);

  const setThemePreference = useCallback(
    (next: ThemePreference) => {
      setPreference(next);
      // Fire and forget: a failed sync must not block the visual change.
      onPreferenceChange?.(next);
    },
    [onPreferenceChange],
  );

  // Toggling picks the opposite of what is currently displayed, which turns an
  // implicit "system" choice into an explicit one.
  const toggleTheme = useCallback(() => {
    setThemePreference(theme === "light" ? "dark" : "light");
  }, [setThemePreference, theme]);

  const value = useMemo(
    () => ({ theme, themePreference: preference, toggleTheme, setThemePreference }),
    [theme, preference, toggleTheme, setThemePreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
