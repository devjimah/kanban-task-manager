import { createContext } from "react";

/** The theme actually applied to the document. */
export type Theme = "light" | "dark";

/**
 * The user's stored intent. "system" is not a theme: it defers to the operating
 * system's colour scheme, which the provider resolves into a concrete `Theme`.
 */
export type ThemePreference = Theme | "system";

export interface ThemeContextValue {
  theme: Theme;
  themePreference: ThemePreference;
  toggleTheme: () => void;
  setThemePreference: (preference: ThemePreference) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);
