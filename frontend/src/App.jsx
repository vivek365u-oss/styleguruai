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
const Dashboard = lazy(() => import('./components/AppShell'));
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

function PrivateRoute({ user, loading, children }) {
  // While auth is resolving, show spinner — do NOT redirect yet
  if (loading) return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes({ user, setUser, authLoading }) {
  const navigate = useNavigate();

  // BUG #2 fix: Safety-net navigation in case the onAuthStateChanged fires
  // after a slight delay post email/password login (race condition guard).
  // When `user` becomes non-null and we are still on /login, push to dashboard.
  React.useEffect(() => {
    if (user && (window.location.pathname === '/login' || window.location.pathname === '/')) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    // 1. Immediately clear local state so route guard redirects to '/' at once
    setUser(null);
    // 2. Clear all cached fashion data
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
    localStorage.removeItem('tonefit_user');
    // 3. Navigate first, THEN sign out from Firebase (avoids auth listener racing)
    navigate('/', { replace: true });
    await logout();
  };


  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage user={user} onLoginClick={() => navigate('/login')} onGetStarted={() => navigate('/login')} />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage onLoginSuccess={setUser} />} />
        {/* MOBILE LOGIN FIX: While auth is still loading (profile fetch in progress),
            show a spinner on /dashboard instead of redirecting to "/".
            Without this, navigate('/dashboard') right after Google login hits this route
            with user=null (auth still loading) and bounces back to landing page → login loop. */}
        <Route path="/dashboard" element={
          authLoading
            ? <div className="min-h-screen bg-[#050816] flex items-center justify-center"><div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" /></div>
            : user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />
        } />
        {/* OrderSuccess route removed */}
        <Route path="/profile" element={
          <PrivateRoute user={user} loading={authLoading}>
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
  
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('sg_ref', ref);
    }
  }, []);

  // Use sessionStorage to remember splash shown, AND check localStorage to see if we should even show it to guests
  const [splashDone, setSplashDone] = React.useState(() => {
    return sessionStorage.getItem('sg_splash_shown') === 'true';
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tonefit_theme') || 'dark';
  });

  const user = authState.user ?
    { name: authState.user.name, email: authState.user.email }
    : null;

  // NOTE: setUser is only used by AppRoutes internally.
  // handleLogout in AppRoutes handles the actual signOut — do NOT call logout() here again.
  const setUser = (_newUser) => {
    // Auth state is driven by onAuthStateChanged in useAuthState.
    // This function exists for compatibility; actual logout is handled in handleLogout.
  };

  const handleSplashComplete = () => {
    setSplashDone(true);
    sessionStorage.setItem('sg_splash_shown', 'true');
  };

  const isLikelyGuest = !localStorage.getItem('tonefit_user');

  // Handle auth errors with retry
  if (authState.authError && !authState.loading) {
    return (
      <AuthErrorUI
        error={authState.error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // CRITICAL FIX: If Firebase is still resolving auth state, DO NOT render AppRoutes
  // UNLESS the user just logged in and is heading to /dashboard (mobile login fix).
  // We detect this by checking if tonefit_user exists (set by saveAuth right after login)
  // AND the user is navigating to /dashboard — in that case, let AppRoutes handle the spinner.
  const isHeadingToDashboard = typeof window !== 'undefined' &&
    window.location.pathname === '/dashboard' &&
    !!localStorage.getItem('tonefit_user');

  if (authState.loading && !isHeadingToDashboard) {
    if (!splashDone && !isLikelyGuest) {
      return <SplashScreen onComplete={handleSplashComplete} />;
    }
    const bgClass = theme === 'dark' ? 'bg-[#050816]' : 'bg-gray-50';
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  // If auth is resolved but splash animation is still needed
  if (!splashDone && !!user) {
    return <SplashScreen onComplete={handleSplashComplete} />;
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
                <AppRoutes user={user} setUser={setUser} authLoading={authState.loading} theme={theme} toggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} />
              </div>
            </CartProvider>
          </PlanProvider>
        </ThemeContext.Provider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
