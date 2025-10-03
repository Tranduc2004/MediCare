import { useAuth } from "../../../contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    const lastPortal = window.sessionStorage.getItem("lastPortal");
    return (
      <Navigate to={lastPortal === "doctor" ? "/doctor/login" : "/login"} />
    );
  }

  return <Outlet />;
}
