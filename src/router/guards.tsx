import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../state';

const CenteredLoader: React.FC = () => (
  <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
    <div className="skeleton-spinner" style={{
      width: '36px', height: '36px', borderRadius: '50%',
      border: '3px solid var(--glass-border)', borderTopColor: 'var(--accent-purple)',
      animation: 'spin 0.8s linear infinite'
    }} />
  </div>
);

// Protects student-only routes (e.g. /app). Redirects unauthenticated users to /login,
// and shows "Unauthorized Access" + bounces admins back to the student portal.
export const RequireStudent: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { authUser, authLoading } = useApp();
  const location = useLocation();

  if (authLoading) return <CenteredLoader />;
  if (!authUser) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (authUser.role !== 'student') {
    return <Navigate to="/login" replace state={{ message: 'Unauthorized Access' }} />;
  }
  return children;
};

// Protects admin-only routes (e.g. /admin/*). A student who reaches an admin route
// (even with a valid student session) is bounced to Student Login with "Unauthorized Access".
export const RequireAdmin: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { authUser, authLoading } = useApp();

  if (authLoading) return <CenteredLoader />;
  if (!authUser) return <Navigate to="/admin/login" replace />;
  if (authUser.role !== 'admin') {
    return <Navigate to="/login" replace state={{ message: 'Unauthorized Access' }} />;
  }
  return children;
};

// Used on /login and /admin/login so an already-authenticated user skips the form.
export const RedirectIfAuthed: React.FC<{ children: React.ReactElement; role: 'student' | 'admin' }> = ({ children, role }) => {
  const { authUser, authLoading } = useApp();
  if (authLoading) return <CenteredLoader />;
  if (authUser && authUser.role === role) {
    return <Navigate to={role === 'admin' ? '/admin' : '/app'} replace />;
  }
  return children;
};
