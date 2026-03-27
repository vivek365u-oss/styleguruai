import React, { useState, useEffect, createContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { auth, logout } from './api/styleApi';
import { onAuthStateChanged } from 'firebase/auth';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import { LanguageProvider } from './i18n/LanguageContext';

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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({ name: firebaseUser.displayName || firebaseUser.email, email: firebaseUser.email });
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
        <div className="min-h-screen">
          <AppRoutes user={user} setUser={setUser} theme={theme} toggleTheme={toggleTheme} />
        </div>
      </ThemeContext.Provider>
    </LanguageProvider>
  );
}

export default App;
