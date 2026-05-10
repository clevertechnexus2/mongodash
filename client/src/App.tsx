import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth } from './api';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Apps from './pages/Apps';
import CreateApp from './pages/CreateApp';
import AppDetail from './pages/AppDetail';
import Databases from './pages/Databases';
import Docs from './pages/Docs';
import UsersPage from './pages/Users';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import LicensePage from './pages/LicensePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'auth' | 'unauth'>('loading');

  useEffect(() => {
    auth.me()
      .then(() => setStatus('auth'))
      .catch(() => setStatus('unauth'));
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauth') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — no auth required */}
        <Route path="/login" element={<Login />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/license" element={<LicensePage />} />

        {/* Protected app routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="apps" element={<Apps />} />
          <Route path="apps/new" element={<CreateApp />} />
          <Route path="apps/:id" element={<AppDetail />} />
          <Route path="databases" element={<Databases />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="docs" element={<Docs />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
