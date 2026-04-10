/**
 * AppShell.jsx — StyleGuru AI v4.0
 * Premium Glassmorphism + Gradient Design
 * ─────────────────────────────────────────
 * ✅ Glassmorphism cards & navigation
 * ✅ Gradient CTA buttons with glow
 * ✅ Radial bg glows
 * ✅ Smooth tab transitions
 * ✅ Mobile bottom nav (glassmorphism)
 * ✅ Desktop top nav with glass effect
 */

import { useState, useEffect, useContext, lazy, Suspense, useCallback } from 'react';
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

// ── Lazy loaded feature sections ──────────────────────
const UploadSection  = lazy(() => import('./UploadSection'));
const ResultsDisplay = lazy(() => import('./ResultsDisplay'));
const CoupleResults  = lazy(() => import('./CoupleResults'));
const HistoryPanel   = lazy(() => import('./HistoryPanel'));
const WardrobePanel  = lazy(() => import('./WardrobePanel'));
const ToolsTab       = lazy(() => import('./ToolsTab'));
const StyleNavigator = lazy(() => import('./StyleNavigator'));
const ProfilePanel   = lazy(() => import('./ProfilePanel'));
const ColorScanner   = lazy(() => import('./ColorScanner'));

// ── Design Config ─────────────────────────────────────
const BG = '#0B0F1A';
const GLASS = 'rgba(255,255,255,0.05)';
const GLASS2 = 'rgba(255,255,255,0.08)';
const BORDER = 'rgba(255,255,255,0.08)';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';
const GRAD = 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)';
const GRAD_B = 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)';
const VIOLET = '#8B5CF6';
const INDIGO = '#6366F1';

const GLOW_BTN = '0 4px 20px rgba(139,92,246,0.35)';
const GLOW_CARD = '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)';
const SHADOW = '0 8px 32px rgba(0,0,0,0.4)';

// ── Section Loader ─────────────────────────────────────
function SectionLoader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0', flexDirection:'column', gap:16 }}>
      <div style={{
        width:32, height:32,
        borderRadius:'50%',
        border:'2px solid rgba(255,255,255,0.1)',
        borderTopColor: VIOLET,
        animation:'spinSmooth 0.8s linear infinite'
      }} />
      <span style={{ fontSize:'11px', letterSpacing:'0.2em', textTransform:'uppercase', color:MUTED, fontFamily:"'Plus Jakarta Sans','Inter',sans-serif" }}>
        Loading
      </span>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────
function Toast({ message, type='default', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const bg = type==='success'
    ? 'rgba(16,185,129,0.15)'
    : type==='error'
    ? 'rgba(239,68,68,0.15)'
    : GLASS2;
  const border = type==='success' ? 'rgba(16,185,129,0.4)' : type==='error' ? 'rgba(239,68,68,0.4)' : BORDER;
  return (
    <div style={{
      position:'fixed', bottom:88, left:'50%', transform:'translateX(-50%)',
      zIndex:600, background:bg, backdropFilter:'blur(20px)',
      border:`1px solid ${border}`, borderRadius:12,
      padding:'12px 24px', fontSize:'13px', color:TEXT,
      letterSpacing:'0.02em', whiteSpace:'nowrap',
      animation:'fadeUp 0.3s ease', boxShadow:SHADOW,
      display:'flex', alignItems:'center', gap:8,
      fontFamily:"'Plus Jakarta Sans','Inter',sans-serif",
    }}>
      {type==='success' && <span style={{ color:'#10B981' }}>✓</span>}
      {type==='error'   && <span style={{ color:'#EF4444' }}>✗</span>}
      {message}
    </div>
  );
}

// ── Section Header ─────────────────────────────────────
function SectionHeader({ label, title, subtitle, action }) {
  return (
    <div style={{ marginBottom:32, display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, flexWrap:'wrap', paddingTop:8 }}>
      <div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:10 }}>
          <div style={{ width:20, height:2, background:GRAD, borderRadius:1 }} />
          <span style={{ fontSize:'10px', letterSpacing:'0.22em', textTransform:'uppercase', background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:600, fontFamily:"'Plus Jakarta Sans','Inter',sans-serif" }}>
            {label}
          </span>
        </div>
        <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:'clamp(22px,4vw,32px)', fontWeight:300, color:TEXT, lineHeight:1.25, margin:0 }}>
          {title}
        </h2>
        {subtitle && <p style={{ fontSize:'13px', color:MUTED, marginTop:6, fontFamily:"'Plus Jakarta Sans','Inter',sans-serif" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Home Section ───────────────────────────────────────
function HomeSection({ user, lastAnalysis, onAnalyze, onTabChange }) {
  const { language } = useLanguage();
  const firstName = user?.name?.split(' ')[0] || 'there';
  const avatarLetter = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase();

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
  const tipObj = getLocalizedTip(genderPref, tone, language);
  const todayTip = tipObj?.tip || null;
  const tipEmoji = tipObj?.emoji || '✨';

  const analysisCount = parseInt(localStorage.getItem('sg_analysis_count') || '0');
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const shortcuts = [
    { id:'history',   icon:'📋', label:'History',   desc:'Past analyses',    grad:'linear-gradient(135deg,#6366F1,#8B5CF6)' },
    { id:'wardrobe',  icon:'👗', label:'Wardrobe',  desc:'Your clothes',     grad:'linear-gradient(135deg,#8B5CF6,#EC4899)' },
    { id:'navigator', icon:'🗺️', label:'Navigator', desc:'Style guide',      grad:'linear-gradient(135deg,#3B82F6,#6366F1)' },
    { id:'tools',     icon:'⚙️', label:'Tools',     desc:'Style tools',      grad:'linear-gradient(135deg,#10B981,#3B82F6)' },
  ];

  return (
    <div style={{ animation:'fadeSlideIn 0.4s ease' }}>

      {/* ── Welcome ── */}
      <div style={{ marginBottom:28, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
        <div>
          <p style={{ fontSize:'12px', color:MUTED, marginBottom:6, fontFamily:"'Plus Jakarta Sans','Inter',sans-serif", letterSpacing:'0.02em' }}>
            {greeting} 👋
          </p>
          <h2 style={{
            fontFamily:"'Playfair Display',Georgia,serif",
            fontSize:'clamp(26px,5vw,40px)', fontWeight:300,
            lineHeight:1.15, margin:0,
          }}>
            <span style={{ color:TEXT }}>Hi, </span>
            <span style={{ background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              {firstName}
            </span>
          </h2>
        </div>
        {/* Premium Avatar */}
        <button
          onClick={() => onTabChange('profile')}
          style={{
            flexShrink:0, width:48, height:48, borderRadius:'50%',
            background:GRAD, border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:GLOW_BTN, transition:'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform='scale(1.05)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(139,92,246,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow=GLOW_BTN; }}
          title="Profile"
        >
          <span style={{ fontSize:'18px', fontWeight:700, color:'white', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{avatarLetter}</span>
        </button>
      </div>

      {/* ── Primary CTA ── */}
      <button
        onClick={onAnalyze}
        className="gradient-btn"
        style={{
          width:'100%', padding:'20px 24px', borderRadius:16,
          display:'flex', alignItems:'center', gap:16, marginBottom:20,
          fontFamily:"'Plus Jakarta Sans','Inter',sans-serif",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 40px rgba(139,92,246,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=GLOW_BTN; }}
      >
        <div style={{ width:48, height:48, borderRadius:12, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <span style={{ fontSize:'22px' }}>📷</span>
        </div>
        <div style={{ textAlign:'left', flex:1 }}>
          <p style={{ fontSize:'15px', fontWeight:700, letterSpacing:'0.02em', margin:0, color:'white' }}>
            Analyze My Style
          </p>
          <p style={{ fontSize:'12px', opacity:0.75, marginTop:3, margin:'3px 0 0', color:'white', fontWeight:400 }}>
            Upload a photo → Get your color palette & outfit recommendations
          </p>
        </div>
        <span style={{ fontSize:'20px', opacity:0.7 }}>→</span>
      </button>

      {/* ── Stats Row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {[
          { value:analysisCount, label:'Analyses', icon:'📊', grad:'linear-gradient(135deg,#6366F1,#8B5CF6)' },
          { value:streak>0?`${streak}🔥`:'—', label:'Day Streak', icon:'', grad:'linear-gradient(135deg,#F59E0B,#EC4899)' },
          { value:activeProfile?.skinTone||'—', label:'Your Tone', icon:'🎨', grad:'linear-gradient(135deg,#10B981,#3B82F6)' },
        ].map((s,i) => (
          <div key={i} style={{
            background:GLASS, backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
            border:`1px solid ${BORDER}`, borderRadius:14, padding:'18px 12px',
            textAlign:'center', boxShadow:GLOW_CARD, transition:'border-color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor='rgba(139,92,246,0.3)'}
          onMouseLeave={e => e.currentTarget.style.borderColor=BORDER}
          >
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:s.value?.toString().length>6?'14px':'24px', color:TEXT, margin:'0 0 4px', lineHeight:1 }}>
              {s.value}
            </p>
            <p style={{ fontSize:'9px', letterSpacing:'0.12em', textTransform:'uppercase', color:MUTED, fontFamily:"'Plus Jakarta Sans',sans-serif", margin:0 }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Last Analysis Card ── */}
      {lastAnalysis && (
        <div
          onClick={() => onTabChange('analyze')}
          style={{
            display:'flex', alignItems:'center', gap:16, padding:'18px 20px',
            background:GLASS, backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
            border:`1px solid ${BORDER}`, borderRadius:16, marginBottom:20,
            cursor:'pointer', boxShadow:GLOW_CARD, transition:'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(139,92,246,0.4)'; e.currentTarget.style.transform='translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.transform='translateY(0)'; }}
        >
          {/* Skin hex circle */}
          <div style={{ width:48, height:48, borderRadius:'50%', background:lastAnalysis.skinHex||'#C68642', flexShrink:0, border:`3px solid rgba(255,255,255,0.15)`, boxShadow:'0 0 20px rgba(0,0,0,0.4)' }} />
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:'10px', letterSpacing:'0.18em', textTransform:'uppercase', background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'0 0 3px', fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600 }}>
              Last Analysis
            </p>
            <p style={{ fontSize:'15px', fontFamily:"'Playfair Display',serif", color:TEXT, margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {lastAnalysis.skinTone||'Your Skin Tone'}
            </p>
            <p style={{ fontSize:'11px', color:MUTED, margin:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              {lastAnalysis.timestamp ? new Date(lastAnalysis.timestamp).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : 'View result'}
            </p>
          </div>
          <div style={{ width:32, height:32, borderRadius:'50%', background:GLASS2, border:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:TEXT }}>→</div>
        </div>
      )}

      {/* ── Daily Tip ── */}
      {todayTip && (
        <div style={{
          padding:'20px 24px', background:GLASS,
          backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
          border:`1px solid ${BORDER}`, borderRadius:16, marginBottom:20,
          position:'relative', overflow:'hidden', boxShadow:GLOW_CARD
        }}>
          {/* Gradient glow bg */}
          <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, background:'radial-gradient(circle,rgba(139,92,246,0.15),transparent)', borderRadius:'50%', pointerEvents:'none' }} />
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
            <div style={{ width:16, height:2, background:GRAD, borderRadius:1 }} />
            <span style={{ fontSize:'9px', letterSpacing:'0.22em', textTransform:'uppercase', background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              Today's Style Tip
            </span>
          </div>
          <p style={{ fontSize:'13px', color:TEXT, lineHeight:'1.75', margin:0, fontFamily:"'Plus Jakarta Sans','Inter',sans-serif" }}>
            {tipEmoji} {todayTip}
          </p>
        </div>
      )}

      {/* ── Feature Shortcuts ── */}
      <p style={{ fontSize:'10px', letterSpacing:'0.18em', textTransform:'uppercase', color:MUTED, fontFamily:"'Plus Jakarta Sans',sans-serif", margin:'0 0 14px' }}>
        Features
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {shortcuts.map(f => (
          <button
            key={f.id}
            onClick={() => onTabChange(f.id)}
            style={{
              background:GLASS, backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
              border:`1px solid ${BORDER}`, borderRadius:16, padding:'22px 18px',
              textAlign:'left', cursor:'pointer', display:'flex', flexDirection:'column', gap:12,
              boxShadow:GLOW_CARD, transition:'all 0.2s', fontFamily:"'Plus Jakarta Sans','Inter',sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(139,92,246,0.4)'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(139,92,246,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=GLOW_CARD; }}
          >
            {/* Icon with gradient bg */}
            <div style={{ width:44, height:44, borderRadius:12, background:f.grad, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(0,0,0,0.3)' }}>
              <span style={{ fontSize:'22px' }}>{f.icon}</span>
            </div>
            <div>
              <p style={{ fontSize:'14px', fontWeight:600, color:TEXT, margin:'0 0 3px' }}>{f.label}</p>
              <p style={{ fontSize:'11px', color:MUTED, margin:0 }}>{f.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main App Shell ─────────────────────────────────────
export default function AppShell({ user, onLogout }) {
  const { theme } = useContext(ThemeContext);
  const { isPro, usage, coins } = usePlan();
  const { cartOpen, setCartOpen } = useCart();

  const [activeTab, setActiveTab]           = useState('home');
  const [results, setResults]               = useState(null);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImage, setUploadedImage]   = useState(null);
  const [currentGender, setCurrentGender]   = useState(localStorage.getItem('sg_gender_pref') || 'male');
  const [lastAnalysis, setLastAnalysis]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('sg_last_analysis') || 'null'); } catch { return null; }
  });
  const [toast, setToast] = useState(null);
  const [navScrolled, setNavScrolled] = useState(false);

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
    setLoading(false);
    setResults(data);
    setActiveTab('analyze');
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
     'sg_daily_drop_date','sg_analysis_history','sg_saved_colors','sg_wardrobe_queue'
    ].forEach(k => localStorage.removeItem(k));
    onLogout();
  }, [onLogout]);

  const avatarLetter = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase();
  const firstName = user?.name?.split(' ')[0] || '';

  const desktopTabs = [
    { id:'home',      label:'Home' },
    { id:'analyze',   label:'Analyze' },
    { id:'history',   label:'History' },
    { id:'wardrobe',  label:'Wardrobe' },
    { id:'navigator', label:'Navigator' },
    { id:'tools',     label:'Tools' },
  ];

  const mobileTabs = [
    { id:'home',      icon:'🏠', label:'Home' },
    { id:'analyze',   icon:'📷', label:'Analyze' },
    { id:'history',   icon:'📋', label:'History' },
    { id:'wardrobe',  icon:'👗', label:'Wardrobe' },
    { id:'tools',     icon:'⚙️', label:'Tools' },
  ];

  /* ── Radial BG Glows ── */
  const BgGlows = () => (
    <>
      <div style={{ position:'fixed', top:'-20%', left:'-10%', width:'50vw', height:'50vh', background:'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:'-20%', right:'-10%', width:'50vw', height:'50vh', background:'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', top:'40%', right:'20%', width:'30vw', height:'30vh', background:'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />
    </>
  );

  return (
    <div style={{ background:BG, color:TEXT, minHeight:'100vh', fontFamily:"'Plus Jakarta Sans','Inter','DM Sans',sans-serif", position:'relative' }}>
      <BgGlows />

      {/* ══════════════════════════════════════════
          PREMIUM GLASS NAVBAR
          ══════════════════════════════════════════ */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        height:60,
        background: navScrolled ? 'rgba(11,15,26,0.9)' : 'rgba(11,15,26,0.6)',
        backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
        borderBottom:`1px solid ${navScrolled ? BORDER : 'transparent'}`,
        display:'flex', alignItems:'center', padding:'0 20px', gap:16,
        transition:'all 0.3s ease',
      }}>
        {/* Logo */}
        <button
          onClick={() => handleTabChange('home')}
          style={{ display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer', padding:0, flexShrink:0 }}
        >
          <div style={{ width:32, height:32, borderRadius:8, background:GRAD, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(139,92,246,0.4)', flexShrink:0 }}>
            <span style={{ fontSize:'12px', fontWeight:800, color:'white', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>SG</span>
          </div>
          <span className="hidden sm:inline" style={{ fontSize:'14px', fontWeight:700, color:TEXT, letterSpacing:'-0.01em', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            StyleGuru <span style={{ background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>AI</span>
          </span>
        </button>

        {/* Desktop Tabs */}
        <div className="hidden md:flex" style={{ flex:1, justifyContent:'center', gap:2 }}>
          {desktopTabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                  border:'none', cursor:'pointer',
                  padding:'6px 16px', borderRadius:8,
                  fontSize:'13px', fontWeight: active ? 600 : 400,
                  color: active ? TEXT : MUTED,
                  transition:'all 0.2s',
                  fontFamily:"'Plus Jakarta Sans','Inter',sans-serif",
                  position:'relative',
                }}
                onMouseEnter={e => { if(!active) e.currentTarget.style.color=TEXT; if(!active) e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if(!active) e.currentTarget.style.color=MUTED; if(!active) e.currentTarget.style.background='transparent'; }}
              >
                {tab.label}
                {active && (
                  <div style={{
                    position:'absolute', bottom:-2, left:'50%', transform:'translateX(-50%)',
                    width:20, height:2, borderRadius:1, background:GRAD,
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Right actions */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginLeft:'auto' }}>
          {/* Avatar */}
          <button
            onClick={() => handleTabChange('profile')}
            style={{
              width:36, height:36, borderRadius:'50%',
              background: activeTab==='profile' ? GRAD : GLASS2,
              border:`1px solid ${activeTab==='profile' ? 'transparent' : BORDER}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', transition:'all 0.2s',
              boxShadow: activeTab==='profile' ? GLOW_BTN : 'none',
              fontSize:'13px', fontWeight:700, color:TEXT,
              fontFamily:"'Plus Jakarta Sans',sans-serif",
            }}
            title={`${firstName} — Profile`}
          >
            {avatarLetter}
          </button>

          {/* Sign out button — desktop */}
          <button
            className="hidden md:flex"
            onClick={handleLogout}
            style={{
              alignItems:'center', background:GLASS, backdropFilter:'blur(10px)',
              border:`1px solid ${BORDER}`, color:MUTED,
              borderRadius:8, fontSize:'12px', fontWeight:500,
              padding:'7px 16px', cursor:'pointer', transition:'all 0.2s',
              fontFamily:"'Plus Jakarta Sans','Inter',sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(239,68,68,0.4)'; e.currentTarget.style.color='#EF4444'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.color=MUTED; }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          MAIN CONTENT
          ══════════════════════════════════════════ */}
      <main style={{ maxWidth:760, margin:'0 auto', padding:'76px 16px 100px', position:'relative', zIndex:1 }}>
        <Suspense fallback={<SectionLoader />}>

          {activeTab === 'home' && (
            <HomeSection key="home" user={user} lastAnalysis={lastAnalysis} onAnalyze={() => handleTabChange('analyze')} onTabChange={handleTabChange} />
          )}

          {activeTab === 'analyze' && (
            <div key="analyze" style={{ animation:'fadeSlideIn 0.3s ease' }}>
              <SectionHeader
                label="AI Analysis"
                title={results ? 'Your Style Profile' : 'Upload a Photo'}
                subtitle={!results ? 'Get personalized color palette & outfit recommendations' : undefined}
                action={results && (
                  <button
                    onClick={handleReset}
                    style={{
                      background:GLASS, backdropFilter:'blur(12px)', border:`1px solid ${BORDER}`,
                      color:MUTED, borderRadius:10, padding:'10px 18px',
                      fontSize:'12px', cursor:'pointer', transition:'all 0.2s',
                      fontFamily:"'Plus Jakarta Sans',sans-serif",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor=VIOLET; e.currentTarget.style.color=TEXT; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.color=MUTED; }}
                  >
                    ↑ New Scan
                  </button>
                )}
              />

              {!results && !loading && !error && (
                <UploadSection
                  onLoadingStart={() => setLoading(true)}
                  onAnalysisComplete={handleAnalysisComplete}
                  onError={setError}
                  onImageSelected={setUploadedImage}
                  setUploadProgress={setUploadProgress}
                  currentGender={currentGender}
                  setCurrentGender={setCurrentGender}
                  isPro={isPro} usage={usage} coins={coins}
                  onCoinEmpty={() => {}}
                />
              )}

              {loading && <LoadingScreenWithProgress progress={uploadProgress} />}

              {error && !loading && (
                <div style={{
                  padding:32, textAlign:'center',
                  background:'rgba(239,68,68,0.06)', backdropFilter:'blur(12px)',
                  border:'1px solid rgba(239,68,68,0.2)', borderRadius:16,
                }}>
                  <p style={{ fontSize:'40px', marginBottom:12 }}>😕</p>
                  <p style={{ color:'#EF4444', fontSize:'14px', marginBottom:24, lineHeight:'1.6', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{error}</p>
                  <button
                    onClick={handleReset}
                    style={{ background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', color:'#EF4444', borderRadius:10, padding:'12px 28px', cursor:'pointer', fontSize:'13px', fontFamily:"'Plus Jakarta Sans',sans-serif" }}
                  >
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

          {activeTab === 'history' && (
            <div key="history" style={{ animation:'fadeSlideIn 0.3s ease' }}>
              <SectionHeader label="Your Archive" title="Analysis History" subtitle="All your previous skin tone analyses" />
              <HistoryPanel onShowResult={data => { setResults(data); handleTabChange('analyze'); }} />
            </div>
          )}

          {activeTab === 'wardrobe' && (
            <div key="wardrobe" style={{ animation:'fadeSlideIn 0.3s ease' }}>
              <SectionHeader label="Style Vault" title="Your Wardrobe" subtitle="Manage and organize your clothing items" />
              <WardrobePanel onShowResult={data => { setResults(data); handleTabChange('analyze'); }} gender={currentGender} />
            </div>
          )}

          {activeTab === 'navigator' && (
            <div key="navigator" style={{ animation:'fadeSlideIn 0.3s ease' }}>
              <SectionHeader label="Style Intelligence" title="Style Navigator" subtitle="AI-powered style guide for your skin tone" />
              <StyleNavigator user={user} onAnalyze={() => handleTabChange('analyze')} />
            </div>
          )}

          {activeTab === 'tools' && (
            <div key="tools" style={{ animation:'fadeSlideIn 0.3s ease' }}>
              <SectionHeader label="Power Tools" title="Style Tools" subtitle="Advanced tools to elevate your fashion game" />
              <ToolsTab
                analysisData={results}
                onShowResult={data => { setResults(data); handleTabChange('analyze'); }}
                onOpenScanner={() => handleTabChange('scanner')}
              />
            </div>
          )}

          {activeTab === 'scanner' && (
            <ColorScanner
              key="scanner"
              savedPalette={(() => { try { return lastAnalysis?.fullData?.recommendations?.best_shirt_colors || lastAnalysis?.fullData?.recommendations?.best_dress_colors || []; } catch { return []; } })()}
              skinTone={lastAnalysis?.skinTone || ''}
              onClose={() => handleTabChange('home')}
            />
          )}

          {activeTab === 'profile' && (
            <div key="profile" style={{ animation:'fadeSlideIn 0.3s ease' }}>
              <SectionHeader label="Your Account" title="Profile" />

              {/* Premium user card */}
              <div style={{
                padding:'28px 24px', marginBottom:24,
                background:GLASS, backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                border:`1px solid ${BORDER}`, borderRadius:20, boxShadow:GLOW_CARD,
                display:'flex', alignItems:'center', gap:20, position:'relative', overflow:'hidden',
              }}>
                {/* bg glow */}
                <div style={{ position:'absolute', top:-40, right:-40, width:150, height:150, background:'radial-gradient(circle,rgba(139,92,246,0.12),transparent)', borderRadius:'50%', pointerEvents:'none' }} />
                {/* Avatar */}
                <div style={{ width:64, height:64, borderRadius:'50%', background:GRAD, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:GLOW_BTN, position:'relative', zIndex:1 }}>
                  <span style={{ fontSize:'24px', fontWeight:700, color:'white', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{avatarLetter}</span>
                </div>
                <div style={{ flex:1, minWidth:0, position:'relative', zIndex:1 }}>
                  <p style={{ fontSize:'18px', fontFamily:"'Playfair Display',serif", color:TEXT, margin:'0 0 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name || 'User'}</p>
                  <p style={{ fontSize:'13px', color:MUTED, fontFamily:"'Plus Jakarta Sans',sans-serif", margin:'0 0 8px', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.email}</p>
                  {activeProfile?.skinTone && (
                    <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(139,92,246,0.15)', border:'1px solid rgba(139,92,246,0.25)', borderRadius:20, padding:'3px 10px' }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:activeProfile.skinHex||VIOLET }} />
                      <span style={{ fontSize:'10px', color:TEXT, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:500 }}>{activeProfile.skinTone}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  style={{ flexShrink:0, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#EF4444', borderRadius:10, padding:'10px 18px', fontSize:'12px', cursor:'pointer', transition:'all 0.2s', fontFamily:"'Plus Jakarta Sans',sans-serif", position:'relative', zIndex:1 }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,0.1)'}
                >
                  Sign Out
                </button>
              </div>

              <ProfilePanel hideHeader onOpenUpgrade={() => {}} />
            </div>
          )}

        </Suspense>
      </main>

      {/* ══════════════════════════════════════════
          MOBILE BOTTOM NAV — glass style
          ══════════════════════════════════════════ */}
      <nav
        className="md:hidden"
        style={{
          position:'fixed', bottom:0, left:0, right:0, zIndex:200,
          background:'rgba(11,15,26,0.95)',
          backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
          borderTop:`1px solid ${BORDER}`,
          display:'flex',
          paddingBottom:'env(safe-area-inset-bottom, 6px)',
        }}
      >
        {mobileTabs.map(item => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              style={{
                flex:1, padding:'10px 2px 8px',
                display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                background:'none', border:'none', cursor:'pointer',
                position:'relative',
              }}
            >
              {/* Active gradient indicator */}
              {active && (
                <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:2, background:GRAD, borderRadius:1 }} />
              )}
              <span style={{ fontSize:'20px', lineHeight:1, opacity:active?1:0.4, transition:'opacity 0.2s' }}>
                {item.icon}
              </span>
              <span style={{
                fontSize:'8px', letterSpacing:'0.05em', textTransform:'uppercase',
                color:active?TEXT:MUTED, fontWeight:active?600:400,
                fontFamily:"'Plus Jakarta Sans','Inter',sans-serif",
                transition:'color 0.2s',
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Global AI Bot */}
      <StyleBot />

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Shopping Cart */}
      <ShoppingCart isOpen={cartOpen} onClose={() => setCartOpen(false)} isDark />
    </div>
  );
}

// helper used in profile section
const activeProfile = (() => {
  try {
    const p = JSON.parse(localStorage.getItem('sg_primary_profile') || 'null');
    const l = JSON.parse(localStorage.getItem('sg_last_analysis') || 'null');
    return p || l;
  } catch { return null; }
})();
