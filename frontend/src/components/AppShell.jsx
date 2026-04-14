/**
 * AppShell.jsx — StyleGuruAI v5.1
 * ════════════════════════════════════════════════════════
 * Full Dynamic Theme System (Light + Dark)
 * ✅ Theme-aware: every component uses C.{token}
 * ✅ Toggle switch (ON/OFF pill toggle in Profile)
 * ✅ Light mode: white bg, dark text, box shadows
 * ✅ Dark mode: navy bg, light text, glow borders
 * ✅ Instant theme switch — no flicker
 * ✅ Theme saved to localStorage
 * ════════════════════════════════════════════════════════
 */

import { useState, useEffect, useContext, lazy, Suspense, useCallback, useMemo } from 'react';
import { logout, saveHistory, getHistory, auth, destroyUserAccount } from '../api/styleApi';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { LoadingScreenWithProgress } from './LoadingScreenWithProgress';
import { getLocalizedTip } from '../data/localTips';
import { logEvent, EVENTS } from '../utils/analytics';
import StyleBot from './StyleBot';
import { usePlan } from '../context/PlanContext';
import { useCart } from '../context/CartContext';
import ShoppingCart from './ShoppingCart';
import { derivePersonality, deriveStyleScore, deriveLevel, readUserPersonalityData } from '../utils/stylePersonality';
import { DARK, LIGHT, GRAD, VIOLET, INDIGO, PJS, PDI, getThemeColors } from '../utils/themeColors';

// ── Lazy loaded feature sections ──────────────────
const UploadSection = lazy(() => import('./UploadSection'));
const ResultsDisplay = lazy(() => import('./ResultsDisplay'));
const CoupleResults = lazy(() => import('./CoupleResults'));
const HistoryPanel = lazy(() => import('./HistoryPanel'));
const WardrobePanel = lazy(() => import('./WardrobePanel'));
const ToolsTab = lazy(() => import('./ToolsTab'));
const StyleNavigator = lazy(() => import('./StyleNavigator'));
const ProfilePanel = lazy(() => import('./ProfilePanel'));
const ColorScanner = lazy(() => import('./ColorScanner'));
const SubscriptionModal = lazy(() => import('./SubscriptionModal'));


// ── Section Loader ──────────────────────────────────
function SectionLoader({ C }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${C.border}`, borderTopColor: VIOLET, animation: 'spinSmooth 0.8s linear infinite' }} />
      <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.muted, fontFamily: PJS }}>Loading</span>
    </div>
  );
}

// ── Toast ───────────────────────────────────────────
function Toast({ message, type = 'default', onClose, C }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'success' ? C.successBg : type === 'error' ? C.dangerBg : C.glass2;
  const brd = type === 'success' ? C.successBorder : type === 'error' ? C.dangerBorder : C.border;
  return (
    <div style={{ position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)', zIndex: 600, background: bg, backdropFilter: 'blur(20px)', border: `1px solid ${brd}`, borderRadius: 12, padding: '12px 24px', fontSize: '13px', color: C.text, whiteSpace: 'nowrap', animation: 'fadeUp 0.3s ease', boxShadow: C.cardShadow, display: 'flex', alignItems: 'center', gap: 8, fontFamily: PJS }}>
      {type === 'success' && <span style={{ color: '#10B981' }}>✓</span>}
      {type === 'error' && <span style={{ color: C.dangerText }}>✗</span>}
      {message}
    </div>
  );
}

// ── Glass Card ─────────────────────────────────────
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

// ── Section Header ──────────────────────────────────
function SectionHeader({ label, title, subtitle, action, C }) {
  return (
    <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', paddingTop: 8 }}>
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ width: 20, height: 2, background: GRAD, borderRadius: 1 }} />
          <span style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 600, fontFamily: PJS }}>
            {label}
          </span>
        </div>
        <h2 style={{ fontFamily: PDI, fontSize: 'clamp(20px,4vw,30px)', fontWeight: 300, color: C.text, lineHeight: 1.2, margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: '13px', color: C.muted, marginTop: 5, fontFamily: PJS }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Tag Chip ───────────────────────────────────────
function Tag({ text, color = VIOLET, C }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', background: `${color}${C.isDark ? '18' : '12'}`, border: `1px solid ${color}${C.isDark ? '30' : '20'}`, borderRadius: 20, padding: '3px 10px', fontSize: '10px', color: color, fontFamily: PJS, fontWeight: 600 }}>
      {text}
    </span>
  );
}

// ── Theme Toggle Switch ────────────────────────────
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

// ══════════════════════════════════════════════════════
// HOME SECTION
// ══════════════════════════════════════════════════════
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

  const genderPref = localStorage.getItem('sg_gender_pref') || 'male';
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

      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: '12px', color: C.muted, marginBottom: 4, fontFamily: PJS }}>
          {greeting} 👋
        </p>
        <h2 style={{ fontFamily: PDI, fontSize: 'clamp(24px,5vw,38px)', fontWeight: 300, lineHeight: 1.15, margin: 0 }}>
          <span style={{ color: C.text }}>Hi, </span>
          <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {firstName}
          </span>
        </h2>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, background: `${level.color}18`, border: `1px solid ${level.color}30`, borderRadius: 20, padding: '4px 12px' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: level.color }} />
          <span style={{ fontSize: '8px', color: level.color, fontFamily: PJS, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {level.label}
          </span>
        </div>
      </div>

      {/* Style Personality Card */}
      {analysisCount > 0 && (
        <GlassCard C={C} style={{ padding: '20px 22px', marginBottom: 16, position: 'relative', overflow: 'hidden' }} onClick={() => onTabChange('profile')}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, background: `radial-gradient(circle,${archetype.glowColor},transparent)`, borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${archetype.gradFrom},${archetype.gradTo})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 16px ${archetype.glowColor}` }}>
              <span style={{ fontSize: '24px' }}>{archetype.emoji}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: '9px', fontFamily: PJS, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Your Style DNA
              </span>
              <p style={{ fontFamily: PDI, fontSize: '17px', color: C.text, margin: '2px 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {archetype.name}
              </p>
              <p style={{ fontSize: '11px', color: C.muted, margin: 0, fontFamily: PJS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {archetype.headline}
              </p>
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

      {/* Primary CTA */}
      <button
        onClick={onAnalyze}
        className="gradient-btn"
        style={{ width: '100%', padding: '18px 22px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, fontFamily: PJS, boxShadow: C.btnShadow }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(139,92,246,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = C.btnShadow; }}
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

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { value: analysisCount || '0', label: 'Analyses' },
          { value: streak > 0 ? `${streak}🔥` : '—', label: 'Streak' },
          { value: personalityData.skinTone ? personalityData.skinTone.split(' ')[0] : '—', label: 'Skin Tone' },
        ].map((s, i) => (
          <GlassCard key={i} C={C} style={{ padding: '16px 10px', textAlign: 'center' }}>
            <p style={{ fontFamily: PDI, fontSize: s.value?.toString().length > 5 ? '13px' : '22px', color: C.text, margin: '0 0 4px', lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: '8px', letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, fontFamily: PJS, margin: 0 }}>{s.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Style Score Bar */}
      {analysisCount > 0 && (
        <GlassCard C={C} hoverable={false} style={{ padding: '16px 18px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '11px', color: C.muted, fontFamily: PJS, fontWeight: 500 }}>Style Score Progress</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.text, fontFamily: PJS }}>{styleScore}/100</span>
          </div>
          <div style={{ width: '100%', height: 6, background: C.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${styleScore}%`, background: GRAD, borderRadius: 3, transition: 'width 1s ease' }} />
          </div>
          {level.next && (
            <p style={{ fontSize: '10px', color: C.muted, fontFamily: PJS, margin: '8px 0 0' }}>
              {level.nextLabel} level: {level.next - analysisCount} more scan{level.next - analysisCount !== 1 ? 's' : ''} away
            </p>
          )}
        </GlassCard>
      )}

      {/* Last Analysis */}
      {lastAnalysis && (
        <GlassCard C={C} onClick={() => onTabChange('analyze')} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', marginBottom: 16 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: lastAnalysis.skinHex || '#C68642', flexShrink: 0, border: `3px solid ${C.border}`, boxShadow: '0 0 16px rgba(0,0,0,0.3)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 3px', fontFamily: PJS, fontWeight: 700 }}>Last Scan</p>
            <p style={{ fontSize: '14px', fontFamily: PDI, color: C.text, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastAnalysis.skinTone || 'Your Skin Tone'}</p>
            <p style={{ fontSize: '11px', color: C.muted, margin: 0, fontFamily: PJS }}>
              {lastAnalysis.timestamp ? new Date(lastAnalysis.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tap to view'}
            </p>
          </div>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.glass2, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: C.text, fontSize: '14px' }}>→</div>
        </GlassCard>
      )}

      {/* Daily Tip */}
      <GlassCard C={C} hoverable={false} style={{ padding: '18px 20px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: `radial-gradient(circle,rgba(139,92,246,${C.isDark ? '0.12' : '0.06'}),transparent)`, borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 16, height: 2, background: GRAD, borderRadius: 1 }} />
          <span style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700, fontFamily: PJS }}>
            {analysisCount > 0 ? `${archetype.emoji} Style DNA Tip` : "Today's Style Tip"}
          </span>
        </div>
        <p style={{ fontSize: '13px', color: C.text, lineHeight: '1.75', margin: 0, fontFamily: PJS, position: 'relative', zIndex: 1 }}>
          {tipEmoji} {todayTip}
        </p>
      </GlassCard>

      {/* Wardrobe peek */}
      {personalityData.wardrobeCount > 0 && (
        <GlassCard C={C} onClick={() => onTabChange('wardrobe')} style={{ padding: '16px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '20px' }}>👗</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 2px', fontFamily: PJS, fontWeight: 700 }}>Your Wardrobe</p>
            <p style={{ fontSize: '14px', fontFamily: PDI, color: C.text, margin: '0 0 1px' }}>{personalityData.wardrobeCount} saved {personalityData.wardrobeCount === 1 ? 'item' : 'items'}</p>
            <p style={{ fontSize: '11px', color: C.muted, margin: 0, fontFamily: PJS }}>Tap to browse your collection</p>
          </div>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.glass2, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text, fontSize: '14px' }}>→</div>
        </GlassCard>
      )}

      {/* First use prompt */}
      {analysisCount === 0 && (
        <GlassCard C={C} hoverable={false} style={{ padding: '24px 20px', marginBottom: 8, textAlign: 'center' }}>
          <p style={{ fontSize: '32px', marginBottom: 8 }}>🎨</p>
          <p style={{ fontSize: '15px', fontFamily: PDI, color: C.text, margin: '0 0 8px' }}>Discover Your Style DNA</p>
          <p style={{ fontSize: '12px', color: C.muted, margin: '0 0 20px', fontFamily: PJS, lineHeight: '1.7' }}>
            Upload a photo to unlock your personalized color palette, skin tone analysis, and AI style archetype.
          </p>
          <button
            onClick={onAnalyze}
            style={{ background: GRAD, border: 'none', color: 'white', borderRadius: 10, padding: '12px 28px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: PJS, boxShadow: C.btnShadow }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Start My First Scan →
          </button>
        </GlassCard>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// PROFILE SECTION
// ══════════════════════════════════════════════════════
function ProfileSection({ user, onLogout, onTabChange, onToast, C, theme, toggleTheme, isPro, usage }) {
  const { language, changeLanguage } = useLanguage();
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('sg_display_name') || user?.name || '');
  const [copied, setCopied] = useState(false);
  const [notifOn, setNotifOn] = useState(() => localStorage.getItem('sg_notif_on') === 'true');
  const [destroying, setDestroying] = useState(false);

  // Language pill options
  const LANGUAGES = [
    { code: 'en', label: 'EN', full: 'English' },
    { code: 'hinglish', label: 'HI', full: 'Hinglish' },
    { code: 'hi', label: 'हि', full: 'Hindi' },
  ];

  const handleLangChange = (code) => {
    changeLanguage(code);
    const full = LANGUAGES.find(l => l.code === code)?.full || code;
    onToast({ message: `Language: ${full}`, type: 'success' });
  };

  const handleNotifToggle = async () => {
    if (notifOn) {
      localStorage.setItem('sg_notif_on', 'false');
      setNotifOn(false);
      onToast({ message: 'Notifications disabled', type: 'default' });
      return;
    }
    if (!('Notification' in window)) {
      onToast({ message: 'Notifications not supported in this browser', type: 'error' }); return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      localStorage.setItem('sg_notif_on', 'true');
      setNotifOn(true);
      onToast({ message: 'Notifications enabled 🔔', type: 'success' });
      new Notification('StyleGuruAI', { body: 'Daily style tips & updates enabled! 🎨', icon: '/favicon.ico' });
    } else if (perm === 'denied') {
      onToast({ message: 'Allow notifications in browser settings', type: 'error' });
    }
  };

  const handleDestroyAccount = async () => {
    // Step 1: First confirm
    const step1 = window.confirm(
      '⚠️ Delete Account?\n\nThis will PERMANENTLY delete:\n• Your profile & Style DNA\n• All analysis history\n• Saved outfits & wardrobe\n• Your Firebase account\n\nThis action CANNOT be undone.'
    );
    if (!step1) return;
    // Step 2: Type confirmation
    const typed = window.prompt('Type DELETE to confirm account deletion:');
    if (typed?.trim().toUpperCase() !== 'DELETE') {
      onToast({ message: 'Account deletion cancelled', type: 'default' }); return;
    }
    setDestroying(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not logged in');
      await destroyUserAccount(uid);
      onToast({ message: '🔒 Account deleted. Goodbye!', type: 'success' });
      // Clear all local data
      localStorage.clear();
      // Logout
      setTimeout(() => onLogout(), 1200);
    } catch (err) {
      console.error('[Delete Account]', err);
      if (err.code === 'auth/requires-recent-login') {
        onToast({ message: 'Please logout and login again before deleting.', type: 'error' });
      } else {
        onToast({ message: 'Deletion failed. Please try again.', type: 'error' });
      }
      setDestroying(false);
    }
  };

  const personalityData = useMemo(() => readUserPersonalityData(), []);
  const personality = useMemo(() => derivePersonality(personalityData), [personalityData]);
  const styleScore = useMemo(() => deriveStyleScore(personalityData), [personalityData]);
  const level = useMemo(() => deriveLevel(personalityData.analysisCount), [personalityData.analysisCount]);
  const archetype = personality.primary;
  const secondary = personality.secondary;

  const avatarLetter = (displayName?.[0] || user?.email?.[0] || 'U').toUpperCase();
  const analysisCount = personalityData.analysisCount;
  const streak = parseInt(localStorage.getItem('sg_streak_count') || '0');
  const wardrobeCount = personalityData.wardrobeCount;
  const savedColorsCount = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('sg_saved_colors') || '[]').length;
    } catch { return 0; }
  }, []);


  const handleShareProfile = async () => {
    const text = `My StyleGuruAI Profile 🎨\n\nStyle Archetype: ${archetype.name} ${archetype.emoji}\nStyle Score: ${styleScore}/100\nLevel: ${level.label}\nAnalyses Done: ${analysisCount}\n\nCheck yours at StyleGuruAI.in`;
    if (navigator.share) {
      try { await navigator.share({ title: 'My Style DNA', text }); } catch { }
    } else {
      try { await navigator.clipboard.writeText(text); } catch { }
      setCopied(true); setTimeout(() => setCopied(false), 2000);
      onToast({ message: 'Profile copied to clipboard!', type: 'success' });
    }
  };

  const handleSaveName = () => {
    try { localStorage.setItem('sg_display_name', displayName); } catch { }
    setEditingName(false);
    onToast({ message: 'Name updated', type: 'success' });
  };

  const rowBtn = (danger = false) => ({
    width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
    transition: 'background 0.2s', fontFamily: PJS,
  });

  const actionBtn = (danger = false) => ({
    flex: 1, padding: '12px', borderRadius: 10,
    background: danger ? C.dangerBg : C.glass2,
    border: `1px solid ${danger ? C.dangerBorder : C.border}`,
    color: danger ? C.dangerText : C.text2,
    fontSize: '12px', fontWeight: 500, cursor: 'pointer',
    transition: 'all 0.2s', fontFamily: PJS,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  });

  return (
    <div style={{ animation: 'fadeSlideIn 0.35s ease' }}>
      <SectionHeader C={C} label="Your Account" title="Profile" />

      {/* User Identity Card */}
      <GlassCard C={C} hoverable={false} style={{ padding: '24px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, background: `radial-gradient(circle,${archetype.glowColor},transparent)`, borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: GRAD, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: C.btnShadow }}>
            <span style={{ fontSize: '26px', fontWeight: 700, color: 'white', fontFamily: PJS }}>{avatarLetter}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingName ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  autoFocus
                  style={{ background: C.inputBg, border: `1px solid ${VIOLET}`, borderRadius: 8, padding: '7px 10px', fontSize: '14px', color: C.text, fontFamily: PJS, outline: 'none', flex: 1 }}
                />
                <button onClick={handleSaveName} style={{ background: VIOLET, border: 'none', color: 'white', borderRadius: 6, padding: '7px 14px', fontSize: '12px', cursor: 'pointer', fontFamily: PJS }}>Save</button>
                <button onClick={() => setEditingName(false)} style={{ background: C.glass2, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, padding: '7px 10px', fontSize: '12px', cursor: 'pointer', fontFamily: PJS }}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <p style={{ fontFamily: PDI, fontSize: '18px', color: C.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName || user?.name || 'User'}</p>
                <button onClick={() => setEditingName(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: '13px', padding: '2px 4px', borderRadius: 4 }} title="Edit name">✏️</button>
              </div>
            )}
            <p style={{ fontSize: '12px', color: C.muted, fontFamily: PJS, margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${level.color}18`, border: `1px solid ${level.color}30`, borderRadius: 20, padding: '3px 10px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: level.color }} />
              <span style={{ fontSize: '9px', color: level.color, fontFamily: PJS, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{level.label}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { value: analysisCount, label: 'Scans' },
          { value: styleScore, label: 'Score', gradient: true },
          { value: streak > 0 ? `${streak}🔥` : '0', label: 'Streak' },
          { value: wardrobeCount, label: 'Wardrobe' },
        ].map((s, i) => (
          <GlassCard key={i} C={C} style={{ padding: '14px 8px', textAlign: 'center' }}>
            <p style={{ fontFamily: PDI, fontSize: '22px', margin: '0 0 3px', lineHeight: 1, ...(s.gradient ? { background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: C.text }) }}>
              {s.value}
            </p>
            <p style={{ fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, fontFamily: PJS, margin: 0 }}>{s.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* AI Personality Card */}
      <GlassCard C={C} hoverable={false} style={{ padding: '22px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: `radial-gradient(circle,${archetype.glowColor},transparent)`, borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: `linear-gradient(135deg,${archetype.gradFrom},${archetype.gradTo})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 14px ${archetype.glowColor}` }}>
            <span style={{ fontSize: '22px' }}>{archetype.emoji}</span>
          </div>
          <div>
            <p style={{ fontSize: '9px', fontFamily: PJS, letterSpacing: '0.2em', textTransform: 'uppercase', background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700, margin: '0 0 3px' }}>Style DNA</p>
            <p style={{ fontFamily: PDI, fontSize: '17px', color: C.text, margin: 0 }}>{archetype.name}</p>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: C.muted, lineHeight: '1.8', margin: '0 0 14px', fontFamily: PJS, position: 'relative', zIndex: 1 }}>
          {analysisCount > 0 ? archetype.description : 'Complete your first scan to unlock your personalized Style DNA and evolving personality profile.'}
        </p>

        {analysisCount > 0 && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, position: 'relative', zIndex: 1 }}>
              {archetype.tags.map(tag => <Tag key={tag} text={tag} color={VIOLET} C={C} />)}
              <Tag text={`Secondary: ${secondary.name}`} color={INDIGO} C={C} />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: C.muted, fontFamily: PJS, margin: '0 0 8px' }}>Your Color Palette</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {archetype.palette.map((color, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: color, border: `2px solid ${C.border}`, boxShadow: `0 2px 8px ${color}50` }} />
                    <span style={{ fontSize: '7px', color: C.muted, fontFamily: PJS }}>{archetype.paletteNames[i]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 14, padding: '12px 14px', background: C.glass2, border: `1px solid ${C.border}`, borderRadius: 10, position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: '11px', color: C.text2, lineHeight: '1.65', margin: 0, fontFamily: PJS }}>
                💡 <strong>Archetype tip:</strong> {archetype.tip}
              </p>
            </div>
          </>
        )}
      </GlassCard>

      {/* Level Progress */}
      {level.next && (
        <GlassCard C={C} hoverable={false} style={{ padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: '12px', color: C.text2, fontFamily: PJS, fontWeight: 600, margin: '0 0 2px' }}>Progress to {level.nextLabel}</p>
              <p style={{ fontSize: '11px', color: C.muted, fontFamily: PJS, margin: 0 }}>
                {level.next - analysisCount} more scan{level.next - analysisCount !== 1 ? 's' : ''} needed
              </p>
            </div>
            <span style={{ fontSize: '22px' }}>🏆</span>
          </div>
          <div style={{ width: '100%', height: 8, background: C.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min((analysisCount / level.next) * 100, 100)}%`, background: `linear-gradient(90deg,${level.color},${VIOLET})`, borderRadius: 4, transition: 'width 1s ease' }} />
          </div>
          <p style={{ fontSize: '10px', color: C.muted, fontFamily: PJS, margin: '6px 0 0' }}>{analysisCount}/{level.next} scans</p>
        </GlassCard>
      )}

      {/* ── PLAN & USAGE TRACKER (NEW) ── */}
      <GlassCard C={C} hoverable={false} style={{ padding: '20px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
               <p style={{ fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: C.muted, fontFamily: PJS, marginBottom: 4 }}>Your Membership</p>
               <h3 style={{ fontFamily: PDI, fontSize: '20px', color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isPro ? 'Pro Member' : 'Free Plan'}
                  {isPro && <span style={{ fontSize: '14px' }}>✨</span>}
               </h3>
            </div>
            {isPro ? (
               <div style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  ACTIVE
               </div>
            ) : (
               <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('open_subscription_modal'))}
                  style={{ padding: '6px 12px', borderRadius: 8, background: GRAD, border: 'none', color: 'white', fontSize: '10px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}
               >
                  UPGRADE
               </button>
            )}
         </div>

         {/* Stats Container */}
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {!isPro ? (
               <>
                  <div style={{ padding: '12px', background: C.glass2, borderRadius: 12, border: `1px solid ${C.border}` }}>
                     <p style={{ fontSize: '8px', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>AI Analyses Used</p>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: C.text }}>{Math.max(0, 3 - (usage?.adFreeAnalysesLeft || 0))}<span style={{ fontSize: '11px', fontWeight: 400, opacity: 0.5 }}> / 3</span></span>
                        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
                           <div style={{ width: `${(Math.max(0, 3 - (usage?.adFreeAnalysesLeft || 0)) / 3) * 100}%`, height: '100%', background: VIOLET }} />
                        </div>
                     </div>
                  </div>
                  <div style={{ padding: '12px', background: C.glass2, borderRadius: 12, border: `1px solid ${C.border}` }}>
                     <p style={{ fontSize: '8px', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>Outfit Checks Used</p>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: C.text }}>{Math.max(0, 3 - (usage?.adFreeOutfitChecks || 0))}<span style={{ fontSize: '11px', fontWeight: 400, opacity: 0.5 }}> / 3</span></span>
                        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
                           <div style={{ width: `${(Math.max(0, 3 - (usage?.adFreeOutfitChecks || 0)) / 3) * 100}%`, height: '100%', background: INDIGO }} />
                        </div>
                     </div>
                  </div>
                  <div style={{ padding: '12px', background: C.glass2, borderRadius: 12, border: `1px solid ${C.border}` }}>
                     <p style={{ fontSize: '8px', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>History Slots</p>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: C.text }}>{usage?.analysisHistoryCount || 0}<span style={{ fontSize: '11px', fontWeight: 400, opacity: 0.5 }}> / 10</span></span>
                        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
                           <div style={{ width: `${((usage?.analysisHistoryCount || 0) / 10) * 100}%`, height: '100%', background: '#EC4899' }} />
                        </div>
                     </div>
                  </div>
                  <div style={{ padding: '12px', background: C.glass2, borderRadius: 12, border: `1px solid ${C.border}` }}>
                     <p style={{ fontSize: '8px', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>Color Slots</p>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: C.text }}>{savedColorsCount || 0}<span style={{ fontSize: '11px', fontWeight: 400, opacity: 0.5 }}> / 10</span></span>
                        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
                           <div style={{ width: `${((savedColorsCount || 0) / 10) * 100}%`, height: '100%', background: '#10B981' }} />
                        </div>
                     </div>
                  </div>
               </>
            ) : (
               <>
                  <div style={{ padding: '12px', background: C.glass2, borderRadius: 12, border: `1px solid ${C.border}` }}>
                     <p style={{ fontSize: '8px', textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Saved in Wardrobe</p>
                     <p style={{ fontSize: '18px', fontWeight: 700, color: C.text, margin: 0 }}>{wardrobeCount || 0}</p>
                     <p style={{ fontSize: '8px', color: C.muted, marginTop: 4 }}>Unlimited Storage</p>
                  </div>
                  <div style={{ padding: '12px', background: C.glass2, borderRadius: 12, border: `1px solid ${C.border}` }}>
                     <p style={{ fontSize: '8px', textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Saved History</p>
                     <p style={{ fontSize: '18px', fontWeight: 700, color: C.text, margin: 0 }}>{usage?.analysisHistoryCount || 0}</p>
                     <p style={{ fontSize: '8px', color: C.muted, marginTop: 4 }}>Infinite Archives</p>
                  </div>
                  <div style={{ padding: '12px', background: C.glass2, borderRadius: 12, border: `1px solid ${C.border}` }}>
                     <p style={{ fontSize: '8px', textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Favorite Colors</p>
                     <p style={{ fontSize: '18px', fontWeight: 700, color: C.text, margin: 0 }}>{savedColorsCount || 0}</p>
                     <p style={{ fontSize: '8px', color: C.muted, marginTop: 4 }}>No Limits</p>
                  </div>
                  <div style={{ padding: '12px', background: C.glass2, borderRadius: 12, border: `1px solid ${C.border}` }}>
                     <p style={{ fontSize: '8px', textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Outfit Checks</p>
                     <p style={{ fontSize: '18px', fontWeight: 700, color: C.text, margin: 0 }}>∞</p>
                     <p style={{ fontSize: '8px', color: C.muted, marginTop: 4 }}>Premium AI Power</p>
                  </div>
               </>
            )}
         </div>

         {isPro && (
            <button 
               onClick={() => window.dispatchEvent(new CustomEvent('open_subscription_modal'))}
               style={{ width: '100%', marginTop: 14, padding: '10px', borderRadius: 10, background: 'none', border: `1px dashed ${C.border}`, color: C.muted, fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
               onMouseEnter={e => { e.currentTarget.style.borderColor = VIOLET; e.currentTarget.style.color = C.text; }}
               onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
            >
               Change Subscription Period (Monthly/Yearly)
            </button>
         )}
      </GlassCard>

      {/* ── PREFERENCES (with Theme Toggle) ── */}
      <p style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: C.muted, fontFamily: PJS, margin: '16px 0 10px' }}>Preferences</p>
      <GlassCard C={C} hoverable={false} style={{ padding: '0 0 0 0', marginBottom: 16 }}>

        {/* Theme row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>{theme === 'dark' ? '🌙' : '☀️'}</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '13px', color: C.text, margin: '0 0 2px', fontFamily: PJS, fontWeight: 500 }}>App Theme</p>
            <p style={{ fontSize: '11px', color: C.muted, margin: 0, fontFamily: PJS }}>{theme === 'dark' ? 'Dark Mode — navy & glass' : 'Light Mode — clean & bright'}</p>
          </div>
          <ThemeToggle theme={theme} onToggle={() => { toggleTheme(); onToast({ message: `Switched to ${theme === 'dark' ? 'light' : 'dark'} mode`, type: 'success' }); }} C={C} />
        </div>

        <div style={{ height: 1, background: C.divider, margin: '0 18px' }} />

        {[
          {
            icon: '🌐', label: 'Language',
            value: null, // rendered separately as pill toggle
            isLang: true,
            action: () => { },
          },
          {
            icon: '🔔', label: 'Notifications',
            value: notifOn ? 'Enabled ✓ — daily style tips active'
              : (typeof Notification !== 'undefined' && Notification.permission === 'denied'
                ? '🚫 Blocked — allow in browser settings'
                : 'Tap to enable daily style tips'),
            isToggle: true,
            toggleOn: notifOn,
            action: handleNotifToggle,
          },
          {
            icon: '🗑️', label: 'Clear My Data', value: 'Reset all local analysis data', danger: true,
            action: () => {
              if (window.confirm('Clear all your local data? This cannot be undone.')) {
                ['sg_last_analysis', 'sg_analysis_count', 'sg_streak_count', 'sg_last_checkin',
                  'sg_analysis_history', 'sg_saved_colors', 'sg_wardrobe_queue', 'sg_primary_profile',
                  'sg_gender_pref', 'sg_display_name',
                ].forEach(k => localStorage.removeItem(k));
                onToast({ message: 'Local data cleared', type: 'success' });
              }
            },
          },
        ].map((item, i, arr) => (
          <div key={item.label}>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: item.isLang ? '12px 18px' : '14px 18px',
                cursor: item.isLang ? 'default' : 'pointer',
                borderRadius: i === arr.length - 1 ? '0 0 16px 16px' : 0,
                transition: 'background 0.2s',
              }}
              onClick={!item.isLang ? item.action : undefined}
              onMouseEnter={e => { if (!item.isLang) e.currentTarget.style.background = C.glass2; }}
              onMouseLeave={e => { if (!item.isLang) e.currentTarget.style.background = 'none'; }}
            >
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', color: item.danger ? C.warnText : C.text, margin: '0 0 4px', fontFamily: PJS, fontWeight: 500 }}>{item.label}</p>
                {item.isLang ? (
                  /* Language 3-pill toggle — instant, no dropdown */
                  <div style={{ display: 'flex', gap: 6 }}>
                    {LANGUAGES.map(lang => (
                      <button key={lang.code}
                        onClick={() => handleLangChange(lang.code)}
                        style={{
                          padding: '5px 14px', borderRadius: 20,
                          background: language === lang.code ? GRAD : C.glass2,
                          border: `1px solid ${language === lang.code ? 'transparent' : C.border}`,
                          color: language === lang.code ? 'white' : C.muted,
                          fontSize: '12px', fontWeight: language === lang.code ? 700 : 400,
                          cursor: 'pointer', transition: 'all 0.2s', fontFamily: PJS,
                          boxShadow: language === lang.code ? '0 2px 8px rgba(139,92,246,0.35)' : 'none',
                        }}>
                        {lang.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '11px', color: C.muted, margin: 0, fontFamily: PJS }}>{item.value}</p>
                )}
              </div>
              {item.isToggle ? (
                <div style={{
                  width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                  background: item.toggleOn ? GRAD : C.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                  position: 'relative', transition: 'background 0.3s'
                }}>
                  <div style={{
                    position: 'absolute', top: 2, left: item.toggleOn ? 18 : 2, width: 16, height: 16,
                    borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.3)', transition: 'left 0.3s'
                  }} />
                </div>
              ) : !item.isLang ? (
                <span style={{ color: C.muted, fontSize: '14px' }}>›</span>
              ) : null}
            </div>
            {i < arr.length - 1 && <div style={{ height: 1, background: C.divider, margin: '0 18px' }} />}
          </div>
        ))}
      </GlassCard>

      {/* Support & Feedback */}
      <p style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: C.muted, fontFamily: PJS, margin: '4px 0 10px' }}>Support & Feedback</p>
      <GlassCard C={C} hoverable={false} style={{ padding: '4px 0', marginBottom: 16 }}>
        {[
          { icon: '💬', label: 'Contact Support', value: 'StyleGuruAI.in.gmail@gmail.com', action: () => window.open('mailto:StyleGuruAI.in.gmail@gmail.com', '_blank') },
          { icon: '⭐', label: 'Rate the App', value: 'Leave a review & help us grow', action: () => { try { window.open('https://play.google.com/store/apps/details?id=com.StyleGuruAI', '_blank'); } catch { onToast({ message: 'Thanks for your support!', type: 'success' }); } } },
          { icon: '🐛', label: 'Report an Issue', value: 'Found a bug? Tell us about it', action: () => window.open('mailto:StyleGuruAI.in.gmail@gmail.com?subject=Bug Report&body=Describe the issue:', '_blank') },
          { icon: '📋', label: 'Privacy Policy', value: 'How we handle your data', action: () => window.open('/privacy', '_blank') },
        ].map((item, i, arr) => (
          <div key={item.label}>
            <button
              onClick={item.action}
              style={{ ...rowBtn(), borderRadius: i === 0 ? '16px 16px 0 0' : i === arr.length - 1 ? '0 0 16px 16px' : 0 }}
              onMouseEnter={e => e.currentTarget.style.background = C.glass2}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', color: C.text, margin: '0 0 2px', fontFamily: PJS, fontWeight: 500 }}>{item.label}</p>
                <p style={{ fontSize: '11px', color: C.muted, margin: 0, fontFamily: PJS }}>{item.value}</p>
              </div>
              <span style={{ color: C.muted, fontSize: '14px' }}>›</span>
            </button>
            {i < arr.length - 1 && <div style={{ height: 1, background: C.divider, margin: '0 18px' }} />}
          </div>
        ))}
      </GlassCard>

      {/* Share + Export */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <button
          onClick={handleShareProfile}
          style={actionBtn()}
          onMouseEnter={e => { e.currentTarget.style.background = C.glass3; e.currentTarget.style.borderColor = `${VIOLET}40`; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.glass2; e.currentTarget.style.borderColor = C.border; }}
        >
          {copied ? '✓ Copied!' : '🔗 Share Profile'}
        </button>
        <button
          onClick={() => onToast({ message: 'Report export coming soon', type: 'default' })}
          style={actionBtn()}
          onMouseEnter={e => { e.currentTarget.style.background = C.glass3; e.currentTarget.style.borderColor = `${VIOLET}40`; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.glass2; e.currentTarget.style.borderColor = C.border; }}
        >
          📄 Export Report
        </button>
      </div>

      {/* ── Sign Out ── */}
      <button
        onClick={onLogout}
        style={{ ...actionBtn(true), width: '100%', flex: 'unset', marginBottom: 12 }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.14)'}
        onMouseLeave={e => e.currentTarget.style.background = C.dangerBg}
      >
        🚪 Sign Out
      </button>

      {/* ── Delete Account — Danger Zone ── */}
      <div style={{ border: `1px solid ${C.dangerBorder}`, borderRadius: 14, padding: '16px 18px', marginBottom: 32, background: C.dangerBg }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: C.dangerText, fontFamily: PJS, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
          ⚠️ Danger Zone
        </p>
        <p style={{ fontSize: '12px', color: C.muted, fontFamily: PJS, margin: '0 0 14px', lineHeight: '1.65' }}>
          Permanently deletes your account, Style DNA, analysis history, wardrobe, and all Firebase data. Cannot be undone.
        </p>
        <button
          onClick={handleDestroyAccount}
          disabled={destroying}
          style={{
            width: '100%', padding: '12px', borderRadius: 10,
            background: 'transparent',
            border: `1.5px solid ${C.dangerBorder}`,
            color: C.dangerText,
            fontSize: '13px', fontWeight: 600, cursor: destroying ? 'not-allowed' : 'pointer',
            fontFamily: PJS, transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: destroying ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!destroying) e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {destroying
            ? <><span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(239,68,68,0.3)', borderTopColor: C.dangerText, animation: 'spinSmooth 0.8s linear infinite' }} /> Deleting account…</>
            : '🗑️ Delete My Account Permanently'
          }
        </button>
      </div>
    </div>

  );
}

// ══════════════════════════════════════════════════════
// MAIN APP SHELL
// ══════════════════════════════════════════════════════
export default function AppShell({ user, onLogout }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { isPro, usage, coins } = usePlan();
  const { cartOpen, setCartOpen } = useCart();

  // Get theme-aware colors
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
  const [currentGender, setCurrentGender] = useState(localStorage.getItem('sg_gender_pref') || 'male');
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

  // Firestore sync on login
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
  }, [user?.uid]);

  // ── Back-stack navigation via popstate ──────────────────────
  useEffect(() => {
    // Push initial state
    window.history.replaceState({ tab: activeTab }, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onPop = () => {
      setTabHistory(history => {
        if (history.length <= 1) {
          // Nothing to go back to — restore current state so app doesn't exit
          window.history.pushState({ tab: history[0] || 'home' }, '');
          return history;
        }
        const newHistory = history.slice(0, -1);
        const prevTab = newHistory[newHistory.length - 1];
        setActiveTab(prevTab);
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.pushState({ tab: prevTab }, '');
        return newHistory;
      });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setTabHistory(h => {
      // Don't duplicate same tab consecutively
      if (h[h.length - 1] === tab) return h;
      return [...h, tab];
    });
    if (tab !== 'analyze') setError(null);
    window.history.pushState({ tab }, '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    { id: 'history', label: 'History' },
    { id: 'navigator', label: 'Style Compass' },
    { id: 'tools', label: 'Tools' },
  ];

  // Mobile: 5 clean tabs — Profile accessible via top-nav avatar
  const mobileTabs = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'analyze', icon: '📷', label: 'Analyze' },
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
        {/* Logo */}
        <button onClick={() => handleTabChange('home')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(139,92,246,0.4)' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'white', fontFamily: PJS }}>SG</span>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: C.text, fontFamily: PJS }}>
            StyleGuruAI <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
          </span>
        </button>

        {/* Desktop Nav Tabs */}
        <div className="hidden md:flex" style={{ flex: 1, justifyContent: 'center', gap: 2 }}>
          {desktopTabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id} onClick={() => handleTabChange(tab.id)}
                style={{ background: active ? `rgba(139,92,246,${C.isDark ? '0.12' : '0.08'})` : 'transparent', border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: 8, fontSize: '13px', fontWeight: active ? 600 : 400, color: active ? C.text : C.muted, transition: 'all 0.2s', fontFamily: PJS, position: 'relative' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = C.text; e.currentTarget.style.background = C.glass2; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = 'transparent'; } }}
              >
                {tab.label}
                {active && <div style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)', width: 18, height: 2, borderRadius: 1, background: GRAD }} />}
              </button>
            );
          })}
        </div>

        {/* Right — Theme quick toggle + Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          {/* Quick theme toggle button */}
          <button
            onClick={() => { toggleTheme(); setToast({ message: `${theme === 'dark' ? 'Light' : 'Dark'} Mode`, type: 'success' }); }}
            title="Toggle theme"
            style={{ width: 34, height: 34, borderRadius: 8, background: C.glass2, border: `1px solid ${C.border}`, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '15px', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${VIOLET}50`; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {/* Profile avatar with Pro Badge */}
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
        <Suspense fallback={<SectionLoader C={C} />}>

          {activeTab === 'home' && (
            <HomeSection key="home" C={C} user={user} lastAnalysis={lastAnalysis} onAnalyze={() => handleTabChange('analyze')} onTabChange={handleTabChange} />
          )}

          {activeTab === 'analyze' && (
            <div key="analyze" style={{ animation: 'fadeSlideIn 0.3s ease' }}>
              <SectionHeader C={C}
                label="AI Analysis"
                title={results ? 'Your Style Profile' : adSkipped ? 'Analysis Cancelled' : 'Upload a Photo'}
                subtitle={!results && !adSkipped ? 'Get personalized color palette & outfit recommendations' : undefined}
                action={
                  results ? (
                    // ── Result exists → show Refresh ──
                    <button
                      onClick={handleReset}
                      style={{ background: C.glass, backdropFilter: 'blur(12px)', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 10, padding: '10px 18px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: PJS }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = VIOLET; e.currentTarget.style.color = C.text; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
                    >
                      🔄 Refresh
                    </button>
                  ) : adSkipped ? (
                    // ── Ad skipped → show New Analysis ──
                    <button
                      onClick={() => { setAdSkipped(false); handleReset(); }}
                      style={{ background: 'linear-gradient(135deg,#8B5CF6,#6366F1)', border: 'none', color: 'white', borderRadius: 10, padding: '10px 18px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontFamily: PJS, boxShadow: '0 4px 16px rgba(139,92,246,0.35)' }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                    >
                      🆕 New Analysis
                    </button>
                  ) : null
                }
              />

              {/* ── Ad-skipped state — no result, show helper message ── */}
              {adSkipped && !results && !loading && (
                <div style={{ textAlign: 'center', padding: '40px 24px', background: C.glass, backdropFilter: 'blur(16px)', border: `1px solid ${C.border}`, borderRadius: 20, marginBottom: 24 }}>
                  <p style={{ fontSize: '40px', marginBottom: 12 }}>🎬</p>
                  <p style={{ fontFamily: PJS, fontSize: '16px', fontWeight: 700, color: C.text, marginBottom: 8 }}>No result generated</p>
                  <p style={{ fontFamily: PJS, fontSize: '13px', color: C.muted, lineHeight: '1.7', marginBottom: 24 }}>
                    Analysis cancelled. Start a new analysis to continue.
                  </p>
                  <button
                    onClick={() => { setAdSkipped(false); handleReset(); }}
                    style={{ background: 'linear-gradient(135deg,#8B5CF6,#6366F1)', border: 'none', color: 'white', borderRadius: 12, padding: '14px 32px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: PJS, boxShadow: '0 6px 20px rgba(139,92,246,0.4)' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(139,92,246,0.5)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(139,92,246,0.4)'; }}
                  >
                    🆕 New Analysis
                  </button>
                </div>
              )}

              {/* ── Normal upload screen ── */}
              {!results && !loading && !error && !adSkipped && (
                <UploadSection
                  onLoadingStart={() => setLoading(true)}
                  onAnalysisComplete={handleAnalysisComplete}
                  onError={(err) => {
                    // If 'skipped' signal arrives here (edge case), handle gracefully
                    if (err === '__ad_skipped__') {
                      setLoading(false);
                      setAdSkipped(true);
                    } else {
                      setLoading(false);
                      setError(err);
                    }
                  }}
                  onImageSelected={setUploadedImage}
                  setUploadProgress={setUploadProgress}
                  currentGender={currentGender}
                  setCurrentGender={setCurrentGender}
                  isPro={isPro}
                  usage={usage}
                  coins={coins}
                  onAdSkipped={() => { setLoading(false); setAdSkipped(true); }}
                  onCoinEmpty={() => { }}
                />
              )}
              {loading && <LoadingScreenWithProgress progress={uploadProgress} />}
              {error && !loading && (
                <div style={{ padding: 32, textAlign: 'center', background: C.dangerBg, backdropFilter: 'blur(12px)', border: `1px solid ${C.dangerBorder}`, borderRadius: 16 }}>
                  <p style={{ fontSize: '36px', marginBottom: 12 }}>😕</p>
                  <p style={{ color: C.dangerText, fontSize: '14px', marginBottom: 24, lineHeight: '1.6', fontFamily: PJS }}>{error}</p>
                  <button onClick={handleReset} style={{ background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, color: C.dangerText, borderRadius: 10, padding: '12px 28px', cursor: 'pointer', fontSize: '13px', fontFamily: PJS }}>Try Again</button>
                </div>
              )}
              {results && results.type === 'couple'
                ? <CoupleResults data={results} uploadedImages={uploadedImage} onReset={handleReset} />
                : results ? <ResultsDisplay data={results} uploadedImage={uploadedImage} onReset={handleReset} /> : null
              }
            </div>
          )}

          {activeTab === 'history' && (
            <div key="history" style={{ animation: 'fadeSlideIn 0.3s ease' }}>
              <SectionHeader C={C} label="Your Archive" title="Analysis History" subtitle="All your previous skin tone analyses" />
              <HistoryPanel onShowResult={data => { setResults(data); handleTabChange('analyze'); }} />
            </div>
          )}

          {activeTab === 'wardrobe' && (
            <div key="wardrobe" style={{ animation: 'fadeSlideIn 0.3s ease' }}>
              <SectionHeader C={C} label="Style Vault" title="Your Wardrobe" subtitle="Manage and organize your saved outfits" />
              <WardrobePanel onShowResult={data => { setResults(data); handleTabChange('analyze'); }} gender={currentGender} />
            </div>
          )}

          {activeTab === 'navigator' && (
            <div key="navigator" style={{ animation: 'fadeSlideIn 0.3s ease' }}>
              <SectionHeader C={C} label="AI Style Intelligence" title="Style Compass" subtitle="Personalized outfit guidance based on your skin tone & style DNA" />
              <StyleNavigator user={user} onAnalyze={() => handleTabChange('analyze')} />
            </div>
          )}

          {activeTab === 'tools' && (
            <div key="tools" style={{ animation: 'fadeSlideIn 0.3s ease' }}>
              <SectionHeader C={C} label="Power Tools" title="Style Tools" subtitle="Advanced tools to elevate your fashion game" />
              <ToolsTab analysisData={results} onShowResult={data => { setResults(data); handleTabChange('analyze'); }} onOpenScanner={() => handleTabChange('scanner')} />
            </div>
          )}

          {activeTab === 'scanner' && (
            <ColorScanner key="scanner"
              savedPalette={(() => { try { const l = JSON.parse(localStorage.getItem('sg_last_analysis') || 'null'); return l?.fullData?.recommendations?.best_shirt_colors || l?.fullData?.recommendations?.best_dress_colors || []; } catch { return []; } })()}
              skinTone={lastAnalysis?.skinTone || ''}
              onClose={() => handleTabChange('home')}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileSection
              key="profile"
              C={C}
              theme={theme}
              toggleTheme={toggleTheme}
              user={user}
              onLogout={handleLogout}
              onTabChange={handleTabChange}
              onToast={setToast}
              isPro={isPro}
              usage={usage}
            />
          )}

        </Suspense>
      </main>

      {/* ═══════════ MOBILE BOTTOM NAV ═══════════ */}
      <nav
        className="mobile-bottom-nav md:hidden"
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: C.bottomNav, backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', borderTop: `1px solid ${C.border}`, paddingBottom: 'env(safe-area-inset-bottom,4px)' }}
      >
        {mobileTabs.map(item => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id} onClick={() => handleTabChange(item.id)}
              style={{ flex: 1, padding: '10px 2px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}
            >
              {active && <div style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: 2, background: GRAD, borderRadius: 1 }} />}
              <span style={{ fontSize: '19px', lineHeight: 1, opacity: active ? 1 : 0.4, transition: 'opacity 0.2s' }}>{item.icon}</span>
              <span style={{ fontSize: '8px', letterSpacing: '0.05em', textTransform: 'uppercase', color: active ? C.text : C.muted, fontWeight: active ? 600 : 400, fontFamily: PJS, transition: 'color 0.2s' }}>
                {item.label}
              </span>
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
