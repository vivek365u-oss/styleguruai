/**
 * AppShell.jsx — StyleGuru AI Unified Post-Login Shell
 *
 * Architecture:
 * - Renders INSTEAD of old Dashboard after login (no redirect)
 * - Same premium navbar as landing page (Login → Avatar)
 * - All feature components reused unchanged (UploadSection, HistoryPanel, etc.)
 * - Mobile: bottom navigation
 * - Desktop: top navigation, full-width content
 */

import { useState, useEffect, useContext, lazy, Suspense } from 'react';
import { logout, saveProfile, saveHistory, auth } from '../api/styleApi';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { LoadingScreenWithProgress } from './LoadingScreenWithProgress';
import { getLocalizedTip } from '../data/localTips';
import { logEvent, EVENTS } from '../utils/analytics';
import { FashionIcons, IconRenderer } from './Icons';
import StyleBot from './StyleBot';
import { usePlan } from '../context/PlanContext';
import { useCart } from '../context/CartContext';
import ShoppingCart from './ShoppingCart';

// Lazy load heavy components
const UploadSection   = lazy(() => import('./UploadSection'));
const ResultsDisplay  = lazy(() => import('./ResultsDisplay'));
const CoupleResults   = lazy(() => import('./CoupleResults'));
const HistoryPanel    = lazy(() => import('./HistoryPanel'));
const WardrobePanel   = lazy(() => import('./WardrobePanel'));
const ToolsTab        = lazy(() => import('./ToolsTab'));
const StyleNavigator  = lazy(() => import('./StyleNavigator'));
const ProfilePanel    = lazy(() => import('./ProfilePanel'));
const ColorScanner    = lazy(() => import('./ColorScanner'));

// ──────────────────────────────────────────────────────
// Loading Spinner (inline fallback)
// ──────────────────────────────────────────────────────
function SectionLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 32, height: 32,
          border: '2px solid #242424',
          borderTop: '2px solid #C9A96E',
          borderRadius: '50%',
          animation: 'spinSmooth 0.8s linear infinite'
        }} />
        <span style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B' }}>Loading</span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────
// HOME SECTION — Dashboard home in premium theme
// ──────────────────────────────────────────────────────
function HomeSection({ user, lastAnalysis, onAnalyze, onTabChange }) {
  const { t, language } = useLanguage();
  const firstName = user?.name?.split(' ')[0] || 'there';

  const [streak] = useState(() => {
    const today = new Date().toLocaleDateString('en-CA');
    const lastCheckin = localStorage.getItem('sg_last_checkin');
    let count = parseInt(localStorage.getItem('sg_streak_count') || '0');
    if (lastCheckin !== today) {
      if (lastCheckin) {
        const diff = Math.round((new Date(today) - new Date(lastCheckin)) / 86400000);
        count = diff === 1 ? count + 1 : 1;
      } else count = 1;
      localStorage.setItem('sg_streak_count', count.toString());
      localStorage.setItem('sg_last_checkin', today);
    }
    return count;
  });

  const genderPref = localStorage.getItem('sg_gender_pref') || 'male';
  const primaryProfile = JSON.parse(localStorage.getItem('sg_primary_profile') || 'null');
  const activeProfile = primaryProfile || lastAnalysis;
  const tone = (activeProfile?.skinTone || activeProfile?.skin_tone?.category || 'medium').toLowerCase();
  const todayTip = getLocalizedTip(genderPref, tone, language);

  const quickStats = [
    { label: 'Analyses', value: localStorage.getItem('sg_analysis_count') || '0', icon: '📷' },
    { label: 'Day Streak', value: streak > 0 ? `🔥 ${streak}` : '—', icon: '' },
    { label: 'Skin Tone', value: activeProfile?.skinTone || 'Not set', icon: '🎨' },
  ];

  return (
    <div className="fade-up" style={{ paddingBottom: 8 }}>
      {/* Greeting */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: 8 }}>
          Welcome back
        </p>
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: 300, color: '#F0EDE6', lineHeight: 1.2
        }}>
          Good to see you, <em style={{ fontStyle: 'italic', color: '#C9A96E' }}>{firstName}</em>
        </h2>
      </div>

      {/* Primary CTA */}
      <button
        onClick={onAnalyze}
        style={{
          width: '100%', padding: '20px',
          background: '#C9A96E', color: '#0A0A0A',
          border: 'none', cursor: 'pointer',
          fontSize: '12px', fontWeight: 600,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          marginBottom: 24, fontFamily: "'Inter', sans-serif",
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          transition: 'background 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#E8D5A3'}
        onMouseLeave={e => e.currentTarget.style.background = '#C9A96E'}
      >
        <span style={{ fontSize: '18px' }}>📷</span>
        Analyze Your Style
      </button>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, marginBottom: 24, background: '#1C1C1C' }}>
        {quickStats.map((s, i) => (
          <div key={i} style={{ background: '#111111', padding: '20px 16px', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', color: '#F0EDE6', marginBottom: 4 }}>{s.value}</p>
            <p style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Daily Style Tip */}
      {todayTip && (
        <div style={{ padding: '24px', background: '#111111', border: '1px solid #242424', marginBottom: 24 }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C9A96E', marginBottom: 12 }}>
            Today's Style Tip
          </p>
          <p style={{ fontSize: '14px', color: '#F0EDE6', lineHeight: '1.7' }}>{todayTip}</p>
        </div>
      )}

      {/* Recent analysis preview */}
      {lastAnalysis && (
        <div style={{ border: '1px solid #242424', padding: '24px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: 16 }}>
            Last Analysis
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#242424', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '15px', fontFamily: "'Playfair Display', serif", color: '#F0EDE6', marginBottom: 4 }}>
                {lastAnalysis.skinTone || 'Your Skin Tone'}
              </p>
              <p style={{ fontSize: '12px', color: '#6B6B6B' }}>
                {lastAnalysis.timestamp ? new Date(lastAnalysis.timestamp).toLocaleDateString('en-IN') : 'Recent'}
              </p>
            </div>
            <button
              onClick={() => onTabChange('analyze')}
              style={{ marginLeft: 'auto', background: 'none', border: '1px solid #242424', color: '#C9A96E', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '8px 16px', cursor: 'pointer' }}
            >
              View →
            </button>
          </div>
        </div>
      )}

      {/* Feature grid shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, marginTop: 24, background: '#1C1C1C' }}>
        {[
          { id: 'history', label: 'History', desc: 'Past analyses', icon: '📋' },
          { id: 'wardrobe', label: 'Wardrobe', desc: 'Your clothes', icon: '👗' },
          { id: 'navigator', label: 'Navigator', desc: 'Style guide', icon: '🗺️' },
          { id: 'tools', label: 'Tools', desc: 'Style tools', icon: '⚙️' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => onTabChange(f.id)}
            style={{
              background: '#111111', padding: '24px 20px', textAlign: 'left',
              border: 'none', cursor: 'pointer', display: 'flex',
              flexDirection: 'column', gap: 8,
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#181818'}
            onMouseLeave={e => e.currentTarget.style.background = '#111111'}
          >
            <span style={{ fontSize: '22px' }}>{f.icon}</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#F0EDE6', marginBottom: 2 }}>{f.label}</p>
              <p style={{ fontSize: '11px', color: '#6B6B6B' }}>{f.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────
// TOAST
// ──────────────────────────────────────────────────────
function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
      zIndex: 500, background: '#111111', border: '1px solid #242424',
      padding: '10px 20px', fontSize: '12px', color: '#F0EDE6',
      letterSpacing: '0.05em', whiteSpace: 'nowrap', animation: 'fadeUp 0.3s ease'
    }}>
      {message}
    </div>
  );
}

// ──────────────────────────────────────────────────────
// MAIN AppShell
// ──────────────────────────────────────────────────────
export default function AppShell({ user, onLogout }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { t } = useLanguage();
  const isDark = theme === 'dark';
  const { isPro, usage, coins } = usePlan();
  const { cartOpen, setCartOpen } = useCart();

  const [activeTab, setActiveTab]     = useState('home');
  const [results, setResults]         = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImage, setUploadedImage]   = useState(null);
  const [currentGender, setCurrentGender]   = useState(localStorage.getItem('sg_gender_pref') || 'male');
  const [lastAnalysis, setLastAnalysis] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sg_last_analysis') || 'null'); } catch { return null; }
  });
  const [toast, setToast]       = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Nav items
  const navItems = [
    { id: 'home',      label: 'Home',      icon: FashionIcons.User },
    { id: 'analyze',   label: 'Analyze',   icon: FashionIcons.Camera },
    { id: 'history',   label: 'History',   icon: FashionIcons.Analysis },
    { id: 'navigator', label: 'Navigator', icon: FashionIcons.AI },
    { id: 'tools',     label: 'Tools',     icon: FashionIcons.Settings },
  ];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalysisComplete = async (data) => {
    setLoading(false);
    setResults(data);
    setActiveTab('analyze');
    const entry = { ...data, timestamp: Date.now() };
    localStorage.setItem('sg_last_analysis', JSON.stringify(entry));
    setLastAnalysis(entry);
    const count = parseInt(localStorage.getItem('sg_analysis_count') || '0') + 1;
    localStorage.setItem('sg_analysis_count', count.toString());
    setToast('Analysis complete!');
    try {
      if (auth.currentUser) {
        await saveHistory(auth.currentUser.uid, data);
        await saveProfile(auth.currentUser.uid, data);
      }
    } catch (e) { console.warn('Save failed:', e); }
    logEvent(EVENTS.ANALYSIS_COMPLETE);
  };

  const handleReset = () => { setResults(null); setError(null); setUploadedImage(null); };

  const handleLogout = () => {
    logout();
    ['sg_last_analysis','sg_analysis_count','sg_streak_count','sg_last_checkin',
     'sg_daily_drop_date','sg_analysis_history','sg_saved_colors','sg_wardrobe_queue'
    ].forEach(k => localStorage.removeItem(k));
    onLogout();
  };

  const firstName = user?.name?.split(' ')[0] || '';
  const avatarLetter = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <div style={{ background: '#0A0A0A', color: '#F0EDE6', minHeight: '100vh', fontFamily: "'Inter','DM Sans',sans-serif" }}>

      {/* ═══════════════════════════════════════════
          TOP NAVBAR — same premium style as landing
          ═══════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 60, display: 'flex', alignItems: 'center',
        borderBottom: '1px solid #1C1C1C',
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(20px)',
        padding: '0 24px',
        gap: 0
      }}>
        {/* Logo */}
        <button
          onClick={() => handleTabChange('home')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
        >
          <div style={{ width: 28, height: 28, background: '#C9A96E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#0A0A0A', letterSpacing: '0.05em' }}>SG</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#F0EDE6', letterSpacing: '0.08em', textTransform: 'uppercase' }}>StyleGuru AI</span>
        </button>

        {/* Desktop Nav Tabs */}
        <div className="hidden md:flex" style={{ flex: 1, justifyContent: 'center', gap: 32 }}>
          {['Home','Analyze','History','Navigator','Wardrobe','Tools'].map(tab => {
            const id = tab.toLowerCase();
            return (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
                  fontSize: '10px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: activeTab === id ? '#C9A96E' : '#6B6B6B',
                  borderBottom: activeTab === id ? '1px solid #C9A96E' : '1px solid transparent',
                  transition: 'all 0.2s', fontFamily: "'Inter', sans-serif"
                }}
                onMouseEnter={e => { if (activeTab !== id) e.target.style.color = '#F0EDE6'; }}
                onMouseLeave={e => { if (activeTab !== id) e.target.style.color = '#6B6B6B'; }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Right: User avatar + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
          {/* Profile avatar */}
          <button
            onClick={() => handleTabChange('profile')}
            style={{
              width: 32, height: 32, borderRadius: 0,
              background: activeTab === 'profile' ? '#C9A96E' : '#1C1C1C',
              color: activeTab === 'profile' ? '#0A0A0A' : '#F0EDE6',
              border: '1px solid #242424',
              fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            title={`${firstName} — Profile`}
          >
            {avatarLetter}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: '1px solid #1C1C1C', color: '#6B6B6B',
              fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase',
              padding: '7px 14px', cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: "'Inter', sans-serif"
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.color = '#C9A96E'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1C1C1C'; e.currentTarget.style.color = '#6B6B6B'; }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════
          MAIN CONTENT AREA
          ═══════════════════════════════════════════ */}
      <main style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '80px 20px 100px',
      }}>
        <Suspense fallback={<SectionLoader />}>

          {/* HOME */}
          {activeTab === 'home' && (
            <HomeSection
              user={user}
              lastAnalysis={lastAnalysis}
              onAnalyze={() => handleTabChange('analyze')}
              onTabChange={handleTabChange}
            />
          )}

          {/* ANALYZE */}
          {activeTab === 'analyze' && (
            <div className="fade-up">
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C9A96E', marginBottom: 8 }}>
                  AI Skin Analysis
                </p>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(24px, 4vw, 36px)',
                  fontWeight: 300, color: '#F0EDE6'
                }}>
                  {results ? 'Your Results' : 'Upload a Photo'}
                </h2>
              </div>

              {!results && !loading && !error && (
                <UploadSection
                  onLoadingStart={() => setLoading(true)}
                  onAnalysisComplete={handleAnalysisComplete}
                  onError={setError}
                  onImageSelected={setUploadedImage}
                  setUploadProgress={setUploadProgress}
                  currentGender={currentGender}
                  setCurrentGender={setCurrentGender}
                  isPro={isPro}
                  usage={usage}
                  coins={coins}
                  onCoinEmpty={() => {}}
                />
              )}

              {loading && <LoadingScreenWithProgress progress={uploadProgress} />}

              {error && (
                <div style={{ padding: 24, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)', textAlign: 'center' }}>
                  <p style={{ fontSize: '28px', marginBottom: 12 }}>😕</p>
                  <p style={{ color: '#EF4444', fontSize: '14px', marginBottom: 16 }}>{error}</p>
                  <button onClick={handleReset} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.4)', color: '#EF4444', padding: '10px 24px', cursor: 'pointer', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    Try Again
                  </button>
                </div>
              )}

              {results && results.type === 'couple'
                ? <CoupleResults data={results} uploadedImages={uploadedImage} onReset={handleReset} />
                : results
                  ? <ResultsDisplay data={results} uploadedImage={uploadedImage} onReset={handleReset} />
                  : null
              }
            </div>
          )}

          {/* HISTORY */}
          {activeTab === 'history' && (
            <div className="fade-up">
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C9A96E', marginBottom: 8 }}>Your Archive</p>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 300, color: '#F0EDE6' }}>Analysis History</h2>
              </div>
              <HistoryPanel onShowResult={(data) => { setResults(data); handleTabChange('analyze'); }} />
            </div>
          )}

          {/* WARDROBE */}
          {activeTab === 'wardrobe' && (
            <div className="fade-up">
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C9A96E', marginBottom: 8 }}>Style Vault</p>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 300, color: '#F0EDE6' }}>Your Wardrobe</h2>
              </div>
              <WardrobePanel
                onShowResult={(data) => { setResults(data); handleTabChange('analyze'); }}
                gender={currentGender}
              />
            </div>
          )}

          {/* NAVIGATOR */}
          {activeTab === 'navigator' && (
            <div className="fade-up">
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C9A96E', marginBottom: 8 }}>Style Intelligence</p>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 300, color: '#F0EDE6' }}>Style Navigator</h2>
              </div>
              <StyleNavigator user={user} onAnalyze={() => handleTabChange('analyze')} />
            </div>
          )}

          {/* TOOLS */}
          {activeTab === 'tools' && (
            <div className="fade-up">
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C9A96E', marginBottom: 8 }}>Power Tools</p>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 300, color: '#F0EDE6' }}>Style Tools</h2>
              </div>
              <ToolsTab
                analysisData={results}
                onShowResult={(data) => { setResults(data); handleTabChange('analyze'); }}
                onOpenScanner={() => handleTabChange('scanner')}
              />
            </div>
          )}

          {/* COLOR SCANNER */}
          {activeTab === 'scanner' && (
            <ColorScanner
              savedPalette={(() => {
                try {
                  return lastAnalysis?.fullData?.recommendations?.best_shirt_colors ||
                    lastAnalysis?.fullData?.recommendations?.best_dress_colors || [];
                } catch { return []; }
              })()}
              skinTone={lastAnalysis?.skinTone || ''}
              onClose={() => handleTabChange('home')}
            />
          )}

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="fade-up">
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C9A96E', marginBottom: 8 }}>Your Account</p>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 300, color: '#F0EDE6' }}>Profile</h2>
              </div>
              <ProfilePanel hideHeader onOpenUpgrade={() => {}} />

              {/* Logout card */}
              <div style={{ marginTop: 32, padding: 24, border: '1px solid #242424', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '13px', color: '#F0EDE6', marginBottom: 4 }}>{user?.name}</p>
                  <p style={{ fontSize: '11px', color: '#6B6B6B' }}>{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  style={{ background: 'none', border: '1px solid #242424', color: '#6B6B6B', padding: '10px 20px', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Inter', sans-serif" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#242424'; e.currentTarget.style.color = '#6B6B6B'; }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

        </Suspense>
      </main>

      {/* ═══════════════════════════════════════════
          MOBILE BOTTOM NAV
          ═══════════════════════════════════════════ */}
      <nav
        className="md:hidden"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
          background: 'rgba(10,10,10,0.97)',
          borderTop: '1px solid #1C1C1C',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {[
          { id: 'home',      label: 'Home',    icon: '🏠' },
          { id: 'analyze',   label: 'Analyze', icon: '📷' },
          { id: 'history',   label: 'History', icon: '📋' },
          { id: 'navigator', label: 'Explore', icon: '🗺️' },
          { id: 'tools',     label: 'Tools',   icon: '⚙️' },
        ].map(item => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              style={{
                flex: 1, padding: '10px 4px 8px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{item.icon}</span>
              <span style={{
                fontSize: '8px', letterSpacing: '0.08em', textTransform: 'uppercase',
                color: active ? '#C9A96E' : '#3A3A3A', fontWeight: active ? 600 : 400,
                fontFamily: "'Inter', sans-serif"
              }}>
                {item.label}
              </span>
              {active && <div style={{ width: 16, height: 1.5, background: '#C9A96E', marginTop: 2 }} />}
            </button>
          );
        })}
      </nav>

      {/* Global floating StyleBot */}
      <StyleBot />

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Shopping Cart */}
      <ShoppingCart isOpen={cartOpen} onClose={() => setCartOpen(false)} isDark={isDark} />
    </div>
  );
}
