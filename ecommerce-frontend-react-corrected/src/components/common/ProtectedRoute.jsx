import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ roles }) {
  const user = useSelector((state) => state.auth.user);

  const loading = useSelector((state) => state.auth.loading);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" aria-label="Loading" />
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
