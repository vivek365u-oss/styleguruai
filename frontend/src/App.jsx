import React, { useState, useEffect, createContext, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { auth, logout, loadProfile, guestLogin } from './api/styleApi';
import { onAuthStateChanged } from 'firebase/auth';
import { LanguageProvider } from './i18n/LanguageContext';
import { PlanProvider } from './context/PlanContext';
import SplashScreen from './components/SplashScreen';

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
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

export const ThemeContext = createContext();

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
    localStorage.removeItem('tonefit_user_status');
    navigate('/');
  };


  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage onLoginSuccess={setUser} />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/dashboard" element={<Dashboard user={user} onLogout={handleLogout} />} />
        <Route path="/profile" element={
          <PrivateRoute user={user}>
            <ProfilePage />
          </PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute user={user}>
            <SettingsPage />
          </PrivateRoute>
        } />
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [theme, setTheme] = useState(() => {
    // Always start with light mode by default
    return 'light';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({ name: firebaseUser.displayName || firebaseUser.email, email: firebaseUser.email });
        // Load profile from Firestore and sync to localStorage
        try {
          const profile = await loadProfile(firebaseUser.uid);
          if (profile) {
            // Overwrite localStorage with Firestore data (cross-device sync)
            const existing = (() => { try { return JSON.parse(localStorage.getItem('sg_last_analysis') || 'null'); } catch { return null; } })();
            const firestoreEntry = {
              ...(existing || {}),
              skinTone: profile.skin_tone,
              undertone: profile.undertone,
              season: profile.color_season,
              skinHex: profile.skin_hex,
              confidence: profile.confidence,
              date: existing?.date || new Date().toLocaleDateString('en-IN'),
              timestamp: existing?.timestamp || Date.now(),
              fullData: existing?.fullData || null,
            };
            localStorage.setItem('sg_last_analysis', JSON.stringify(firestoreEntry));
            // Apply saved preferences
            if (profile.gender_mode) localStorage.setItem('sg_gender', profile.gender_mode);
            if (profile.language) localStorage.setItem('sg_language', profile.language);
          }
        } catch (e) {
          console.error('loadProfile on login error:', e);
        }
        // Remove guest status sync since guest mode no longer exists
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('tonefit_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const saved = localStorage.getItem('tonefit_theme');
      if (!saved) setTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <LanguageProvider>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <PlanProvider>
          <div className="min-h-screen">
            <AppRoutes user={user} setUser={setUser} theme={theme} toggleTheme={toggleTheme} />
          </div>
        </PlanProvider>
      </ThemeContext.Provider>
    </LanguageProvider>
  );
}

export default App;
