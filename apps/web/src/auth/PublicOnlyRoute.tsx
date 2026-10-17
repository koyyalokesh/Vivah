import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthLoading } from './AuthLoading';
import { getAuthReturnPath } from './auth-return-path';
import { useAuth } from './useAuth';

export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <AuthLoading />;
  return user ? (
    <Navigate to={getAuthReturnPath(location.state)} replace />
  ) : (
    <Outlet />
  );
}
