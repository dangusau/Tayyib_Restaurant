import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Initialisation still running – show a clean spinner
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}