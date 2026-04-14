/**
 * App.jsx — Root application with routing and layout wrapper
 */

import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Lazy-loaded Pages
const LandingPage     = lazy(() => import('./pages/LandingPage'));
const AuthPage        = lazy(() => import('./pages/AuthPage'));
const UserDashboard   = lazy(() => import('./pages/UserDashboard'));
const SubmitComplaint = lazy(() => import('./pages/SubmitComplaint'));
const AdminDashboard  = lazy(() => import('./pages/AdminDashboard'));
const DepartmentPanel = lazy(() => import('./pages/DepartmentPanel'));

// Components
import Navbar  from './components/Navbar';
import Sidebar from './components/Sidebar';

// ── Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner spinner-lg" />
        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles.length && !allowedRoles.includes(user?.role)) return <Navigate to="/dashboard" replace />;

  return children;
};

// ── Layout that includes Navbar + Sidebar
function AppLayout() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isAuthPage = ['/login', '/register'].includes(location.pathname);
  const isLanding  = location.pathname === '/';

  return (
    <>
      <Toaster position="top-right" toastOptions={{ className: 'toast-custom', duration: 4000 }} />

      {/* Navbar always shown except on pure auth pages */}
      {!isAuthPage && <Navbar onMenuToggle={() => setSidebarOpen(o => !o)} sidebarOpen={sidebarOpen} />}

      {/* Sidebar only for authenticated users on non-landing pages */}
      {isAuthenticated && !isAuthPage && !isLanding && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main
        className={
          isAuthenticated && !isAuthPage && !isLanding
            ? `page-content ${sidebarOpen ? '' : 'sidebar-collapsed'}`
            : ''
        }
        style={isLanding || isAuthPage ? { paddingTop: 0, marginLeft: 0 } : {}}
      >
        <div className={isAuthenticated && !isAuthPage && !isLanding ? 'page-inner' : ''}>
          <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
              <div className="spinner spinner-lg" />
              <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Loading Page...</p>
            </div>
          }>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/"          element={<LandingPage />} />
                <Route path="/login"     element={<AuthPage mode="login" />} />
                <Route path="/register"  element={<AuthPage mode="register" />} />

                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={['citizen', 'admin', 'department_officer']}>
                    <UserDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/submit" element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <SubmitComplaint />
                  </ProtectedRoute>
                } />

                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/department" element={
                  <ProtectedRoute allowedRoles={['department_officer']}>
                    <DepartmentPanel />
                  </ProtectedRoute>
                } />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </div>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <AppLayout />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
