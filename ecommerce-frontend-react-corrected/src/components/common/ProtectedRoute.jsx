import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ roles }) {
  const user = useSelector((state) => state.auth.user);

  const loading = useSelector((state) => state.auth.loading);

  if (loading) {
    return (
      <div className="protected-route-loading">
        <div className="protected-route-loader">
          <span className="protected-route-spinner" />
        </div>

        <div className="protected-route-title">
          Loading your account
        </div>

        <div className="protected-route-text">
          Please wait while we verify your session.
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}