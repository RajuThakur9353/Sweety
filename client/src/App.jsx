import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import { Activity } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center animate-bounce shadow-lg shadow-rose-200">
          <Activity className="w-7 h-7" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-600">Loading Sweety...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <DashboardPage />;
  }

  if (authView === 'register') {
    return <RegisterPage onNavigateToLogin={() => setAuthView('login')} />;
  }

  return <LoginPage onNavigateToRegister={() => setAuthView('register')} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
