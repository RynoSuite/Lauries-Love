import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

// Gate a route on being signed in, and optionally on staff access.
export function ProtectedRoute({
  children,
  requireStaff = false,
}: {
  children: ReactNode;
  requireStaff?: boolean;
}) {
  const { session, isStaff, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (requireStaff && !isStaff)
    return (
      <div className="grid min-h-screen place-items-center text-heading">
        You don’t have access to the admin console.
      </div>
    );
  return <>{children}</>;
}
