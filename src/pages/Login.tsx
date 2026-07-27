import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useTheme } from "../context/useTheme";
import { LogoDark, LogoLight } from "../components/Icons";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const { theme } = useTheme();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get the page they were trying to access
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const success = isRegistering
      ? await register(name, email, password)
      : await login(email, password);

    if (success) {
      navigate(from, { replace: true });
    } else {
      setError(isRegistering ? "Account creation failed. Check the fields or use a different email." : "Invalid email or password.");
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

        <h1 className="heading-xl text-center mb-2">{isRegistering ? "Create Account" : "Welcome Back"}</h1>
        <p
          className="body-l text-center mb-8"
          style={{ color: "var(--medium-grey)" }}
        >
          {isRegistering ? "Register to create and collaborate on boards" : "Sign in to access your boards"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegistering && <div>
            <label htmlFor="register-name" className="input-label">Name</label>
            <input id="register-name" name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="input-field" required minLength={2} maxLength={80} />
          </div>}
          {/* Email Field */}
          <div>
            <label htmlFor="login-email" className="input-label">
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field"
              required
              minLength={isRegistering ? 10 : 1}
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="login-password" className="input-label">
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
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
            {isLoading ? "Please wait…" : isRegistering ? "Create Account" : "Sign In"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setIsRegistering((value) => !value); setError(""); }}
          className="w-full mt-5 body-m text-center"
          style={{ color: "var(--main-purple)" }}
        >
          {isRegistering ? "Already have an account? Sign in" : "Need an account? Register"}
        </button>

        {/* Demo Credentials Hint */}
        
      </div>
    </div>
  );
}
