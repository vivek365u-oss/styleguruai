// StyleGuru AI - Production Build v1.2.1 [2026-04-09]
import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { logout } from './api/styleApi';
import { LanguageProvider } from './i18n/LanguageProvider';
import { PlanProvider } from './context/PlanProvider';
import { CartProvider } from './context/CartProvider';
import SplashScreen from './components/SplashScreen';
import { useAuthState } from './hooks/useAuthState';
import ErrorBoundary from './components/ErrorBoundary';

// Eagerly loaded components for fast initial render
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';

// Lazy loaded components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const BlogListPage = lazy(() => import('./pages/BlogListPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
// OrderSuccessPage lazy import removed

import { ThemeContext } from './context/ThemeContext';

const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#050816] via-purple-950 to-[#050816] flex flex-col items-center justify-center relative overflow-hidden">
    <div className="absolute inset-0 z-0">
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-600 rounded-full opacity-20 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-pink-600 rounded-full opacity-20 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
    </div>
    <div className="relative z-10 flex flex-col items-center">
      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-2xl shadow-purple-500/40 flex items-center justify-center mb-6 animate-bounce">
        <span className="text-white text-3xl font-black tracking-tighter">SG</span>
      </div>
      <h2 className="text-2xl font-black text-white tracking-widest uppercase opacity-80 animate-pulse">StyleGuru</h2>
    </div>
  </div>
);

/**
 * Auth Error Component - Shown when profile loading fails
 */
function AuthErrorUI({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050816] via-purple-950 to-[#050816] flex flex-col items-center justify-center p-4">
      <div className="max-w-sm text-center space-y-4">
        <div className="text-6xl">⚠️</div>
        <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
        <p className="text-purple-200/80">{error}</p>
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg text-white font-semibold transition-all"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function PrivateRoute({ user, children }) {
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setUser(null);
    // Clear fashion data on logout to prevent persistence for the next user/guest
    const keysToClear = [
      'sg_last_analysis',
      'sg_analysis_count',
      'sg_streak_count',
      'sg_last_checkin',
      'sg_daily_drop_date',
      'sg_analysis_history',
      'sg_saved_colors',
      'sg_wardrobe_queue'
    ];
    keysToClear.forEach(key => localStorage.removeItem(key));
    localStorage.removeItem('tonefit_user_status');
    navigate('/');
  };


  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage onLoginSuccess={setUser} />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/dashboard" element={<Dashboard user={user} onLogout={handleLogout} />} />
        {/* OrderSuccess route removed */}
        <Route path="/profile" element={
          <PrivateRoute user={user}>
            <ProfilePage />
          </PrivateRoute>
        } />
        <Route path="/settings" element={<Navigate to="/profile" replace />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/admin" element={
          <PrivateRoute user={user}>
            <AdminDashboard />
          </PrivateRoute>
        } />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  const authState = useAuthState();
  const [showSplash, setShowSplash] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tonefit_theme') || 'dark';
  });

  const user = authState.user ?
    { name: authState.user.name, email: authState.user.email }
    : null;

  const setUser = (newUser) => {
    if (newUser === null) {
      logout();
    }
  };

  // Handle auth errors with retry
  if (authState.authError && !authState.loading) {
    return (
      <AuthErrorUI
        error={authState.error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (authState.loading) {
    return <LoadingFallback />;
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme: () => setTheme(prev => {
          const next = prev === 'dark' ? 'light' : 'dark';
          localStorage.setItem('tonefit_theme', next);
          return next;
        }) }}>
          <PlanProvider>
            <CartProvider>
              <div className="min-h-screen">
                <AppRoutes user={user} setUser={setUser} theme={theme} toggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} />
              </div>
            </CartProvider>
          </PlanProvider>
        </ThemeContext.Provider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
