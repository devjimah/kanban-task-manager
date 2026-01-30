import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { LogoDark, LogoLight } from "../components/Icons";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { theme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get the page they were trying to access
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const success = await login(email, password);

    if (success) {
      navigate(from, { replace: true });
    } else {
      setError(
        "Invalid email or password. Try: demo@example.com / password123",
      );
    }

    setIsLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "var(--bg-main)" }}
    >
      <div
        className="w-full max-w-md p-8 rounded-lg"
        style={{
          backgroundColor: "var(--bg-sidebar)",
          border: "1px solid var(--border-color)",
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          {theme === "dark" ? <LogoLight /> : <LogoDark />}
        </div>

        <h1 className="heading-xl text-center mb-2">Welcome Back</h1>
        <p
          className="body-l text-center mb-8"
          style={{ color: "var(--medium-grey)" }}
        >
          Sign in to access your boards
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="input-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@example.com"
              className="input-field"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="input-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password123"
              className="input-field"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{
                backgroundColor: "rgba(234, 85, 85, 0.1)",
                color: "var(--red)",
              }}
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary-lg w-full"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Demo Credentials Hint */}
        <div
          className="mt-6 p-4 rounded-lg text-center"
          style={{ backgroundColor: "var(--bg-main)" }}
        >
          <p className="body-m" style={{ color: "var(--medium-grey)" }}>
            <strong>Demo Credentials:</strong>
          </p>
          <p className="body-m" style={{ color: "var(--medium-grey)" }}>
            Email: demo@example.com
          </p>
          <p className="body-m" style={{ color: "var(--medium-grey)" }}>
            Password: password123
          </p>
        </div>
      </div>
    </div>
  );
}
