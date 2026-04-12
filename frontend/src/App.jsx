// StyleGuru AI — Unified SPA Architecture v3.0
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
import LandingPage   from './components/LandingPage';
import AuthPage      from './components/AuthPage';
import AppShell      from './components/AppShell';
import PublicLayout  from './layouts/PublicLayout';

// ── Static pages (lazy for code splitting) ──
const AboutPage      = lazy(() => import('./pages/AboutPage'));
const PrivacyPage    = lazy(() => import('./pages/PrivacyPage'));
const ContactPage    = lazy(() => import('./pages/ContactPage'));
const TermsPage      = lazy(() => import('./pages/TermsPage'));
const BlogListPage   = lazy(() => import('./pages/BlogListPage'));
const BlogPostPage   = lazy(() => import('./pages/BlogPostPage'));
const NotFoundPage   = lazy(() => import('./pages/NotFoundPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ProfilePage    = lazy(() => import('./pages/ProfilePage'));

// ── Premium Loading Screen ──
const LoadingFallback = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: '#0B0F1A', gap: 32, position: 'relative', overflow: 'hidden'
  }}>
    {/* Soft glow background */}
    <div style={{
      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      width: 200, height: 200, background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
      pointerEvents: 'none'
    }} />

    {/* Spinning logo container */}
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer gradient spinning ring */}
      <div style={{
        position: 'absolute', inset: -10, borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
        animation: 'spinSmooth 1.2s linear infinite',
        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        maskComposite: 'exclude', WebkitMaskComposite: 'xor',
        padding: 2
      }} />

      {/* Inner glass logo block */}
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(139,92,246,0.25)',
        animation: 'pulse-glow 2.5s ease-in-out infinite'
      }}>
        <span style={{
          fontSize: '22px', fontWeight: 800, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>SG</span>
      </div>
    </div>

    {/* Text content */}
    <div style={{ textAlign: 'center', zIndex: 1, animation: 'fadeSlideIn 0.8s ease forwards' }}>
      <p style={{
        fontSize: '18px', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", color: '#F9FAFB', margin: '0 0 6px', letterSpacing: '0.02em'
      }}>StyleGuru <span style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span></p>
      <p style={{ fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#9CA3AF', margin: 0, fontWeight: 500 }}>
        Loading Intelligence
      </p>
    </div>
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


  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* ROOT — Inline conditional: no intermediate component = no remount on re-render */}
        <Route path="/" element={
          user
            ? <AppShell user={user} onLogout={handleLogout} />
            : <LandingPage
                user={null}
                onGetStarted={() => navigate('/auth')}
                onLoginClick={() => navigate('/auth')}
              />
        } />


        {/* AUTH */}
        <Route path="/auth" element={
          user ? <Navigate to="/" replace /> : <AuthPage onLoginSuccess={setUser} />
        } />

        {/* Legacy redirects */}
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/loading"   element={<LoadingFallback />} />
        <Route path="/profile"   element={user ? <Navigate to="/" replace /> : <Navigate to="/auth" replace />} />
        <Route path="/settings"  element={<Navigate to="/" replace />} />

        {/* ════════════════════════════════════
            PUBLIC STATIC PAGES
            All wrapped in PublicLayout:
            → Premium Navbar + Footer on every page
            → <Outlet /> renders page content only
            → Zero UI leakage between pages
            ════════════════════════════════════ */}
        <Route element={<PublicLayout />}>
          <Route path="/about"      element={<AboutPage />} />
          <Route path="/privacy"    element={<PrivacyPage />} />
          <Route path="/contact"    element={<ContactPage />} />
          <Route path="/terms"      element={<TermsPage />} />
          <Route path="/blog"       element={<BlogListPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
        </Route>

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
