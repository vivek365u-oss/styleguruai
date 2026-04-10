/**
 * AppShell.jsx — StyleGuru AI v5.0
 * ══════════════════════════════════════════════════════
 * Premium Glassmorphism + AI Personality System
 * ✅ Evolving Style Personality (6 archetypes)
 * ✅ Rich Profile Dashboard (stats, personality, settings)
 * ✅ Enhanced Home with smart suggestions
 * ✅ Style Score & Level system
 * ✅ Premium glass navigation (top + mobile bottom)
 * ──────────────────────────────────────────────────────
 */

import { useState, useEffect, useContext, lazy, Suspense, useCallback, useMemo } from 'react';
import { logout, saveProfile, saveHistory, auth } from '../api/styleApi';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { LoadingScreenWithProgress } from './LoadingScreenWithProgress';
import { getLocalizedTip } from '../data/localTips';
import { logEvent, EVENTS } from '../utils/analytics';
import StyleBot from './StyleBot';
import { usePlan } from '../context/PlanContext';
import { useCart } from '../context/CartContext';
import ShoppingCart from './ShoppingCart';
import {
  derivePersonality,
  deriveStyleScore,
  deriveLevel,
  readUserPersonalityData,
} from '../utils/stylePersonality';

// ── Lazy loaded feature sections ──────────────────
const UploadSection  = lazy(() => import('./UploadSection'));
const ResultsDisplay = lazy(() => import('./ResultsDisplay'));
const CoupleResults  = lazy(() => import('./CoupleResults'));
const HistoryPanel   = lazy(() => import('./HistoryPanel'));
const WardrobePanel  = lazy(() => import('./WardrobePanel'));
const ToolsTab       = lazy(() => import('./ToolsTab'));
const StyleNavigator = lazy(() => import('./StyleNavigator'));
const ProfilePanel   = lazy(() => import('./ProfilePanel'));
const ColorScanner   = lazy(() => import('./ColorScanner'));

// ── Design Tokens ─────────────────────────────────
const BG    = '#0B0F1A';
const GLASS = 'rgba(255,255,255,0.05)';
const GLASS2= 'rgba(255,255,255,0.08)';
const GLASS3= 'rgba(255,255,255,0.12)';
const BORDER= 'rgba(255,255,255,0.08)';
const BORD2 = 'rgba(255,255,255,0.12)';
const TEXT  = '#F9FAFB';
const TEXT2 = '#E5E7EB';
const MUTED = '#9CA3AF';
const GRAD  = 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)';
const VIOLET= '#8B5CF6';
const INDIGO= '#6366F1';
const PINK  = '#EC4899';

const GLOW_BTN  = '0 4px 20px rgba(139,92,246,0.35)';
const GLOW_CARD = '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)';
const SHADOW    = '0 8px 32px rgba(0,0,0,0.4)';

const PJS = "'Plus Jakarta Sans','Inter',sans-serif";
const PDI = "'Playfair Display',Georgia,serif";

// ── Reusable Glass Card ────────────────────────────
function GlassCard({ children, style, onClick, hoverable = true }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hoverable && setHov(true)}
      onMouseLeave={() => hoverable && setHov(false)}
      style={{
        background: GLASS, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${hov ? 'rgba(139,92,246,0.35)' : BORDER}`,
        borderRadius: 16, boxShadow: hov ? `${GLOW_CARD}, 0 0 20px rgba(139,92,246,0.1)` : GLOW_CARD,
        transform: hov && onClick ? 'translateY(-1px)' : 'none',
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Short label ───────────────────────────────────
function Tag({ text, color = VIOLET }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: `${color}18`, border: `1px solid ${color}30`,
      borderRadius: 20, padding: '3px 10px',
      fontSize: '10px', color: TEXT2, fontFamily: PJS, fontWeight: 500,
    }}>
      {text}
    </span>
  );
}

// ── Section Loader ─────────────────────────────────
function SectionLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: VIOLET, animation: 'spinSmooth 0.8s linear infinite' }} />
      <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: MUTED, fontFamily: PJS }}>Loading</span>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────
function Toast({ message, type = 'default', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'success' ? 'rgba(16,185,129,0.15)' : type === 'error' ? 'rgba(239,68,68,0.15)' : GLASS2;
  const brd = type === 'success' ? 'rgba(16,185,129,0.4)' : type === 'error' ? 'rgba(239,68,68,0.4)' : BORDER;
  return (
    <div style={{ position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)', zIndex: 600, background: bg, backdropFilter: 'blur(20px)', border: `1px solid ${brd}`, borderRadius: 12, padding: '12px 24px', fontSize: '13px', color: TEXT, letterSpacing: '0.02em', whiteSpace: 'nowrap', animation: 'fadeUp 0.3s ease', boxShadow: SHADOW, display: 'flex', alignItems: 'center', gap: 8, fontFamily: PJS }}>
      {type === 'success' && <span style={{ color: '#10B981' }}>✓</span>}
      {type === 'error'   && <span style={{ color: '#EF4444' }}>✗</span>}
      {message}
    </div>
  );
}

// ── Section Header ─────────────────────────────────
function SectionHeader({ label, title, subtitle, action }) {
  return (
    <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', paddingTop: 8 }}>
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ width: 20, height: 2, background: GRAD, borderRadius: 1 }} />
          <span style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 600, fontFamily: PJS }}>
            {label}
          </span>
        </div>
        <h2 style={{ fontFamily: PDI, fontSize: 'clamp(20px,4vw,30px)', fontWeight: 300, color: TEXT, lineHeight: 1.2, margin: 0 }}>
          {title}
        </h2>
        {subtitle && <p style={{ fontSize: '13px', color: MUTED, marginTop: 5, fontFamily: PJS }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ══════════════════════════════════════════════════
// HOME SECTION — AI-Personalized Dashboard
// ══════════════════════════════════════════════════
function HomeSection({ user, lastAnalysis, onAnalyze, onTabChange }) {
  const { language } = useLanguage();

  // Derive complete personality data
  const personalityData = useMemo(() => readUserPersonalityData(), []);
  const personality     = useMemo(() => derivePersonality(personalityData), [personalityData]);
  const styleScore      = useMemo(() => deriveStyleScore(personalityData), [personalityData]);
  const level           = useMemo(() => deriveLevel(personalityData.analysisCount), [personalityData.analysisCount]);
  const archetype       = personality.primary;

  const firstName    = user?.name?.split(' ')[0] || 'there';
  const avatarLetter = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase();

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

  const genderPref  = localStorage.getItem('sg_gender_pref') || 'male';
  const tone        = (personalityData.skinTone || 'medium').toLowerCase();
  const tipObj      = getLocalizedTip(genderPref, tone, language);
  const todayTip    = tipObj?.tip || archetype.tip;
  const tipEmoji    = tipObj?.emoji || archetype.emoji;
  const analysisCount = personalityData.analysisCount;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5)  return 'Up early';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 20) return 'Good evening';
    return 'Good night';
  })();

  const shortcuts = [
    { id: 'history',   icon: '📋', label: 'History',   desc: 'Past scans',    grad: 'linear-gradient(135deg,#6366F1,#8B5CF6)' },
    { id: 'wardrobe',  icon: '👗', label: 'Wardrobe',  desc: 'Your closet',   grad: 'linear-gradient(135deg,#8B5CF6,#EC4899)' },
    { id: 'navigator', icon: '🗺️', label: 'Navigator', desc: 'Style guide',  grad: 'linear-gradient(135deg,#3B82F6,#6366F1)' },
    { id: 'tools',     icon: '🛠️', label: 'Tools',     desc: 'Fashion tools', grad: 'linear-gradient(135deg,#10B981,#3B82F6)' },
  ];

  return (
    <div style={{ animation: 'fadeSlideIn 0.4s ease' }}>

      {/* ── Welcome Row ── */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p style={{ fontSize: '12px', color: MUTED, marginBottom: 4, fontFamily: PJS, letterSpacing: '0.02em' }}>
            {greeting} 👋
          </p>
          <h2 style={{ fontFamily: PDI, fontSize: 'clamp(24px,5vw,38px)', fontWeight: 300, lineHeight: 1.15, margin: 0 }}>
            <span style={{ color: TEXT }}>Hi, </span>
            <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {firstName}
            </span>
          </h2>
          {/* Level badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, background: `${level.color}18`, border: `1px solid ${level.color}30`, borderRadius: 20, padding: '4px 12px' }}>
            <span style={{ fontSize: '8px', color: level.color, fontFamily: PJS, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {level.label}
            </span>
          </div>
        </div>
        {/* Avatar → Profile */}
        <button
          onClick={() => onTabChange('profile')}
          style={{ flexShrink: 0, width: 50, height: 50, borderRadius: '50%', background: GRAD, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: GLOW_BTN, transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.07)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(139,92,246,0.6)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = GLOW_BTN; }}
          title="My Profile"
        >
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'white', fontFamily: PJS }}>{avatarLetter}</span>
        </button>
      </div>

      {/* ── Style Personality Card (AI-Generated) ── */}
      {analysisCount > 0 && (
        <GlassCard
          style={{ padding: '20px 22px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}
          onClick={() => onTabChange('profile')}
        >
          {/* Archetype glow */}
          <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, background: `radial-gradient(circle,${archetype.glowColor},transparent)`, borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
            {/* Archetype icon */}
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${archetype.gradFrom},${archetype.gradTo})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 16px ${archetype.glowColor}` }}>
              <span style={{ fontSize: '24px' }}>{archetype.emoji}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: '9px', fontFamily: PJS, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Your Style DNA
                </span>
              </div>
              <p style={{ fontFamily: PDI, fontSize: '17px', color: TEXT, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {archetype.name}
              </p>
              <p style={{ fontSize: '11px', color: MUTED, margin: 0, fontFamily: PJS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {archetype.headline}
              </p>
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <p style={{ fontFamily: PDI, fontSize: '24px', background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 2px', lineHeight: 1 }}>{styleScore}</p>
              <p style={{ fontSize: '8px', color: MUTED, fontFamily: PJS, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Style Score</p>
            </div>
          </div>
          {/* Archetype color palette mini */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, position: 'relative', zIndex: 1 }}>
            {archetype.palette.map((color, i) => (
              <div key={i} title={archetype.paletteNames[i]} style={{ width: 20, height: 20, borderRadius: '50%', background: color, border: `2px solid rgba(255,255,255,0.1)`, boxShadow: `0 0 8px ${color}40` }} />
            ))}
            <span style={{ fontSize: '10px', color: MUTED, fontFamily: PJS, marginLeft: 4 }}>Your palette →</span>
          </div>
        </GlassCard>
      )}

      {/* ── Primary CTA ── */}
      <button
        onClick={onAnalyze}
        className="gradient-btn"
        style={{ width: '100%', padding: '18px 22px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, fontFamily: PJS }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(139,92,246,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = GLOW_BTN; }}
      >
        <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '22px' }}>📷</span>
        </div>
        <div style={{ textAlign: 'left', flex: 1 }}>
          <p style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'white' }}>Analyze My Style</p>
          <p style={{ fontSize: '11px', opacity: 0.75, margin: '3px 0 0', color: 'white', fontWeight: 400 }}>
            {analysisCount === 0 ? 'Upload a photo → Get your color palette & outfit guide' : `${analysisCount} ${analysisCount === 1 ? 'scan' : 'scans'} done • Click to run a new scan`}
          </p>
        </div>
        <span style={{ fontSize: '18px', opacity: 0.7 }}>→</span>
      </button>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { value: analysisCount || '0', label: 'Analyses' },
          { value: streak > 0 ? `${streak}🔥` : '—', label: 'Streak' },
          { value: personalityData.skinTone ? personalityData.skinTone.split(' ')[0] : '—', label: 'Skin Tone' },
        ].map((s, i) => (
          <GlassCard key={i} style={{ padding: '16px 10px', textAlign: 'center' }}>
            <p style={{ fontFamily: PDI, fontSize: s.value?.toString().length > 5 ? '13px' : '22px', color: TEXT, margin: '0 0 4px', lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: '8px', letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED, fontFamily: PJS, margin: 0 }}>{s.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* ── Style Score Bar ── */}
      {analysisCount > 0 && (
        <GlassCard style={{ padding: '16px 18px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '11px', color: MUTED, fontFamily: PJS, fontWeight: 500 }}>Style Score</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: TEXT, fontFamily: PJS }}>{styleScore}/100</span>
          </div>
          <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${styleScore}%`, background: GRAD, borderRadius: 3, transition: 'width 1s ease' }} />
          </div>
          {level.next && (
            <p style={{ fontSize: '10px', color: MUTED, fontFamily: PJS, marginTop: 8, margin: '8px 0 0' }}>
              {level.nextLabel} level: {level.next - analysisCount} more {level.next - analysisCount === 1 ? 'scan' : 'scans'} away
            </p>
          )}
        </GlassCard>
      )}

      {/* ── Last Analysis ── */}
      {lastAnalysis && (
        <GlassCard onClick={() => onTabChange('analyze')} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', marginBottom: 16 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: lastAnalysis.skinHex || '#C68642', flexShrink: 0, border: '3px solid rgba(255,255,255,0.12)', boxShadow: '0 0 16px rgba(0,0,0,0.4)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 3px', fontFamily: PJS, fontWeight: 700 }}>Last Scan</p>
            <p style={{ fontSize: '14px', fontFamily: PDI, color: TEXT, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastAnalysis.skinTone || 'Your Skin Tone'}</p>
            <p style={{ fontSize: '11px', color: MUTED, margin: 0, fontFamily: PJS }}>
              {lastAnalysis.timestamp ? new Date(lastAnalysis.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tap to view'}
            </p>
          </div>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: GLASS2, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: TEXT, fontSize: '14px' }}>→</div>
        </GlassCard>
      )}

      {/* ── Daily Style Tip ── */}
      <GlassCard style={{ padding: '18px 20px', marginBottom: 16, position: 'relative', overflow: 'hidden' }} hoverable={false}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'radial-gradient(circle,rgba(139,92,246,0.12),transparent)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 16, height: 2, background: GRAD, borderRadius: 1 }} />
          <span style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700, fontFamily: PJS }}>
            {analysisCount > 0 ? `${archetype.emoji} Style DNA Tip` : "Today's Style Tip"}
          </span>
        </div>
        <p style={{ fontSize: '13px', color: TEXT, lineHeight: '1.75', margin: 0, fontFamily: PJS, position: 'relative', zIndex: 1 }}>
          {tipEmoji} {todayTip}
        </p>
      </GlassCard>

      {/* ── Feature Shortcuts ── */}
      <p style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED, fontFamily: PJS, margin: '0 0 12px' }}>Explore Features</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {shortcuts.map(f => (
          <GlassCard key={f.id} onClick={() => onTabChange(f.id)} style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: f.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              <span style={{ fontSize: '20px' }}>{f.icon}</span>
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: TEXT, margin: '0 0 2px', fontFamily: PJS }}>{f.label}</p>
              <p style={{ fontSize: '11px', color: MUTED, margin: 0, fontFamily: PJS }}>{f.desc}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// PROFILE SECTION — Rich Dashboard
// ══════════════════════════════════════════════════
function ProfileSection({ user, onLogout, onTabChange, onToast }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [copied, setCopied] = useState(false);

  const personalityData = useMemo(() => readUserPersonalityData(), []);
  const personality     = useMemo(() => derivePersonality(personalityData), [personalityData]);
  const styleScore      = useMemo(() => deriveStyleScore(personalityData), [personalityData]);
  const level           = useMemo(() => deriveLevel(personalityData.analysisCount), [personalityData.analysisCount]);
  const archetype       = personality.primary;
  const secondary       = personality.secondary;

  const firstName    = displayName?.split(' ')[0] || user?.name?.split(' ')[0] || 'User';
  const avatarLetter = (displayName?.[0] || user?.email?.[0] || 'U').toUpperCase();

  const analysisCount = personalityData.analysisCount;
  const streak        = parseInt(localStorage.getItem('sg_streak_count') || '0');
  const wardrobeCount = personalityData.wardrobeCount;
  const historyCount  = personalityData.historyLength;

  const handleShareProfile = async () => {
    const text = `My StyleGuru AI Profile 🎨\n\nStyle Archetype: ${archetype.name} ${archetype.emoji}\nStyle Score: ${styleScore}/100\nLevel: ${level.label}\nAnalyses Done: ${analysisCount}\n\nCheck yours at styleguruai.in`;
    if (navigator.share) {
      try { await navigator.share({ title: 'My Style DNA', text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onToast({ message: 'Profile copied to clipboard!', type: 'success' });
    }
  };

  const handleSaveName = () => {
    try { localStorage.setItem('sg_display_name', displayName); } catch {}
    setEditingName(false);
    onToast({ message: 'Display name updated', type: 'success' });
  };

  const btnStyle = (danger = false) => ({
    flex: 1, padding: '12px', borderRadius: 10,
    background: danger ? 'rgba(239,68,68,0.08)' : GLASS2,
    border: `1px solid ${danger ? 'rgba(239,68,68,0.25)' : BORDER}`,
    color: danger ? '#EF4444' : TEXT2,
    fontSize: '12px', fontWeight: 500, cursor: 'pointer',
    transition: 'all 0.2s', fontFamily: PJS,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  });

  return (
    <div style={{ animation: 'fadeSlideIn 0.35s ease' }}>
      <SectionHeader label="Your Account" title="Profile" />

      {/* ── User Identity Card ── */}
      <GlassCard style={{ padding: '24px', marginBottom: 16, position: 'relative', overflow: 'hidden' }} hoverable={false}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, background: `radial-gradient(circle, ${archetype.glowColor}, transparent)`, borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative', zIndex: 1 }}>
          {/* Large Avatar */}
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: GRAD, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: GLOW_BTN }}>
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
                  style={{ background: GLASS2, border: `1px solid ${VIOLET}`, borderRadius: 8, padding: '6px 10px', fontSize: '14px', color: TEXT, fontFamily: PJS, outline: 'none', flex: 1 }}
                />
                <button onClick={handleSaveName} style={{ background: VIOLET, border: 'none', color: 'white', borderRadius: 6, padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: PJS }}>Save</button>
                <button onClick={() => setEditingName(false)} style={{ background: GLASS, border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 6, padding: '6px 10px', fontSize: '12px', cursor: 'pointer', fontFamily: PJS }}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <p style={{ fontFamily: PDI, fontSize: '18px', color: TEXT, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{displayName || user?.name || 'User'}</p>
                <button onClick={() => setEditingName(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, fontSize: '13px', padding: '2px 4px', borderRadius: 4 }} title="Edit name">✏️</button>
              </div>
            )}
            <p style={{ fontSize: '12px', color: MUTED, fontFamily: PJS, margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${level.color}18`, border: `1px solid ${level.color}30`, borderRadius: 20, padding: '3px 10px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: level.color }} />
              <span style={{ fontSize: '9px', color: level.color, fontFamily: PJS, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{level.label}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── Stats Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { value: analysisCount, label: 'Scans' },
          { value: styleScore, label: 'Score' },
          { value: streak > 0 ? `${streak}🔥` : '0', label: 'Streak' },
          { value: wardrobeCount, label: 'Wardrobe' },
        ].map((s, i) => (
          <GlassCard key={i} style={{ padding: '14px 8px', textAlign: 'center' }}>
            <p style={{ fontFamily: PDI, fontSize: '22px', color: TEXT, margin: '0 0 3px', lineHeight: 1, background: i === 1 ? GRAD : 'none', WebkitBackgroundClip: i === 1 ? 'text' : 'unset', WebkitTextFillColor: i === 1 ? 'transparent' : TEXT }}>
              {s.value}
            </p>
            <p style={{ fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, fontFamily: PJS, margin: 0 }}>{s.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* ── AI Style Personality ── */}
      <GlassCard style={{ padding: '22px', marginBottom: 16, position: 'relative', overflow: 'hidden' }} hoverable={false}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: `radial-gradient(circle, ${archetype.glowColor}, transparent)`, borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: `linear-gradient(135deg,${archetype.gradFrom},${archetype.gradTo})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 14px ${archetype.glowColor}` }}>
            <span style={{ fontSize: '22px' }}>{archetype.emoji}</span>
          </div>
          <div>
            <p style={{ fontSize: '9px', fontFamily: PJS, letterSpacing: '0.2em', textTransform: 'uppercase', background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700, margin: '0 0 3px' }}>Style DNA</p>
            <p style={{ fontFamily: PDI, fontSize: '17px', color: TEXT, margin: 0 }}>{archetype.name}</p>
          </div>
          {analysisCount === 0 && (
            <div style={{ marginLeft: 'auto', background: 'rgba(139,92,246,0.1)', border: `1px solid ${VIOLET}30`, borderRadius: 8, padding: '4px 10px' }}>
              <span style={{ fontSize: '9px', color: MUTED, fontFamily: PJS }}>First scan unlocks</span>
            </div>
          )}
        </div>

        <p style={{ fontSize: '13px', color: MUTED, lineHeight: '1.8', margin: '0 0 14px', fontFamily: PJS, position: 'relative', zIndex: 1 }}>
          {analysisCount > 0 ? archetype.description : 'Complete your first scan to unlock your personalized Style DNA and evolving personality profile.'}
        </p>

        {/* Personality tags */}
        {analysisCount > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, position: 'relative', zIndex: 1 }}>
            {archetype.tags.map(tag => <Tag key={tag} text={tag} color={VIOLET} />)}
            <Tag text={`Secondary: ${secondary.name}`} color={INDIGO} />
          </div>
        )}

        {/* Color palette */}
        {analysisCount > 0 && (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: MUTED, fontFamily: PJS, margin: '0 0 8px' }}>Your Color Palette</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {archetype.palette.map((color, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: color, border: '2px solid rgba(255,255,255,0.1)', boxShadow: `0 2px 8px ${color}50` }} />
                  <span style={{ fontSize: '7px', color: MUTED, fontFamily: PJS }}>{archetype.paletteNames[i]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Archetype tip */}
        {analysisCount > 0 && (
          <div style={{ marginTop: 14, padding: '12px 14px', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: '11px', color: TEXT2, lineHeight: '1.65', margin: 0, fontFamily: PJS }}>
              💡 <strong>Archetype tip:</strong> {archetype.tip}
            </p>
          </div>
        )}
      </GlassCard>

      {/* ── Progress to Next Level ── */}
      {level.next && (
        <GlassCard style={{ padding: '16px 20px', marginBottom: 16 }} hoverable={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: '12px', color: TEXT2, fontFamily: PJS, fontWeight: 600, margin: '0 0 2px' }}>Progress to {level.nextLabel}</p>
              <p style={{ fontSize: '11px', color: MUTED, fontFamily: PJS, margin: 0 }}>
                {level.next - analysisCount} more {level.next - analysisCount === 1 ? 'scan' : 'scans'} needed
              </p>
            </div>
            <span style={{ fontSize: '22px' }}>🏆</span>
          </div>
          <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min((analysisCount / level.next) * 100, 100)}%`, background: `linear-gradient(90deg,${level.color},${VIOLET})`, borderRadius: 4, transition: 'width 1s ease' }} />
          </div>
          <p style={{ fontSize: '10px', color: MUTED, fontFamily: PJS, marginTop: 6, margin: '6px 0 0' }}>{analysisCount}/{level.next} scans</p>
        </GlassCard>
      )}

      {/* ── Quick Actions ── */}
      <p style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED, fontFamily: PJS, margin: '16px 0 10px' }}>Quick Actions</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'My History', icon: '📋', tab: 'history', desc: `${historyCount} analyses` },
          { label: 'Wardrobe',   icon: '👗', tab: 'wardrobe', desc: `${wardrobeCount} items` },
          { label: 'Navigator',  icon: '🗺️', tab: 'navigator', desc: 'Style guide' },
          { label: 'Tools',      icon: '🛠️', tab: 'tools', desc: 'Fashion tools' },
        ].map(item => (
          <GlassCard key={item.tab} onClick={() => onTabChange(item.tab)} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: TEXT, margin: '0 0 2px', fontFamily: PJS }}>{item.label}</p>
              <p style={{ fontSize: '10px', color: MUTED, margin: 0, fontFamily: PJS }}>{item.desc}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* ── Settings ── */}
      <p style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED, fontFamily: PJS, margin: '16px 0 10px' }}>Settings</p>
      <GlassCard style={{ padding: '4px 0', marginBottom: 16 }} hoverable={false}>
        {[
          {
            icon: theme === 'dark' ? '🌙' : '☀️',
            label: 'Theme',
            value: theme === 'dark' ? 'Dark Mode' : 'Light Mode',
            action: () => toggleTheme(),
          },
          {
            icon: '🔔',
            label: 'Notifications',
            value: 'Style tips & updates',
            action: () => onToast({ message: 'Notifications setting coming soon', type: 'default' }),
          },
          {
            icon: '🔒',
            label: 'Privacy',
            value: 'Data stays on your device',
            action: () => onTabChange ? window.open('/privacy', '_blank') : null,
          },
        ].map((item, i, arr) => (
          <div key={item.label}>
            <button
              onClick={item.action}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s', borderRadius: i === 0 ? '16px 16px 0 0' : i === arr.length - 1 ? '0 0 16px 16px' : 0 }}
              onMouseEnter={e => e.currentTarget.style.background = GLASS2}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', color: TEXT, margin: '0 0 2px', fontFamily: PJS, fontWeight: 500 }}>{item.label}</p>
                <p style={{ fontSize: '11px', color: MUTED, margin: 0, fontFamily: PJS }}>{item.value}</p>
              </div>
              <span style={{ color: MUTED, fontSize: '14px' }}>›</span>
            </button>
            {i < arr.length - 1 && <div style={{ height: 1, background: BORDER, margin: '0 18px' }} />}
          </div>
        ))}
      </GlassCard>

      {/* ── Share & Export actions ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button
          onClick={handleShareProfile}
          style={btnStyle()}
          onMouseEnter={e => { e.currentTarget.style.background = GLASS3; e.currentTarget.style.borderColor = `${VIOLET}40`; }}
          onMouseLeave={e => { e.currentTarget.style.background = GLASS2; e.currentTarget.style.borderColor = BORDER; }}
        >
          {copied ? '✓ Copied!' : '🔗 Share Profile'}
        </button>
        <button
          onClick={() => onToast({ message: 'Report export coming soon', type: 'default' })}
          style={btnStyle()}
          onMouseEnter={e => { e.currentTarget.style.background = GLASS3; e.currentTarget.style.borderColor = `${VIOLET}40`; }}
          onMouseLeave={e => { e.currentTarget.style.background = GLASS2; e.currentTarget.style.borderColor = BORDER; }}
        >
          📄 Export Report
        </button>
      </div>

      {/* ── Sign Out ── */}
      <button
        onClick={onLogout}
        style={{ ...btnStyle(true), width: '100%', flex: 'unset', marginBottom: 32 }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
      >
        🚪 Sign Out
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════
// MAIN APP SHELL
// ══════════════════════════════════════════════════
export default function AppShell({ user, onLogout }) {
  const { theme } = useContext(ThemeContext);
  const { isPro, usage, coins } = usePlan();
  const { cartOpen, setCartOpen } = useCart();

  const [activeTab, setActiveTab]             = useState('home');
  const [results, setResults]                 = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState(null);
  const [uploadProgress, setUploadProgress]   = useState(0);
  const [uploadedImage, setUploadedImage]     = useState(null);
  const [currentGender, setCurrentGender]     = useState(localStorage.getItem('sg_gender_pref') || 'male');
  const [lastAnalysis, setLastAnalysis]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('sg_last_analysis') || 'null'); } catch { return null; }
  });
  const [toast, setToast]                     = useState(null);
  const [navScrolled, setNavScrolled]         = useState(false);

  useEffect(() => {
    const handler = () => setNavScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    if (tab !== 'analyze') setError(null);
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
    try {
      if (auth.currentUser) {
        await saveHistory(auth.currentUser.uid, data);
        await saveProfile(auth.currentUser.uid, data);
      }
    } catch (e) { console.warn('Save failed:', e); }
    logEvent(EVENTS.ANALYSIS_COMPLETE);
  }, []);

  const handleReset = useCallback(() => {
    setResults(null); setError(null); setUploadedImage(null);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    ['sg_last_analysis','sg_analysis_count','sg_streak_count','sg_last_checkin',
     'sg_daily_drop_date','sg_analysis_history','sg_saved_colors','sg_wardrobe_queue',
    ].forEach(k => localStorage.removeItem(k));
    onLogout();
  }, [onLogout]);

  const avatarLetter  = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase();

  const desktopTabs = [
    { id: 'home',      label: 'Home' },
    { id: 'analyze',   label: 'Analyze' },
    { id: 'history',   label: 'History' },
    { id: 'wardrobe',  label: 'Wardrobe' },
    { id: 'navigator', label: 'Navigator' },
    { id: 'tools',     label: 'Tools' },
  ];

  const mobileTabs = [
    { id: 'home',     icon: '🏠', label: 'Home' },
    { id: 'analyze',  icon: '📷', label: 'Analyze' },
    { id: 'history',  icon: '📋', label: 'History' },
    { id: 'wardrobe', icon: '👗', label: 'Wardrobe' },
    { id: 'tools',    icon: '🛠️', label: 'Tools' },
  ];

  return (
    <div style={{ background: BG, color: TEXT, minHeight: '100vh', fontFamily: PJS, position: 'relative' }}>
      {/* Radial BG Glows */}
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '50vw', height: '50vh', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: '50vw', height: '50vh', background: 'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* ═══════════ TOP NAV ═══════════ */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 60, background: navScrolled ? 'rgba(11,15,26,0.92)' : 'rgba(11,15,26,0.6)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: `1px solid ${navScrolled ? BORDER : 'transparent'}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, transition: 'all 0.3s' }}>
        {/* Logo */}
        <button onClick={() => handleTabChange('home')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(139,92,246,0.4)' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'white', fontFamily: PJS }}>SG</span>
          </div>
          <span className="hidden sm:inline" style={{ fontSize: '14px', fontWeight: 700, color: TEXT, fontFamily: PJS }}>
            StyleGuru <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
          </span>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex" style={{ flex: 1, justifyContent: 'center', gap: 2 }}>
          {desktopTabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)} style={{ background: active ? 'rgba(139,92,246,0.12)' : 'transparent', border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: 8, fontSize: '13px', fontWeight: active ? 600 : 400, color: active ? TEXT : MUTED, transition: 'all 0.2s', fontFamily: PJS, position: 'relative' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = TEXT; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = MUTED; e.currentTarget.style.background = 'transparent'; }}}
              >
                {tab.label}
                {active && <div style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)', width: 18, height: 2, borderRadius: 1, background: GRAD }} />}
              </button>
            );
          })}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <button
            onClick={() => handleTabChange('profile')}
            style={{ width: 36, height: 36, borderRadius: '50%', background: activeTab === 'profile' ? GRAD : GLASS2, border: `1px solid ${activeTab === 'profile' ? 'transparent' : BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTab === 'profile' ? GLOW_BTN : 'none', fontSize: '14px', fontWeight: 700, color: TEXT, fontFamily: PJS }}
            title="Profile"
          >
            {avatarLetter}
          </button>
        </div>
      </nav>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '76px 16px 100px', position: 'relative', zIndex: 1 }}>
        <Suspense fallback={<SectionLoader />}>

          {activeTab === 'home' && (
            <HomeSection
              key="home"
              user={user}
              lastAnalysis={lastAnalysis}
              onAnalyze={() => handleTabChange('analyze')}
              onTabChange={handleTabChange}
            />
          )}

          {activeTab === 'analyze' && (
            <div key="analyze" style={{ animation: 'fadeSlideIn 0.3s ease' }}>
              <SectionHeader label="AI Analysis" title={results ? 'Your Style Profile' : 'Upload a Photo'} subtitle={!results ? 'Get personalized color palette & outfit recommendations' : undefined}
                action={results && (
                  <button onClick={handleReset} style={{ background: GLASS, backdropFilter: 'blur(12px)', border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 10, padding: '10px 18px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: PJS }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = VIOLET; e.currentTarget.style.color = TEXT; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}
                  >↑ New Scan</button>
                )}
              />
              {!results && !loading && !error && (
                <UploadSection onLoadingStart={() => setLoading(true)} onAnalysisComplete={handleAnalysisComplete} onError={setError} onImageSelected={setUploadedImage} setUploadProgress={setUploadProgress} currentGender={currentGender} setCurrentGender={setCurrentGender} isPro={isPro} usage={usage} coins={coins} onCoinEmpty={() => {}} />
              )}
              {loading && <LoadingScreenWithProgress progress={uploadProgress} />}
              {error && !loading && (
                <div style={{ padding: 32, textAlign: 'center', background: 'rgba(239,68,68,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16 }}>
                  <p style={{ fontSize: '36px', marginBottom: 12 }}>😕</p>
                  <p style={{ color: '#EF4444', fontSize: '14px', marginBottom: 24, lineHeight: '1.6', fontFamily: PJS }}>{error}</p>
                  <button onClick={handleReset} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', borderRadius: 10, padding: '12px 28px', cursor: 'pointer', fontSize: '13px', fontFamily: PJS }}>Try Again</button>
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
              <SectionHeader label="Your Archive" title="Analysis History" subtitle="All your previous skin tone analyses" />
              <HistoryPanel onShowResult={data => { setResults(data); handleTabChange('analyze'); }} />
            </div>
          )}

          {activeTab === 'wardrobe' && (
            <div key="wardrobe" style={{ animation: 'fadeSlideIn 0.3s ease' }}>
              <SectionHeader label="Style Vault" title="Your Wardrobe" subtitle="Manage and organize your saved outfits" />
              <WardrobePanel onShowResult={data => { setResults(data); handleTabChange('analyze'); }} gender={currentGender} />
            </div>
          )}

          {activeTab === 'navigator' && (
            <div key="navigator" style={{ animation: 'fadeSlideIn 0.3s ease' }}>
              <SectionHeader label="Style Intelligence" title="Style Navigator" subtitle="AI-powered style guide tailored to your skin tone" />
              <StyleNavigator user={user} onAnalyze={() => handleTabChange('analyze')} />
            </div>
          )}

          {activeTab === 'tools' && (
            <div key="tools" style={{ animation: 'fadeSlideIn 0.3s ease' }}>
              <SectionHeader label="Power Tools" title="Style Tools" subtitle="Advanced tools to elevate your fashion game" />
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
              user={user}
              onLogout={handleLogout}
              onTabChange={handleTabChange}
              onToast={setToast}
            />
          )}

        </Suspense>
      </main>

      {/* ═══════════ MOBILE BOTTOM NAV ═══════════ */}
      <nav
        className="mobile-bottom-nav md:hidden"
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: 'rgba(11,15,26,0.97)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', borderTop: `1px solid ${BORDER}`, paddingBottom: 'env(safe-area-inset-bottom, 6px)' }}
      >
        {mobileTabs.map(item => {
          const active = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => handleTabChange(item.id)} style={{ flex: 1, padding: '10px 2px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
              {active && <div style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: 2, background: GRAD, borderRadius: 1 }} />}
              <span style={{ fontSize: '20px', lineHeight: 1, opacity: active ? 1 : 0.4, transition: 'opacity 0.2s' }}>{item.icon}</span>
              <span style={{ fontSize: '8px', letterSpacing: '0.05em', textTransform: 'uppercase', color: active ? TEXT : MUTED, fontWeight: active ? 600 : 400, fontFamily: PJS, transition: 'color 0.2s' }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <StyleBot />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ShoppingCart isOpen={cartOpen} onClose={() => setCartOpen(false)} isDark />
    </div>
  );
}
