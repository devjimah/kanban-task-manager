import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { LogoDark, LogoLight } from "../components/Icons";

export default function NotFound() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "var(--bg-main)" }}
    >
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          {theme === "dark" ? <LogoLight /> : <LogoDark />}
        </div>

        {/* 404 Number */}
        <h1
          className="text-[120px] font-bold leading-none mb-4"
          style={{ color: "var(--main-purple)" }}
        >
          404
        </h1>

        {/* Message */}
        <h2 className="heading-xl mb-4">Page Not Found</h2>
        <p className="body-l mb-8" style={{ color: "var(--medium-grey)" }}>
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="btn btn-primary-lg">
            Return to Dashboard
          </Link>
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
