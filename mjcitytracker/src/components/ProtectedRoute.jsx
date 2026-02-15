import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) {
    return <div className="grid min-h-screen place-items-center bg-slate-100 text-slate-600">Checking session...</div>;
  }

  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}
