import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { authLoading } = useAuth();

  if (authLoading) {
    return <div className="grid min-h-screen place-items-center bg-slate-100 text-slate-600">Loading...</div>;
  }

  return children;
}
