import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Spinner } from '../ui/Spinner';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, sessionExpired } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={sessionExpired ? '/login?expired=true' : '/login'} replace />;
  }

  return <Outlet />;
};
