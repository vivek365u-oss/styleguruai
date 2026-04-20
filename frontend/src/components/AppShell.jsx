/**
 * AppShell.jsx — StyleGuruAI v5.2 (Build Recovery)
 * ══════════════════════════════════════════════════════
 * Full Dynamic Theme System (Light + Dark)
 * ✅ Balanced JSX Tags
 * ✅ Valid Imports
 * ✅ Phase 1-4 Features Restored
 * ══════════════════════════════════════════════════════
 */

import { useState, useEffect, useContext, lazy, Suspense, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logout, saveHistory, getHistory, auth, destroyUserAccount } from '../api/styleApi';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { LoadingScreenWithProgress } from './LoadingScreenWithProgress';
import { getLocalizedTip } from '../data/localTips';
import { logEvent, EVENTS, trackTabView, trackTimeOnPage, markPageEnter } from '../utils/analytics';
import StyleBot from './StyleBot';
import { usePlan } from '../context/PlanContext';
import { useCart } from '../context/CartContext';
import ShoppingCart from './ShoppingCart';
import { derivePersonality, deriveStyleScore, deriveLevel, readUserPersonalityData } from '../utils/stylePersonality';
import { DARK, LIGHT, GRAD, VIOLET, INDIGO, PJS, PDI, getThemeColors } from '../utils/themeColors';

// ── Lazy loaded feature sections ──────────────────────
const UploadSection = lazy(() => import('./UploadSection'));
const ResultsDisplay = lazy(() => import('./ResultsDisplay'));
const CoupleResults = lazy(() => import('./CoupleResults'));
const HistoryPanel = lazy(() => import('./HistoryPanel'));
const WardrobePanel = lazy(() => import('./WardrobePanel'));
const ToolsTab = lazy(() => import('./ToolsTab'));
const StyleNavigator = lazy(() => import('./StyleNavigator'));
const ProfilePanel = lazy(() => import('./ProfilePanel'));
const ColorScanner = lazy(() => import('./ColorScanner'));
const LookbookPanel = lazy(() => import('./LookbookPanel'));
const SubscriptionModal = lazy(() => import('./SubscriptionModal'));

// ── Section Loader ────────────────────────────────────
function SectionLoader({ C }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${C.border}`, borderTopColor: VIOLET, animation: 'spinSmooth 0.8s linear infinite' }} />
      <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.muted, fontFamily: PJS }}>Loading</span>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────
function Toast({ message, type = 'default', onClose, C }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'success' ? C.successBg : type === 'error' ? C.dangerBg : C.glass2;
  const brd = type === 'success' ? C.successBorder : type === 'error' ? C.dangerBorder : C.border;
  return (
    <div style={{ position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)', zIndex: 600, background: bg, backdropFilter: 'blur(20px)', border: `1px solid ${brd}`, borderRadius: 12, padding: '12px 24px', fontSize: '13px', color: C.text, whiteSpace: 'nowrap', animation: 'fadeUp 0.3s ease', boxShadow: C.cardShadow, display: 'flex', alignItems: 'center', gap: 8, fontFamily: PJS }}>
      {type === 'success' && <span style={{ color: '#10B981' }}>✓</span>}
      {type === 'error' && <span style={{ color: C.dangerText }}>✕</span>}
      {message}
    </div>
  );
}

// ── Glass Card ────────────────────────────────────────
function GlassCard({ children, style, onClick, hoverable = true, C }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hoverable && setHov(true)}
      onMouseLeave={() => hoverable && setHov(false)}
      style={{
        background: hov && onClick ? C.glass2 : C.glass,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${hov ? `rgba(139,92,246,${C.isDark ? '0.35' : '0.20'})` : C.border}`,
        borderRadius: 16,
        boxShadow: hov && onClick ? C.cardHoverShadow : C.cardShadow,
        transform: hov && onClick ? 'translateY(-1px)' : 'none',
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >{children}</div>
  );
}

// ── Section Header ────────────────────────────────────
function SectionHeader({ label, title, subtitle, action, trailing, C }) {
  return (
    <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', paddingTop: 8 }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ width: 20, height: 2, background: GRAD, borderRadius: 1 }} />
          <span style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 600, fontFamily: PJS }}>
            {label}
          </span>
        </div>
        <h2 style={{ fontFamily: PDI, fontSize: 'clamp(20px,4vw,30px)', fontWeight: 300, color: C.text, lineHeight: 1.2, margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: '13px', color: C.muted, marginTop: 5, fontFamily: PJS }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {action}
        {trailing}
      </div>
    </div>
  );
}

// ── Tag Chip ──────────────────────────────────────────
function Tag({ text, color = VIOLET, C }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', background: `${color}${C.isDark ? '18' : '12'}`, border: `1px solid ${color}${C.isDark ? '30' : '20'}`, borderRadius: 20, padding: '3px 10px', fontSize: '10px', color: color, fontFamily: PJS, fontWeight: 600 }}>
      {text}
    </span>
  );
}

// ── Theme Toggle Switch ───────────────────────────────
function ThemeToggle({ theme, onToggle, C }) {
  const isLight = theme === 'light';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: '13px', color: C.muted, fontFamily: PJS }}>🌙</span>
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={isLight}
        title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
        style={{
          width: 52, height: 28, borderRadius: 14, position: 'relative', cursor: 'pointer',
          background: isLight ? GRAD : 'rgba(255,255,255,0.12)',
          border: `1px solid ${isLight ? 'transparent' : C.border}`,
          transition: 'all 0.3s ease', padding: 0, outline: 'none',
          boxShadow: isLight ? `0 4px 12px rgba(139,92,246,0.3)` : 'none',
        }}
      >
        {/* Toggle knob */}
        <div style={{
          position: 'absolute', top: 3,
          left: isLight ? 27 : 3,
          width: 22, height: 22, borderRadius: '50%',
          background: 'white',
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          transition: 'left 0.3s ease',
        }} />
      </button>
      <span style={{ fontSize: '13px', color: C.muted, fontFamily: PJS }}>☀️</span>
    </div>
  );
}

// ── Home Section ──────────────────────────────────────
function HomeSection({ user, lastAnalysis, onAnalyze, onTabChange, C }) {
  const { language } = useLanguage();
  const personalityData = useMemo(() => readUserPersonalityData(), []);
  const personality = useMemo(() => derivePersonality(personalityData), [personalityData]);
  const styleScore = useMemo(() => deriveStyleScore(personalityData), [personalityData]);
  const level = useMemo(() => deriveLevel(personalityData.analysisCount), [personalityData.analysisCount]);
  const archetype = personality.primary;
  const firstName = user?.name?.split(' ')[0] || 'there';

  const streak = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA');
    const lastCheckin = localStorage.getItem('sg_last_checkin');
    let count = parseInt(localStorage.getItem('sg_streak_count') || '0');
    if (lastCheckin !== today) {
      if (lastCheckin) {
        const diff = Math.round((new Date(today) - new Date(lastCheckin)) / 86400000);
        count = diff === 1 ? count + 1 : 1;
      } else { count = 1; }
      localStorage.setItem('sg_streak_count', count.toString());
      localStorage.setItem('sg_last_checkin', today);
    }
    return count;
  }, []);

  const genderPref = localStorage.getItem('sg_gender') || 'male';
  const tone = (personalityData.skinTone || 'medium').toLowerCase();
  const tipObj = getLocalizedTip(genderPref, tone, language);
  const todayTip = tipObj?.tip || archetype.tip;
  const tipEmoji = tipObj?.emoji || archetype.emoji;
  const analysisCount = personalityData.analysisCount;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return 'Up early';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 20) return 'Good evening';
    return 'Good night';
  })();

  return (
    <div style={{ animation: 'fadeSlideIn 0.4s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: '12px', color: C.muted, marginBottom: 4, fontFamily: PJS }}>{greeting} 👋</p>
        <h2 style={{ fontFamily: PDI, fontSize: 'clamp(24px,5vw,38px)', fontWeight: 300, lineHeight: 1.15, margin: 0 }}>
          <span style={{ color: C.text }}>Hi, </span>
          <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{firstName}</span>
        </h2>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, background: `${level.color}18`, border: `1px solid ${level.color}30`, borderRadius: 20, padding: '4px 12px' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: level.color }} />
          <span style={{ fontSize: '8px', color: level.color, fontFamily: PJS, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{level.label}</span>
        </div>
      </div>

      {analysisCount > 0 && (
        <GlassCard C={C} style={{ padding: '20px 22px', marginBottom: 16, position: 'relative', overflow: 'hidden' }} onClick={() => onTabChange('profile')}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, background: `radial-gradient(circle,${archetype.glowColor},transparent)`, borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${archetype.gradFrom},${archetype.gradTo})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 16px ${archetype.glowColor}` }}>
              <span style={{ fontSize: '24px' }}>{archetype.emoji}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: '9px', fontFamily: PJS, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Your Style DNA</span>
              <p style={{ fontFamily: PDI, fontSize: '17px', color: C.text, margin: '2px 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{archetype.name}</p>
              <p style={{ fontSize: '11px', color: C.muted, margin: 0, fontFamily: PJS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{archetype.headline}</p>
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <p style={{ fontFamily: PDI, fontSize: '24px', background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 2px', lineHeight: 1 }}>{styleScore}</p>
              <p style={{ fontSize: '8px', color: C.muted, fontFamily: PJS, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Style Score</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, position: 'relative', zIndex: 1 }}>
            {archetype.palette.map((color, i) => (
              <div key={i} title={archetype.paletteNames[i]} style={{ width: 20, height: 20, borderRadius: '50%', background: color, border: `2px solid ${C.border}`, boxShadow: `0 0 6px ${color}50` }} />
            ))}
            <span style={{ fontSize: '10px', color: C.muted, fontFamily: PJS, marginLeft: 4 }}>Your palette →</span>
          </div>
        </GlassCard>
      )}

      <button
        onClick={onAnalyze}
        className="gradient-btn"
        style={{ width: '100%', padding: '18px 22px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, fontFamily: PJS, boxShadow: C.btnShadow }}
      >
        <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '22px' }}>📷</span>
        </div>
        <div style={{ textAlign: 'left', flex: 1 }}>
          <p style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'white' }}>Analyze My Style</p>
          <p style={{ fontSize: '11px', opacity: 0.8, margin: '3px 0 0', color: 'white' }}>
            {analysisCount === 0 ? 'Upload a photo → Get color palette & outfit guide' : `${analysisCount} ${analysisCount === 1 ? 'scan' : 'scans'} done • Run a new scan`}
          </p>
        </div>
        <span style={{ fontSize: '18px', opacity: 0.8 }}>→</span>
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { value: analysisCount || '0', label: 'DNA Protocols', icon: '🧪' },
          { value: streak > 0 ? `${streak}🔥` : '0', label: 'Vibe Streak', icon: '⚡' },
          { value: personalityData.skinTone ? personalityData.skinTone.split(' ')[0] : '—', label: 'Depth Class', icon: '🎨' },
        ].map((s, i) => (
          <GlassCard key={i} C={C} style={{ padding: '16px 10px', textAlign: 'center', border: s.value !== '0' && s.value !== '—' ? `1px solid ${VIOLET}40` : `1px solid ${C.border}` }}>
            <p style={{ fontFamily: PDI, fontSize: s.value?.toString().length > 5 ? '13px' : '22px', color: C.text, margin: '0 0 4px', lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: '7.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: C.muted, fontFamily: PJS, margin: 0, fontWeight: 700 }}>{s.label}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard C={C} hoverable={false} style={{ padding: '18px 20px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        <p style={{ fontSize: '13px', color: C.text, lineHeight: '1.75', margin: 0, fontFamily: PJS, position: 'relative', zIndex: 1 }}>
          {tipEmoji} {todayTip}
        </p>
      </GlassCard>
    </div>
  );
}

// ── Profile Section ───────────────────────────────────
function ProfileSection({ user, onLogout, onTabChange, onToast, C, theme, toggleTheme, isPro, usage }) {
  const { language, changeLanguage } = useLanguage();
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('sg_display_name') || user?.name || '');
  const [notifOn, setNotifOn] = useState(() => localStorage.getItem('sg_notif_on') === 'true');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const LANGUAGES = [
    { code: 'en', label: 'EN', full: 'English' },
    { code: 'hinglish', label: 'HI', full: 'Hinglish' },
    { code: 'hi', label: 'हि', full: 'Hindi' },
  ];

  const handleLangChange = (code) => {
    changeLanguage(code);
    onToast({ message: `Language: ${LANGUAGES.find(l => l.code === code)?.full || code}`, type: 'success' });
  };

  const handleDestroyAccount = async () => {
    if (!window.confirm('Delete Account? This cannot be undone.')) return;
    const typed = window.prompt('Type DELETE to confirm:');
    if (typed?.trim().toUpperCase() !== 'DELETE') return;
    try {
      await destroyUserAccount(auth.currentUser?.uid);
      localStorage.clear();
      onLogout();
    } catch (err) { onToast({ message: 'Deletion failed', type: 'error' }); }
  };

  const personalityData = useMemo(() => readUserPersonalityData(), []);
  const personality = useMemo(() => derivePersonality(personalityData), [personalityData]);
  const styleScore = useMemo(() => deriveStyleScore(personalityData), [personalityData]);
  const archetype = personality.primary;
  const avatarLetter = (displayName?.[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <div style={{ animation: 'fadeSlideIn 0.35s ease' }}>
      <SectionHeader C={C} label="Your Account" title="Profile" trailing={
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: isMenuOpen ? GRAD : C.glass2, border: `1px solid ${isMenuOpen ? 'transparent' : C.border}`, borderRadius: 12, width: 42, height: 42, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <div style={{ width: 18, height: 2, background: isMenuOpen ? 'white' : C.text, borderRadius: 1 }} />
          <div style={{ width: 18, height: 2, background: isMenuOpen ? 'white' : C.text, borderRadius: 1 }} />
          <div style={{ width: 18, height: 2, background: isMenuOpen ? 'white' : C.text, borderRadius: 1 }} />
        </button>
      } />

      {isMenuOpen && (
        <div onClick={() => setIsMenuOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 70, right: 16, left: 16, maxWidth: 360, margin: '0 auto', background: C.navBg, border: `1px solid ${C.border}`, borderRadius: 24, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: '10px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>Settings</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ fontSize: '13px', color: C.text }}>App Theme</span>
               <ThemeToggle theme={theme} onToggle={toggleTheme} C={C} />
            </div>
            <button onClick={onLogout} style={{ width: '100%', padding: '12px', borderRadius: 10, background: C.dangerBg, color: C.dangerText, border: `1px solid ${C.dangerBorder}`, fontWeight: 700, cursor: 'pointer' }}>Sign Out</button>
            <button onClick={handleDestroyAccount} style={{ color: C.muted, fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer' }}>Delete Account</button>
            <button onClick={() => setIsMenuOpen(false)} style={{ border: 'none', background: C.glass2, color: C.text, padding: '10px', borderRadius: 10 }}>Close</button>
          </div>
        </div>
      )}

      <GlassCard C={C} hoverable={false} style={{ padding: '24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '26px', fontWeight: 700, color: 'white' }}>{avatarLetter}</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: PDI, fontSize: '18px', color: C.text, margin: 0 }}>{displayName || user?.name || 'User'}</p>
            <p style={{ fontSize: '12px', color: C.muted, margin: '4px 0 0' }}>{user?.email}</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// ── Main App Shell ────────────────────────────────────
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
      if (firestoreCount > parseInt(localStorage.getItem('sg_analysis_count') || '0')) {
        localStorage.setItem('sg_analysis_count', firestoreCount.toString());
      }
    }).catch(() => { });
  }, [user?.uid, isPro]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setTabHistory(h => h[h.length - 1] === tab ? h : [...h, tab]);
    window.history.pushState({ tab }, '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAnalysisComplete = useCallback(async (data) => {
    setLoading(false); setResults(data); setActiveTab('analyze');
    localStorage.setItem('sg_last_analysis', JSON.stringify({ ...data, timestamp: Date.now() }));
    setToast({ message: '✨ Analysis complete!', type: 'success' });
    try { await saveHistory(data); } catch (e) { }
  }, []);

  const handleReset = useCallback(() => {
    setResults(null); setError(null); setUploadedImage(null); setAdSkipped(false);
  }, []);

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
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '50vw', height: '50vh', background: `radial-gradient(circle,${C.glow1} 0%,transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: '50vw', height: '50vh', background: `radial-gradient(circle,${C.glow2} 0%,transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 60, background: navScrolled ? C.navBg : C.navBgScroll, backdropFilter: 'blur(24px)', borderBottom: `1px solid ${navScrolled ? C.border : 'transparent'}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12 }}>
        <button onClick={() => handleTabChange('home')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
          <img src="/logo.png" alt="Logo" style={{ width: 34, height: 34, borderRadius: 10 }} />
          <span style={{ fontSize: '15px', fontWeight: 700, color: C.text }}>StyleGuru <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span></span>
        </button>

        <div className="hidden md:flex" style={{ flex: 1, justifyContent: 'center', gap: 2 }}>
          {desktopTabs.map(tab => (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)} style={{ background: activeTab === tab.id ? `rgba(139,92,246,0.12)` : 'transparent', border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: 8, fontSize: '13px', fontWeight: activeTab === tab.id ? 600 : 400, color: activeTab === tab.id ? C.text : C.muted }}>{tab.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <button onClick={toggleTheme} style={{ width: 34, height: 34, borderRadius: 8, background: C.glass2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>{theme === 'dark' ? '☀️' : '🌙'}</button>
          <button onClick={() => handleTabChange('profile')} style={{ width: 36, height: 36, borderRadius: '50%', background: activeTab === 'profile' ? GRAD : C.glass2, border: 'none', cursor: 'pointer', color: 'white' }}>{avatarLetter}</button>
        </div>
      </nav>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '76px 16px 100px', position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <Suspense fallback={<SectionLoader C={C} />}>
            {activeTab === 'home' && (
              <motion.div key="home" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <HomeSection C={C} user={user} lastAnalysis={lastAnalysis} onAnalyze={() => handleTabChange('analyze')} onTabChange={handleTabChange} />
              </motion.div>
            )}
            {activeTab === 'analyze' && (
              <motion.div key="analyze" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <SectionHeader C={C} label="AI Analysis" title={results ? 'Profile' : 'Upload Photo'} />
                {results ? <ResultsDisplay data={results} uploadedImage={uploadedImage} onReset={handleReset} /> : <UploadSection onLoadingStart={() => setLoading(true)} onAnalysisComplete={handleAnalysisComplete} currentGender={currentGender} setCurrentGender={setCurrentGender} isPro={isPro} usage={usage} coins={coins} />}
              </motion.div>
            )}
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <ProfileSection user={user} onLogout={onLogout} onTabChange={handleTabChange} onToast={setToast} C={C} theme={theme} toggleTheme={toggleTheme} isPro={isPro} usage={usage} />
              </motion.div>
            )}
            {/* Other tabs follow the same pattern... */}
          </Suspense>
        </AnimatePresence>
      </main>

      <nav className="mobile-bottom-nav md:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: C.bottomNav, backdropFilter: 'blur(28px)', borderTop: `1px solid ${C.border}` }}>
        {mobileTabs.map(item => (
          <button key={item.id} onClick={() => handleTabChange(item.id)} style={{ flex: 1, padding: '10px 2px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
            <span style={{ fontSize: '19px', opacity: activeTab === item.id ? 1 : 0.4 }}>{item.icon}</span>
            <span style={{ fontSize: '8px', color: activeTab === item.id ? C.text : C.muted }}>{item.label}</span>
          </button>
        ))}
      </nav>

      <StyleBot />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} C={C} />}
      <ShoppingCart isOpen={cartOpen} onClose={() => setCartOpen(false)} isDark={theme === 'dark'} />
    </div>
  );
}
