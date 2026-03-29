import React, { useState, useEffect, createContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { auth, logout, loadProfile } from './api/styleApi';
import { onAuthStateChanged } from 'firebase/auth';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import { LanguageProvider } from './i18n/LanguageContext';
import { PlanProvider } from './context/PlanContext';

// Lazy imports for new pages (will be created in later tasks)
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import ContactPage from './pages/ContactPage';
import TermsPage from './pages/TermsPage';
import BlogListPage from './pages/BlogListPage';
import BlogPostPage from './pages/BlogPostPage';
import NotFoundPage from './pages/NotFoundPage';

export const ThemeContext = createContext();

function PrivateRoute({ user, children }) {
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage onGetStarted={() => navigate('/login')} />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage onLoginSuccess={setUser} />} />
      <Route path="/dashboard" element={
        <PrivateRoute user={user}>
          <Dashboard user={user} onLogout={handleLogout} />
        </PrivateRoute>
      } />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/blog" element={<BlogListPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('tonefit_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading ToneFit...</div>
      </div>
    );
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
