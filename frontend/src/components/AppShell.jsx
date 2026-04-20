import React, { useState, useEffect, useMemo, useCallback, useContext, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, logout, API, db, saveHistory, getHistory } from '../api/styleApi';
import { ThemeContext } from '../context/ThemeContext';
import { usePlan } from '../context/PlanContext';
import { useCart } from '../context/CartContext';
import { getThemeColors, VIOLET, GRAD, PJS } from '../utils/theme';
import { EVENTS, logEvent } from '../utils/analytics';

// Lazy load components for performance
const HomeSection = lazy(() => import('./HomeSection'));
const UploadSection = lazy(() => import('./UploadSection'));
const ResultsDisplay = lazy(() => import('./ResultsDisplay'));
const HistoryPanel = lazy(() => import('./HistoryPanel'));
const WardrobePanel = lazy(() => import('./WardrobePanel'));
const ToolsTab = lazy(() => import('./ToolsTab'));
const ProfileSection = lazy(() => import('./ProfileSection'));
const SectionHeader = lazy(() => import('./SectionHeader'));
const LoadingScreenWithProgress = lazy(() => import('./LoadingScreenWithProgress'));
const ColorScanner = lazy(() => import('./ColorScanner'));
const StyleNavigator = lazy(() => import('./StyleNavigator'));
const LookbookPanel = lazy(() => import('./LookbookPanel'));
const CoupleResults = lazy(() => import('./CoupleResults'));
const SubscriptionModal = lazy(() => import('./SubscriptionModal'));
const StyleBot = lazy(() => import('./StyleBot'));
const ShoppingCart = lazy(() => import('./ShoppingCart'));

// Sub-components
const SectionLoader = ({ C }) => (
  <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${C.glass}`, borderTopColor: VIOLET }} />
    <span style={{ fontSize: '12px', color: C.muted, fontFamily: PJS }}>Consulting AI Guru...</span>
  </div>
);

const Toast = ({ message, type, onClose, C }) => (
  <motion.div initial={{ opacity: 0, y: 40, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
    style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: type === 'danger' ? C.dangerBg : C.glass, backdropFilter: 'blur(16px)', border: `1px solid ${type === 'danger' ? C.dangerBorder : C.border}`, padding: '12px 24px', borderRadius: 100, boxShadow: '0 12px 32px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
    <span style={{ fontSize: '14px' }}>{type === 'success' ? '✅' : '⚡'}</span>
    <span style={{ color: type === 'danger' ? C.dangerText : C.text, fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', fontFamily: PJS }}>{message}</span>
  </motion.div>
);

// ══════════════════════════════════════════════════════
// MAIN APP SHELL
// ══════════════════════════════════════════════════════
export default function AppShell({ user, onLogout }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { isPro, usage, coins } = usePlan();
  const { cartOpen, setCartOpen } = useCart();

  const C = useMemo(() => getThemeColors(theme), [theme]);

  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'home';
  });
  const [tabHistory, setTabHistory] = useState(['home']);
  const [results, setResults] = useState(null);
  const [adSkipped, setAdSkipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [currentGender, setCurrentGender] = useState(localStorage.getItem('sg_gender') || 'male');
  const [lastAnalysis, setLastAnalysis] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sg_last_analysis') || 'null'); } catch { return null; }
  });
  const [toast, setToast] = useState(null);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setNavScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    getHistory(isPro ? 100 : 10).then(res => {
      const firestoreCount = res?.data?.history?.length || 0;
      const localCount = parseInt(localStorage.getItem('sg_analysis_count') || '0');
      if (firestoreCount > localCount) localStorage.setItem('sg_analysis_count', firestoreCount.toString());
      const localLast = localStorage.getItem('sg_last_analysis');
      if (!localLast && res?.data?.history?.length > 0) {
        const lastEntry = res.data.history[0];
        localStorage.setItem('sg_last_analysis', JSON.stringify(lastEntry));
        setLastAnalysis(lastEntry);
      }
    }).catch(() => { });
  }, [user?.uid, isPro]);

  const handleTabChange = useCallback((id) => {
    setActiveTab(id);
    setTabHistory(prev => [...prev, id]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const url = new URL(window.location);
    url.searchParams.set('tab', id);
    window.history.pushState({}, '', url);
  }, []);

  const handleAnalysisComplete = useCallback(async (data) => {
    setLoading(false); setResults(data); setActiveTab('analyze');
    const entry = { ...data, timestamp: Date.now() };
    localStorage.setItem('sg_last_analysis', JSON.stringify(entry));
    setLastAnalysis(entry);
    const count = parseInt(localStorage.getItem('sg_analysis_count') || '0') + 1;
    localStorage.setItem('sg_analysis_count', count.toString());
    setToast({ message: '✨ Analysis complete!', type: 'success' });
    try { await saveHistory(data); } catch (e) { console.warn('Firestore save failed:', e); }
    logEvent(EVENTS.ANALYSIS_COMPLETE);
  }, []);

  const handleReset = useCallback(() => {
    setResults(null); setError(null); setUploadedImage(null); setAdSkipped(false);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    ['sg_last_analysis', 'sg_analysis_count', 'sg_streak_count', 'sg_last_checkin',
      'sg_daily_drop_date', 'sg_analysis_history', 'sg_saved_colors', 'sg_wardrobe_queue',
    ].forEach(k => localStorage.removeItem(k));
    onLogout();
  }, [onLogout]);

  const avatarLetter = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase();

  const desktopTabs = [
    { id: 'home', label: 'Home' },
    { id: 'analyze', label: 'Analyze' },
    { id: 'lookbook', label: 'Lookbook' },
    { id: 'history', label: 'History' },
    { id: 'navigator', label: 'Style Compass' },
    { id: 'tools', label: 'Tools' },
  ];

  const mobileTabs = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'analyze', icon: '📷', label: 'Analyze' },
    { id: 'lookbook', icon: '📖', label: 'Lookbook' },
    { id: 'history', icon: '📋', label: 'History' },
    { id: 'tools', icon: '🛠️', label: 'Tools' },
    { id: 'navigator', icon: '🧭', label: 'Compass' },
  ];

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', fontFamily: PJS, position: 'relative', transition: 'background 0.3s, color 0.3s' }}>
      {/* Radial BG Glows */}
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '50vw', height: '50vh', background: `radial-gradient(circle,${C.glow1} 0%,transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: '50vw', height: '50vh', background: `radial-gradient(circle,${C.glow2} 0%,transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />

      {/* ═══════════ TOP NAV ═══════════ */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 60, background: navScrolled ? C.navBg : C.navBgScroll, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: `1px solid ${navScrolled ? C.border : 'transparent'}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, transition: 'all 0.3s' }}>
        <button onClick={() => handleTabChange('home')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
          <img src="/logo.png" alt="StyleGuru AI Logo" style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'cover', boxShadow: '0 4px 12px rgba(139,92,246,0.2)' }} />
          <span style={{ fontSize: '15px', fontWeight: 700, color: C.text, fontFamily: PJS, letterSpacing: '-0.3px' }}>
            StyleGuru <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
          </span>
        </button>

        <div className="hidden md:flex" style={{ flex: 1, justifyContent: 'center', gap: 2 }}>
          {desktopTabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id} onClick={() => handleTabChange(tab.id)}
                style={{ background: active ? `rgba(139,92,246,${C.isDark ? '0.12' : '0.08'})` : 'transparent', border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: 8, fontSize: '13px', fontWeight: active ? 600 : 400, color: active ? C.text : C.muted, transition: 'all 0.2s', fontFamily: PJS, position: 'relative' }}
              >
                {tab.label}
                {active && <div style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)', width: 18, height: 2, borderRadius: 1, background: GRAD }} />}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <button
            onClick={() => { toggleTheme(); setToast({ message: `${theme === 'dark' ? 'Light' : 'Dark'} Mode`, type: 'success' }); }}
            title="Toggle theme"
            style={{ width: 34, height: 34, borderRadius: 8, background: C.glass2, border: `1px solid ${C.border}`, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '15px', transition: 'all 0.2s' }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => handleTabChange('profile')}
            style={{ width: 36, height: 36, borderRadius: '50%', background: activeTab === 'profile' ? GRAD : C.glass2, border: `1px solid ${activeTab === 'profile' ? 'transparent' : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTab === 'profile' ? C.btnShadow : 'none', fontSize: '14px', fontWeight: 700, color: activeTab === 'profile' ? 'white' : C.text, fontFamily: PJS, position: 'relative' }}
          >
            {avatarLetter}
            {isPro && (
              <div 
                title="Pro Member"
                style={{ position: 'absolute', top: -4, right: -4, background: '#F59E0B', width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', border: `2px solid ${C.navBg}`, boxShadow: '0 0 8px rgba(245,158,11,0.5)' }}
              >
                🌟
              </div>
            )}
          </button>
        </div>
      </nav>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '76px 16px 100px', position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <Suspense fallback={<SectionLoader C={C} />}>

            {activeTab === 'home' && (
              <motion.div 
                key="home" 
                initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              >
                <HomeSection C={C} user={user} lastAnalysis={lastAnalysis} onAnalyze={() => handleTabChange('analyze')} onTabChange={handleTabChange} />
              </motion.div>
            )}

            {activeTab === 'lookbook' && (
              <motion.div key="lookbook" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <LookbookPanel C={C} />
              </motion.div>
            )}

            {activeTab === 'analyze' && (
              <motion.div key="analyze" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <SectionHeader C={C} label="AI Analysis" title={results ? 'Your Style Profile' : 'Upload a Photo'} />
                {results ? <ResultsDisplay data={results} uploadedImage={uploadedImage} onReset={handleReset} /> : <UploadSection onLoadingStart={() => setLoading(true)} onAnalysisComplete={handleAnalysisComplete} currentGender={currentGender} setCurrentGender={setCurrentGender} isPro={isPro} usage={usage} coins={coins} />}
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <SectionHeader C={C} label="Your Archive" title="Analysis History" />
                <HistoryPanel onShowResult={data => { setResults(data); handleTabChange('analyze'); }} />
              </motion.div>
            )}

            {activeTab === 'wardrobe' && (
              <motion.div key="wardrobe" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <SectionHeader C={C} label="Style Vault" title="Your Wardrobe" />
                <WardrobePanel onShowResult={data => { setResults(data); handleTabChange('analyze'); }} gender={currentGender} />
              </motion.div>
            )}

            {activeTab === 'navigator' && (
              <motion.div key="navigator" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <SectionHeader C={C} label="AI Insights" title="Style Compass" />
                <StyleNavigator user={user} onAnalyze={() => handleTabChange('analyze')} />
              </motion.div>
            )}

            {activeTab === 'tools' && (
              <motion.div key="tools" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <SectionHeader C={C} label="Power Tools" title="Style Tools" />
                <ToolsTab analysisData={results} onShowResult={data => { setResults(data); handleTabChange('analyze'); }} onOpenScanner={() => handleTabChange('scanner')} />
              </motion.div>
            )}

            {activeTab === 'scanner' && (
              <motion.div key="scanner" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
                <ColorScanner onClose={() => handleTabChange('home')} />
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <ProfileSection C={C} theme={theme} toggleTheme={toggleTheme} user={user} onLogout={handleLogout} onTabChange={handleTabChange} onToast={setToast} isPro={isPro} usage={usage} />
              </motion.div>
            )}

          </Suspense>
        </AnimatePresence>
      </main>

      {/* ═══════════ MOBILE BOTTOM NAV ═══════════ */}
      <nav className="mobile-bottom-nav md:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: C.bottomNav, backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', borderTop: `1px solid ${C.border}`, paddingBottom: 'env(safe-area-inset-bottom,4px)' }}>
        {mobileTabs.map(item => {
          const active = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => handleTabChange(item.id)} style={{ flex: 1, padding: '10px 2px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
              {active && <div style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: 2, background: GRAD, borderRadius: 1 }} />}
              <span style={{ fontSize: '19px', lineHeight: 1, opacity: active ? 1 : 0.4, transition: 'opacity 0.2s' }}>{item.icon}</span>
              <span style={{ fontSize: '8px', letterSpacing: '0.05em', textTransform: 'uppercase', color: active ? C.text : C.muted, fontWeight: active ? 600 : 400, fontFamily: PJS, transition: 'color 0.2s' }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <StyleBot />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} C={C} />}
      <ShoppingCart isOpen={cartOpen} onClose={() => setCartOpen(false)} isDark={C.isDark} />
      <Suspense fallback={null}><SubscriptionModal /></Suspense>
    </div>
  );
}
