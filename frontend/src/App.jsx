// StyleGuru AI — Unified SPA Architecture v2.0
// Login = state change only, no page redirect
import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { logout } from './api/styleApi';
import { LanguageProvider } from './i18n/LanguageProvider';
import { PlanProvider } from './context/PlanProvider';
import { CartProvider } from './context/CartProvider';
import { useAuthState } from './hooks/useAuthState';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeContext } from './context/ThemeContext';

// ── Core shells (eagerly loaded for fast paint) ──
import LandingPage from './components/LandingPage';
import AuthPage    from './components/AuthPage';
import AppShell    from './components/AppShell';

// ── Other pages (lazy for code splitting) ──
const AboutPage      = lazy(() => import('./pages/AboutPage'));
const PrivacyPage    = lazy(() => import('./pages/PrivacyPage'));
const ContactPage    = lazy(() => import('./pages/ContactPage'));
const TermsPage      = lazy(() => import('./pages/TermsPage'));
const BlogListPage   = lazy(() => import('./pages/BlogListPage'));
const BlogPostPage   = lazy(() => import('./pages/BlogPostPage'));
const NotFoundPage   = lazy(() => import('./pages/NotFoundPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ProfilePage    = lazy(() => import('./pages/ProfilePage'));

// ── Minimal luxury loading screen ──
const LoadingFallback = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: '#0A0A0A', gap: 20
  }}>
    <div style={{
      width: 36, height: 36,
      border: '1px solid #242424', borderTop: '1px solid #C9A96E',
      borderRadius: '50%', animation: 'spinSmooth 0.8s linear infinite'
    }} />
    <p style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6B6B6B' }}>
      StyleGuru AI
    </p>
  </div>
);

// ── Auth error ──
function AuthErrorUI({ error, onRetry }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <p style={{ fontSize: '32px', marginBottom: 16 }}>⚠️</p>
        <h2 style={{ color: '#F0EDE6', fontSize: '20px', fontWeight: 300, marginBottom: 8 }}>Something went wrong</h2>
        <p style={{ color: '#6B6B6B', fontSize: '14px', marginBottom: 24 }}>{error}</p>
        <button
          onClick={onRetry}
          style={{ background: '#C9A96E', color: '#0A0A0A', border: 'none', padding: '12px 32px', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}

// ── Main Routes ──
function AppRoutes({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setUser(null);
    ['sg_last_analysis','sg_analysis_count','sg_streak_count','sg_last_checkin',
     'sg_daily_drop_date','sg_analysis_history','sg_saved_colors','sg_wardrobe_queue',
     'tonefit_user_status'
    ].forEach(k => localStorage.removeItem(k));
    // No navigate — stay on / which will show LandingPage (user=null)
  };

  // ── Root: decides which shell to render ──
  const RootShell = () => {
    if (user) {
      // Logged in → AppShell (new premium UI, no redirect)
      return <AppShell user={user} onLogout={handleLogout} />;
    }
    // Guest → LandingPage with inline auth capability
    return (
      <LandingPage
        user={null}
        onGetStarted={() => navigate('/auth')}
        onLoginClick={() => navigate('/auth')}
      />
    );
  };

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* ROOT — unified shell, no redirect after login */}
        <Route path="/" element={<RootShell />} />

        {/* AUTH — same page style modal preferred, fallback route */}
        <Route path="/auth" element={
          user ? <Navigate to="/" replace /> : <AuthPage onLoginSuccess={setUser} />
        } />

        {/* OLD dashboard route → redirect to / (AppShell handles it) */}
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/loading"   element={<LoadingFallback />} />

        {/* Static pages — kept separate with same premium theme */}
        <Route path="/about"       element={<AboutPage />} />
        <Route path="/privacy"     element={<PrivacyPage />} />
        <Route path="/contact"     element={<ContactPage />} />
        <Route path="/terms"       element={<TermsPage />} />
        <Route path="/blog"        element={<BlogListPage />} />
        <Route path="/blog/:slug"  element={<BlogPostPage />} />

        {/* Profile — inline in AppShell for logged in, redirect otherwise */}
        <Route path="/profile" element={
          user ? <Navigate to="/" replace /> : <Navigate to="/auth" replace />
        } />
        <Route path="/settings" element={<Navigate to="/" replace />} />

        {/* Admin */}
        <Route path="/admin" element={
          user ? <AdminDashboard /> : <Navigate to="/auth" replace />
        } />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

// ── App Root ──
function App() {
  const authState = useAuthState();
  const [theme, setTheme] = useState(() => localStorage.getItem('tonefit_theme') || 'dark');

  const user = authState.user
    ? { name: authState.user.name, email: authState.user.email }
    : null;

  const setUser = (newUser) => {
    if (newUser === null) logout();
    // authState handles the actual update via Firebase listener
  };

  if (authState.authError && !authState.loading) {
    return <AuthErrorUI error={authState.error} onRetry={() => window.location.reload()} />;
  }

  if (authState.loading) {
    return <LoadingFallback />;
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeContext.Provider value={{
          theme,
          setTheme,
          toggleTheme: () => setTheme(prev => {
            const next = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem('tonefit_theme', next);
            return next;
          })
        }}>
          <PlanProvider>
            <CartProvider>
              <div className={`min-h-screen transition-colors duration-300 ${theme}`}>
                <AppRoutes user={user} setUser={setUser} />
              </div>
            </CartProvider>
          </PlanProvider>
        </ThemeContext.Provider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
