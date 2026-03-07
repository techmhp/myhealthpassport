import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, backendUser, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check both Supabase Auth (user) and backend session (backendUser)
  const isAuthenticated = !!user || !!backendUser;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    const dashboardPath = getRoleDashboardPath(role);
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
}

export function getRoleDashboardPath(role: AppRole | null): string {
  switch (role) {
    case 'parent':
      return '/parent-dashboard';
    case 'school':
      return '/school-dashboard';
    case 'expert':
      return '/expert-dashboard';
    case 'admin':
      return '/admin-dashboard';
    default:
      return '/';
  }
}
