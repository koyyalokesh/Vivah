import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthLoading } from './AuthLoading';
import { useAuth } from './useAuth';

export function ProtectedRoute() {
  const { user, isLoading, signedOutFromLocationKey } = useAuth();
  const location = useLocation();

  if (isLoading) return <AuthLoading />;
  if (!user) {
    return signedOutFromLocationKey === location.key ? (
      <Navigate to="/" replace />
    ) : (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }

  return <Outlet />;
}
