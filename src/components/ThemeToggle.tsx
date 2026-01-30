import { useTheme } from "../context/ThemeContext";
import { IconLightTheme, IconDarkTheme } from "./Icons";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className="flex items-center justify-center gap-6 py-3.5 rounded-md"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <IconLightTheme />
      <button
        onClick={toggleTheme}
        className="relative w-10 h-5 rounded-full transition-colors"
        style={{ backgroundColor: "var(--main-purple)" }}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        <span
          className="absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform duration-200"
          style={{
            left: theme === "light" ? "3px" : "20px",
          }}
        />
      </button>
      <IconDarkTheme />
    </div>
  );
}
