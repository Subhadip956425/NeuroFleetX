import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

interface ProtectedProps {
  role: string;
  children: ReactNode;
}

const ProtectedRoute = ({ role, children }: ProtectedProps) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" />;
  }

  // ✅ Normalize to uppercase
  if (userRole?.toUpperCase() !== role.toUpperCase()) {
    return <Navigate to={`/${userRole?.toLowerCase()}`} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
