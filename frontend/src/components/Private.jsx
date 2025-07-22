import { Navigate } from "react-router-dom";

export function PrivateRoute({ children }) {
  const token = localStorage.getItem("admin_token");
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}