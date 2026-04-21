import { Navigate, Outlet } from "react-router-dom";
import { getUser } from "../lib/auth";

function ProtectedRoute({ allowedRoles }) {
  const user = getUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const normalizedUserRole = String(user.role || "").toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map((role) => String(role).toLowerCase());

  if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
