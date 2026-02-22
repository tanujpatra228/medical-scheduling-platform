import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { FullPageSpinner } from "./LoadingSpinner";
import type { UserRole } from "@/types/api.types";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

const ROLE_HOME: Record<UserRole, string> = {
  PATIENT: "/patient",
  DOCTOR: "/doctor",
  CLINIC_ADMIN: "/admin",
};

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }

  return <Outlet />;
}
