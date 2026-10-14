import { Navigate, Outlet } from 'react-router-dom';
import { AuthLoading } from './AuthLoading';
import { useAuth } from './useAuth';

export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthLoading />;
  return user ? <Navigate to="/app" replace /> : <Outlet />;
}
