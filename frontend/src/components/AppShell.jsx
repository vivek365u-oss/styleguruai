/**
 * AppShell.jsx — StyleGuru AI v3.0 — Premium App Shell
 * ─────────────────────────────────────────────────────
 * ✅ Desktop: Top nav only (no bottom nav)
 * ✅ Mobile: Bottom nav only (top nav hides tab items)
 * ✅ Smooth section transitions
 * ✅ Premium home dashboard
 * ✅ All sections functional
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

// ── Design tokens ─────────────────────────────────────
const C = {
  bg:       '#0C0C0C',
  surface:  '#141414',
  surface2: '#1A1A1A',
  border:   '#242424',
  borderSoft:'#1C1C1C',
  text:     '#F0EDE6',
  muted:    '#6B6B6B',
  subtle:   '#3A3A3A',
  gold:     '#C9A96E',
  goldPale: '#E8D5A3',
};

// ── Section Loader ────────────────────────────────────
function SectionLoader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0', flexDirection:'column', gap:16 }}>
      <div style={{ width:28, height:28, border:`2px solid ${C.border}`, borderTopColor:C.gold, borderRadius:'50%', animation:'spinSmooth 0.8s linear infinite' }} />
      <span style={{ fontSize:'10px', letterSpacing:'0.2em', textTransform:'uppercase', color:C.muted }}>Loading</span>
    </div>
  );
}

// ── Section Header ─────────────────────────────────────
function SectionHeader({ label, title, action }) {
  return (
    <div style={{ marginBottom:32, display:'flex', alignItems:'flex-end', justifyContent:'space-between', paddingTop: 8 }}>
      <div>
        <p style={{ fontSize:'10px', letterSpacing:'0.22em', textTransform:'uppercase', color:C.gold, marginBottom:8, fontFamily:"'Inter',sans-serif" }}>
          {label}
        </p>
        <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:'clamp(22px,4vw,32px)', fontWeight:300, color:C.text, lineHeight:1.2 }}>
          {title}
        </h2>
      </div>
      {action && action}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────
function Toast({ message, type = 'default', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'success' ? '#166534' : type === 'error' ? '#7f1d1d' : C.surface;
  const border = type === 'success' ? '#16a34a' : type === 'error' ? '#ef4444' : C.border;
  return (
    <div style={{
      position:'fixed', bottom:88, left:'50%', transform:'translateX(-50%)', zIndex:600,
      background:bg, border:`1px solid ${border}`, padding:'12px 24px',
      fontSize:'12px', color:C.text, letterSpacing:'0.05em', whiteSpace:'nowrap',
      animation:'fadeUp 0.3s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.6)',
      display:'flex', alignItems:'center', gap:8
    }}>
      {type === 'success' && <span>✓</span>}
      {type === 'error' && <span>✗</span>}
      {message}
    </div>
  );
}

// ── Premium Home Section ───────────────────────────────
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
  const todayTip = tipObj ? tipObj.tip : null;
  const tipEmoji = tipObj ? tipObj.emoji : '💡';

  const analysisCount = parseInt(localStorage.getItem('sg_analysis_count') || '0');
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const shortcuts = [
    { id: 'history',   icon: '📋', label: 'History',   desc: 'Past analyses' },
    { id: 'wardrobe',  icon: '👗', label: 'Wardrobe',  desc: 'Your clothes' },
    { id: 'navigator', icon: '🗺️', label: 'Navigator', desc: 'Style guide' },
    { id: 'tools',     icon: '⚙️', label: 'Tools',     desc: 'Style tools' },
  ];

  return (
    <div style={{ animation:'fadeSlideIn 0.35s ease' }}>

      {/* ── Welcome Banner ── */}
      <div style={{ marginBottom:28, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:'11px', letterSpacing:'0.15em', textTransform:'uppercase', color:C.muted, marginBottom:6, fontFamily:"'Inter',sans-serif" }}>
            {greeting}
          </p>
          <h2 style={{
            fontFamily:"'Playfair Display',Georgia,serif",
            fontSize:'clamp(24px,5vw,38px)', fontWeight:300, color:C.text, lineHeight:1.15, margin:0
          }}>
            Hi, <em style={{ fontStyle:'italic', color:C.gold }}>{firstName}</em>
          </h2>
        </div>
        {/* Avatar */}
        <div style={{
          width:44, height:44, background:C.gold, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer',
        }} onClick={() => onTabChange('profile')}>
          <span style={{ fontSize:'16px', fontWeight:700, color:'#0A0A0A', fontFamily:"'Inter',sans-serif" }}>{avatarLetter}</span>
        </div>
      </div>

      {/* ── Primary Analyze CTA ── */}
      <button
        onClick={onAnalyze}
        style={{
          width:'100%', padding:'20px 24px',
          background:`linear-gradient(135deg, ${C.gold} 0%, #B8966A 100%)`,
          color:'#0A0A0A', border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', gap:14, marginBottom:3,
          transition:'opacity 0.2s, transform 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity='0.9'; e.currentTarget.style.transform='translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='translateY(0)'; }}
        onMouseDown={e => e.currentTarget.style.transform='scale(0.99)'}
        onMouseUp={e => e.currentTarget.style.transform='translateY(-1px)'}
      >
        <div style={{ width:40, height:40, background:'rgba(0,0,0,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <span style={{ fontSize:'20px' }}>📷</span>
        </div>
        <div style={{ textAlign:'left', flex:1 }}>
          <p style={{ fontSize:'13px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:"'Inter',sans-serif", margin:0 }}>
            Analyze My Style
          </p>
          <p style={{ fontSize:'11px', opacity:0.7, marginTop:2, fontFamily:"'Inter',sans-serif", fontWeight:400, margin:'2px 0 0' }}>
            Upload a photo to get your color palette
          </p>
        </div>
        <span style={{ fontSize:'18px', opacity:0.6 }}>→</span>
      </button>

      {/* ── Stats Row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:C.borderSoft, marginBottom:20 }}>
        {[
          { value: analysisCount, label: 'Analyses' },
          { value: streak > 0 ? `${streak}🔥` : '—', label: 'Day Streak' },
          { value: activeProfile?.skinTone || '—', label: 'Your Tone' },
        ].map((s, i) => (
          <div key={i} style={{ background:C.surface, padding:'18px 12px', textAlign:'center' }}>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:s.value?.toString().length > 6 ? '14px' : '22px', color:C.text, margin:'0 0 4px', lineHeight:1 }}>
              {s.value}
            </p>
            <p style={{ fontSize:'9px', letterSpacing:'0.12em', textTransform:'uppercase', color:C.muted, fontFamily:"'Inter',sans-serif", margin:0 }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Last Analysis Card (if exists) ── */}
      {lastAnalysis && (
        <div
          onClick={() => onTabChange('analyze')}
          style={{
            padding:'18px 20px', background:C.surface,
            border:`1px solid ${C.border}`, marginBottom:20,
            display:'flex', alignItems:'center', gap:14, cursor:'pointer',
            transition:'border-color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.gold}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
        >
          {/* Skin tone swatch */}
          <div style={{
            width:44, height:44, flexShrink:0, background: lastAnalysis.skinHex || '#C68642',
            border:`2px solid ${C.border}`
          }} />
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:'9px', letterSpacing:'0.2em', textTransform:'uppercase', color:C.muted, fontFamily:"'Inter',sans-serif", margin:'0 0 4px' }}>
              Last Analysis
            </p>
            <p style={{ fontSize:'15px', fontFamily:"'Playfair Display',serif", color:C.text, margin:'0 0 2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {lastAnalysis.skinTone || 'Your Skin Tone'}
            </p>
            <p style={{ fontSize:'11px', color:C.muted, margin:0, fontFamily:"'Inter',sans-serif" }}>
              {lastAnalysis.timestamp ? new Date(lastAnalysis.timestamp).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : 'View result'}
            </p>
          </div>
          <span style={{ fontSize:'16px', color:C.gold, flexShrink:0 }}>→</span>
        </div>
      )}

      {/* ── Today's Tip ── */}
      {todayTip && (
        <div style={{ padding:'20px 24px', background:C.surface, border:`1px solid ${C.border}`, marginBottom:20, position:'relative', overflow:'hidden' }}>
          {/* Gold accent bar */}
          <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:C.gold }} />
          <p style={{ fontSize:'9px', letterSpacing:'0.22em', textTransform:'uppercase', color:C.gold, fontFamily:"'Inter',sans-serif", margin:'0 0 10px' }}>
            Today's Style Tip
          </p>
          <p style={{ fontSize:'13px', color:C.text, lineHeight:'1.75', margin:0, fontFamily:"'Inter',sans-serif" }}>
            {tipEmoji} {todayTip}
          </p>
        </div>
      )}

      {/* ── Feature Shortcuts ── */}
      <p style={{ fontSize:'9px', letterSpacing:'0.22em', textTransform:'uppercase', color:C.subtle, fontFamily:"'Inter',sans-serif", margin:'0 0 12px' }}>
        Features
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:C.borderSoft }}>
        {shortcuts.map(f => (
          <button
            key={f.id}
            onClick={() => onTabChange(f.id)}
            style={{
              background:C.surface, padding:'22px 20px', textAlign:'left',
              border:'none', cursor:'pointer', display:'flex', flexDirection:'column', gap:10,
              transition:'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = C.surface2}
            onMouseLeave={e => e.currentTarget.style.background = C.surface}
          >
            <span style={{ fontSize:'24px', lineHeight:1 }}>{f.icon}</span>
            <div>
              <p style={{ fontSize:'13px', fontWeight:500, color:C.text, fontFamily:"'Inter',sans-serif", margin:'0 0 3px' }}>{f.label}</p>
              <p style={{ fontSize:'11px', color:C.muted, fontFamily:"'Inter',sans-serif", margin:0 }}>{f.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main App Shell ────────────────────────────────────
export default function AppShell({ user, onLogout }) {
  const { theme } = useContext(ThemeContext);
  const { isPro, usage, coins } = usePlan();
  const { cartOpen, setCartOpen } = useCart();

  const [activeTab, setActiveTab]         = useState('home');
  const [results, setResults]             = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImage, setUploadedImage]   = useState(null);
  const [currentGender, setCurrentGender]   = useState(localStorage.getItem('sg_gender_pref') || 'male');
  const [lastAnalysis, setLastAnalysis]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('sg_last_analysis') || 'null'); } catch { return null; }
  });
  const [toast, setToast] = useState(null);

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
    setToast({ message: 'Analysis complete! ✨', type: 'success' });
    try {
      if (auth.currentUser) {
        await saveHistory(auth.currentUser.uid, data);
        await saveProfile(auth.currentUser.uid, data);
      }
    } catch (e) { console.warn('Save failed:', e); }
    logEvent(EVENTS.ANALYSIS_COMPLETE);
  }, []);

  const handleReset = useCallback(() => {
    setResults(null);
    setError(null);
    setUploadedImage(null);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    ['sg_last_analysis','sg_analysis_count','sg_streak_count','sg_last_checkin',
     'sg_daily_drop_date','sg_analysis_history','sg_saved_colors','sg_wardrobe_queue'
    ].forEach(k => localStorage.removeItem(k));
    onLogout();
  }, [onLogout]);

  const avatarLetter = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase();

  // ── Desktop nav tabs ──
  const desktopTabs = [
    { id: 'home',      label: 'Home' },
    { id: 'analyze',   label: 'Analyze' },
    { id: 'history',   label: 'History' },
    { id: 'wardrobe',  label: 'Wardrobe' },
    { id: 'navigator', label: 'Navigator' },
    { id: 'tools',     label: 'Tools' },
  ];

  // ── Mobile bottom nav tabs ──
  const mobileTabs = [
    { id: 'home',      icon: '🏠', label: 'Home' },
    { id: 'analyze',   icon: '📷', label: 'Analyze' },
    { id: 'history',   icon: '📋', label: 'History' },
    { id: 'wardrobe',  icon: '👗', label: 'Wardrobe' },
    { id: 'tools',     icon: '⚙️', label: 'Tools' },
  ];

  return (
    <div style={{ background: C.bg, color: C.text, minHeight:'100vh', fontFamily:"'Inter','DM Sans',sans-serif" }}>

      {/* ════════════════════════════════════════════════
          NAVBAR — Desktop shows full nav, mobile shows logo+avatar only
          ════════════════════════════════════════════════ */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        height:60, display:'flex', alignItems:'center',
        borderBottom:`1px solid ${C.borderSoft}`,
        background:'rgba(12,12,12,0.96)',
        backdropFilter:'blur(20px)',
        padding:'0 20px', gap:16,
      }}>
        {/* Logo */}
        <button
          onClick={() => handleTabChange('home')}
          style={{ display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer', padding:0, flexShrink:0 }}
        >
          <div style={{ width:30, height:30, background:C.gold, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:'10px', fontWeight:700, color:'#0A0A0A', letterSpacing:'0.05em' }}>SG</span>
          </div>
          <span className="hidden sm:inline" style={{ fontSize:'12px', fontWeight:500, color:C.text, letterSpacing:'0.08em', textTransform:'uppercase' }}>
            StyleGuru AI
          </span>
        </button>

        {/* Desktop center tabs */}
        <div className="hidden md:flex" style={{ flex:1, justifyContent:'center', gap:0 }}>
          {desktopTabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  background:'none', border:'none', cursor:'pointer',
                  padding:'0 14px', height:60,
                  fontSize:'10px', fontWeight:500,
                  letterSpacing:'0.12em', textTransform:'uppercase',
                  color: active ? C.gold : C.muted,
                  borderBottom: active ? `2px solid ${C.gold}` : '2px solid transparent',
                  transition:'all 0.2s', fontFamily:"'Inter',sans-serif",
                  position:'relative',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.text; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.muted; }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right side — always visible */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginLeft:'auto' }}>
          {/* Profile avatar button */}
          <button
            onClick={() => handleTabChange('profile')}
            style={{
              width:34, height:34, background: activeTab === 'profile' ? C.gold : C.surface2,
              color: activeTab === 'profile' ? '#0A0A0A' : C.text,
              border:`1px solid ${C.border}`, borderRadius:0,
              fontSize:'12px', fontWeight:700, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all 0.2s', fontFamily:"'Inter',sans-serif",
            }}
            title="Profile"
          >
            {avatarLetter}
          </button>

          {/* Sign out — desktop only */}
          <button
            className="hidden md:flex"
            onClick={handleLogout}
            style={{
              alignItems:'center', background:'none',
              border:`1px solid ${C.borderSoft}`, color:C.muted,
              fontSize:'10px', letterSpacing:'0.12em', textTransform:'uppercase',
              padding:'8px 16px', cursor:'pointer', transition:'all 0.2s',
              fontFamily:"'Inter',sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderSoft; e.currentTarget.style.color = C.muted; }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════
          MAIN CONTENT
          ════════════════════════════════════════════════ */}
      <main style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '76px 16px 96px',
      }}>
        <Suspense fallback={<SectionLoader />}>

          {/* HOME */}
          {activeTab === 'home' && (
            <HomeSection
              key="home"
              user={user}
              lastAnalysis={lastAnalysis}
              onAnalyze={() => handleTabChange('analyze')}
              onTabChange={handleTabChange}
            />
          )}

          {/* ANALYZE */}
          {activeTab === 'analyze' && (
            <div key="analyze" style={{ animation:'fadeSlideIn 0.3s ease' }}>
              <SectionHeader
                label="AI Skin Analysis"
                title={results ? 'Your Style Profile' : 'Upload a Photo'}
                action={results && (
                  <button
                    onClick={handleReset}
                    style={{ background:'none', border:`1px solid ${C.border}`, color:C.muted, padding:'8px 16px', fontSize:'10px', letterSpacing:'0.15em', textTransform:'uppercase', cursor:'pointer', fontFamily:"'Inter',sans-serif", transition:'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
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
                  isPro={isPro}
                  usage={usage}
                  coins={coins}
                  onCoinEmpty={() => {}}
                />
              )}

              {loading && <LoadingScreenWithProgress progress={uploadProgress} />}

              {error && !loading && (
                <div style={{ padding:32, border:`1px solid rgba(239,68,68,0.25)`, background:'rgba(239,68,68,0.04)', textAlign:'center' }}>
                  <p style={{ fontSize:'36px', marginBottom:12 }}>😕</p>
                  <p style={{ color:'#EF4444', fontSize:'14px', marginBottom:20, lineHeight:'1.6', fontFamily:"'Inter',sans-serif" }}>{error}</p>
                  <button
                    onClick={handleReset}
                    style={{ background:'none', border:'1px solid rgba(239,68,68,0.4)', color:'#EF4444', padding:'12px 28px', cursor:'pointer', fontSize:'11px', letterSpacing:'0.15em', textTransform:'uppercase', fontFamily:"'Inter',sans-serif", transition:'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
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

          {/* HISTORY */}
          {activeTab === 'history' && (
            <div key="history" style={{ animation:'fadeSlideIn 0.3s ease' }}>
              <SectionHeader label="Your Archive" title="Analysis History" />
              <HistoryPanel onShowResult={(data) => { setResults(data); handleTabChange('analyze'); }} />
            </div>
          )}

          {/* WARDROBE */}
          {activeTab === 'wardrobe' && (
            <div key="wardrobe" style={{ animation:'fadeSlideIn 0.3s ease' }}>
              <SectionHeader label="Style Vault" title="Your Wardrobe" />
              <WardrobePanel
                onShowResult={(data) => { setResults(data); handleTabChange('analyze'); }}
                gender={currentGender}
              />
            </div>
          )}

          {/* NAVIGATOR */}
          {activeTab === 'navigator' && (
            <div key="navigator" style={{ animation:'fadeSlideIn 0.3s ease' }}>
              <SectionHeader label="Style Intelligence" title="Style Navigator" />
              <StyleNavigator user={user} onAnalyze={() => handleTabChange('analyze')} />
            </div>
          )}

          {/* TOOLS */}
          {activeTab === 'tools' && (
            <div key="tools" style={{ animation:'fadeSlideIn 0.3s ease' }}>
              <SectionHeader label="Power Tools" title="Style Tools" />
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
              key="scanner"
              savedPalette={(() => {
                try { return lastAnalysis?.fullData?.recommendations?.best_shirt_colors || lastAnalysis?.fullData?.recommendations?.best_dress_colors || []; } catch { return []; }
              })()}
              skinTone={lastAnalysis?.skinTone || ''}
              onClose={() => handleTabChange('home')}
            />
          )}

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div key="profile" style={{ animation:'fadeSlideIn 0.3s ease' }}>
              <SectionHeader label="Your Account" title="Profile" />

              {/* User card */}
              <div style={{ padding:'24px', background: C.surface, border:`1px solid ${C.border}`, marginBottom:20, display:'flex', alignItems:'center', gap:20 }}>
                <div style={{ width:56, height:56, background:C.gold, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:'20px', fontWeight:700, color:'#0A0A0A', fontFamily:"'Inter',sans-serif" }}>{avatarLetter}</span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:'16px', fontFamily:"'Playfair Display',serif", color:C.text, margin:'0 0 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name || 'User'}</p>
                  <p style={{ fontSize:'12px', color:C.muted, fontFamily:"'Inter',sans-serif", margin:0, overflow:'hidden', textOverflow:'ellipsis' }}>{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  style={{ flexShrink:0, background:'none', border:`1px solid ${C.border}`, color:C.muted, padding:'10px 18px', fontSize:'10px', letterSpacing:'0.15em', textTransform:'uppercase', cursor:'pointer', fontFamily:"'Inter',sans-serif", transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
                >
                  Sign Out
                </button>
              </div>

              <ProfilePanel hideHeader onOpenUpgrade={() => {}} />
            </div>
          )}

        </Suspense>
      </main>

      {/* ════════════════════════════════════════════════
          MOBILE BOTTOM NAV — md:hidden (not shown on desktop)
          ════════════════════════════════════════════════ */}
      <nav
        className="md:hidden"
        style={{
          position:'fixed', bottom:0, left:0, right:0, zIndex:200,
          background:'rgba(12,12,12,0.98)',
          borderTop:`1px solid ${C.borderSoft}`,
          backdropFilter:'blur(24px)',
          display:'flex',
          paddingBottom:'env(safe-area-inset-bottom, 4px)',
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
                position:'relative', transition:'opacity 0.15s',
              }}
            >
              {/* Active indicator */}
              {active && (
                <div style={{ position:'absolute', top:0, left:'25%', right:'25%', height:2, background:C.gold }} />
              )}
              <span style={{ fontSize:'19px', lineHeight:1, opacity: active ? 1 : 0.4, transition:'opacity 0.15s' }}>
                {item.icon}
              </span>
              <span style={{
                fontSize:'8px', letterSpacing:'0.06em', textTransform:'uppercase',
                color: active ? C.gold : C.subtle, fontWeight: active ? 600 : 400,
                fontFamily:"'Inter',sans-serif", transition:'color 0.15s',
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Global AI Assistant */}
      <StyleBot />

      {/* Toast notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Shopping Cart */}
      <ShoppingCart isOpen={cartOpen} onClose={() => setCartOpen(false)} isDark />
    </div>
  );
}
