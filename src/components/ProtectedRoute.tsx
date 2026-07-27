import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isLoggedIn, isInitializing, user } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <div className="flex-1 grid place-items-center" role="status">Restoring your session…</div>;
  }

  if (!isLoggedIn) {
    // Redirect to login, preserving the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
