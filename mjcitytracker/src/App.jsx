import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const { currentUser } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/signup" element={currentUser ? <Navigate to="/dashboard" replace /> : <SignupPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
