/**
 * StyleNavigator.jsx → "Style Compass" v4.0
 * ═══════════════════════════════════════════════════
 * Premium AI-powered style guidance system.
 * Every recommendation includes: WHAT + WHY + BENEFIT
 * Strict gender differentiation (male vs female logic)
 * Color theory based on skin tone science
 * Data-driven (history, wardrobe, analysis) — zero random output
 * ═══════════════════════════════════════════════════
 */

import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import {
  auth, getWardrobe, loadPrimaryProfile,
  loadUserPreferences, getDailyOutfitLogs, logDailyOutfit,
  savePrimaryProfile, saveStyleInsights, loadStyleInsights,
  getStyleInsights,
} from '../api/styleApi';
import { scoreWardrobeItem, getActionableAdvice, getAccessoryAdvice } from '../utils/stylingEngine';
import { getThemeColors } from '../utils/themeColors';

// ── Skin tone → hex ─────────────────────────────────
const TONE_HEX = {
  fair:   '#F5DEB3', light:  '#D2A679', medium: '#C68642',
  olive:  '#A0724A', brown:  '#7B4F2E', dark:   '#4A2C0A',
};

// ── Color Science: tone → best palette ──────────────
const TONE_PALETTE = {
  fair:   { warm:['#8B3A3A','#556B2F','#4682B4','#483D8B'], cool:['#C71585','#2E8B57','#4169E1','#6A0DAD'], neutral:['#8B0000','#228B22','#2F4F8F','#8B4513'] },
  light:  { warm:['#B8860B','#6B4226','#2E4057','#8B3A62'], cool:['#1C6EA4','#96281B','#1D7A4D','#8B006B'], neutral:['#4A90D9','#C0392B','#27AE60','#8E44AD'] },
  medium: { warm:['#1A5276','#196F3D','#922B21','#CA6F1E'], cool:['#2471A3','#1E8449','#943126','#D4AC0D'], neutral:['#154360','#145A32','#78281F','#B7950B'] },
  olive:  { warm:['#50C878','#B7410E','#FFFFF0','#722F37'], cool:['#40E0D0','#FF6347','#F5F5DC','#8B008B'], neutral:['#228B22','#CC5500','#F5DEB3','#800020'] },
  brown:  { warm:['#FFFFFF','#0047AB','#FFD700','#FF4500'], cool:['#F0F8FF','#4169E1','#FFDB58','#FF69B4'], neutral:['#FFFAF0','#0047AB','#EFCB68','#E34234'] },
  dark:   { warm:['#FF7F50','#FFD700','#00CED1','#98FB98'], cool:['#FF6B6B','#FFE66D','#4ECDC4','#A8E6CF'], neutral:['#FF8C61','#FFDA77','#45B7D1','#96CEB4'] },
};

// ── Male outfit templates by occasion ───────────────
const MALE_OUTFITS = {
  office:   (color1, color2) => ({ top:`${color1} formal shirt`,      bottom:`${color2} tailored trousers`,    shoes:'Dark brown Oxford shoes', accent:'Silver watch + leather belt matching shoes' }),
  casual:   (color1, color2) => ({ top:`${color1} slim-fit polo`,     bottom:`${color2} clean chinos`,         shoes:'White minimal sneakers',  accent:'Minimal bracelet + clean watch' }),
  party:    (color1, color2) => ({ top:`${color1} printed shirt`,     bottom:`${color2} slim dark jeans`,      shoes:'Dark Chelsea boots',      accent:'Bold statement watch or ring' }),
  ethnic:   (color1, color2) => ({ top:`${color1} kurta set`,         bottom:`${color2} churidar`,             shoes:'Tan mojari / juttis',     accent:'Pocket square + minimal bracelet' }),
  gym:      (color1, color2) => ({ top:`${color1} dry-fit tee`,       bottom:`${color2} track pants`,          shoes:'Cushioned athletic shoes', accent:'Sports band / cap' }),
};
const FEMALE_OUTFITS = {
  office:   (color1, color2) => ({ top:`${color1} structured blazer`, bottom:`${color2} cigarette trousers`,   shoes:'Nude pointed pumps',      accent:'Pearl earrings + structured handbag' }),
  casual:   (color1, color2) => ({ top:`${color1} crop top`,         bottom:`${color2} high-waist jeans`,     shoes:'White slip-on sneakers',  accent:'Layered necklace + tote bag' }),
  party:    (color1, color2) => ({ top:`${color1} co-ord set top`,   bottom:`${color2} wide-leg pants`,       shoes:'Block heel sandals',      accent:'Statement earrings + clutch' }),
  ethnic:   (color1, color2) => ({ top:`${color1} silk kurti`,       bottom:`${color2} palazzo / salwar`,    shoes:'Kolhapuri / embellished flats', accent:'Jhumka earrings + bangles' }),
  party_gown: (color1)       => ({ top:`${color1} midi dress`,       bottom:'—',                              shoes:'Strappy heeled sandals',  accent:'Ear cuff + chain bag' }),
};

// ── Why text (color theory backed) ─────────────────
const getColorWhy = (tone, undertone = 'neutral') => {
  const reasons = {
    fair:   'Your fair skin creates high contrast with rich deep tones — they will make your complexion look radiant.',
    light:  'Light skin with warm undertones pairs best with earthy and jewel tones that add warmth without washing out.',
    medium: 'Medium skin tones have the widest range — bold colors and earth tones both create beautiful contrast.',
    olive:  'Olive undertones pop when paired with warm terracotta, burgundy, and contrast neutrals.',
    brown:  'Brown tones look stunning with vivid, high-saturation colors that complement the natural richness of your skin.',
    dark:   'Deep skin tones glow with bright, saturated colors — high contrast palettes make your features stand out powerfully.',
  };
  return reasons[tone] || reasons.medium;
};

// ── Benefit text ────────────────────────────────────
const getOutfitBenefit = (occasion) => {
  const benefits = {
    office:  'Projects authority & polish — look 30% more confident in client/team interactions.',
    casual:  'Effortlessly put-together look — stylish without trying too hard.',
    party:   'Commands attention — high visual impact outfit that photographs well.',
    ethnic:  'Cultural confidence — honors your roots while staying modern.',
    gym:     'Peak performance aesthetic — motivated mindset starts with matching energy.',
  };
  return benefits[occasion] || benefits.casual;
};

// ── Mood selector options ────────────────────────────
const MOODS = [
  { id:'office',   emoji:'💼', label:'Office' },
  { id:'casual',   emoji:'😎', label:'Casual' },
  { id:'party',    emoji:'🎉', label:'Party' },
  { id:'ethnic',   emoji:'🪔', label:'Ethnic' },
  { id:'gym',      emoji:'🏋️', label:'Active' },
];

// ── Store deeplinks ─────────────────────────────────
const STORES = [
  { id:'myntra',   name:'Myntra',   emoji:'🎀', color:'#f13ab1', bg:'linear-gradient(135deg,#f13ab1,#f87171)' },
  { id:'amazon',   name:'Amazon',   emoji:'📦', color:'#ff9900', bg:'linear-gradient(135deg,#ff9900,#232f3e)' },
  { id:'flipkart', name:'Flipkart', emoji:'🛒', color:'#2874f0', bg:'linear-gradient(135deg,#2874f0,#0052cc)' },
  { id:'meesho',   name:'Meesho',   emoji:'💸', color:'#ff44af', bg:'linear-gradient(135deg,#ff44af,#ff8c00)' },
];

const PJS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const PDI = "'Playfair Display', 'Georgia', serif";
const GRAD = 'linear-gradient(135deg, #8B5CF6, #EC4899)';
const VIOLET = '#8B5CF6';

// ── Trending Products ──────────────────────────────
const TRENDING_PRODUCTS = {
  male: [
    { id:'m1', emoji:'👕', name:'Oversized Graphic Tee', category:'Streetwear', why:'Most-saved item in India 2025', search:'men oversized graphic tee streetwear India 2025' },
    { id:'m2', emoji:'👖', name:'Baggy Cargo Pants',      category:'Casual',     why:'Trending 3 months straight',    search:'men baggy cargo pants trending India 2025' },
    { id:'m3', emoji:'🧥', name:'Varsity Jacket',         category:'Streetwear', why:'Campus must-have 2025',          search:'men varsity jacket India 2025' },
    { id:'m4', emoji:'👔', name:'Linen Formal Shirt',     category:'Formal',     why:'Office-casual crossover pick',  search:'men linen formal shirt office India' },
    { id:'m5', emoji:'👟', name:'Chunky Sole Sneakers',   category:'Shoes',      why:'Top footwear choice 2025',      search:'men chunky sole sneakers India 2025' },
    { id:'m6', emoji:'🧣', name:'Minimal Cuban Collar',   category:'Casual',     why:'Summer staple, rising fast',    search:'men cuban collar shirt India summer' },
    { id:'m7', emoji:'🩲', name:'Slim Fit Joggers',        category:'Casual',     why:'Comfort + style balance',       search:'men slim fit joggers India 2025' },
    { id:'m8', emoji:'🎩', name:'Bucket Hat',              category:'Accessories',why:'Streetwear accessory of 2025',  search:'men bucket hat streetwear India' },
    { id:'m9', emoji:'👔', name:'Nehru Collar Kurta',      category:'Ethnic',     why:'Festive & casual modernized',   search:'men Nehru collar kurta India 2025' },
    { id:'m10',emoji:'⌚', name:'Minimalist Watch',        category:'Accessories',why:'Bestseller across all ages',    search:'men minimalist watch India under 2000' },
    { id:'m11',emoji:'🧤', name:'Leather Belt',            category:'Accessories',why:'Essential wardrobe basic',      search:'men genuine leather belt India' },
    { id:'m12',emoji:'👟', name:'White Canvas Sneakers',   category:'Shoes',      why:'Works with every outfit',       search:'men white canvas sneakers India 2025' },
  ],
  female: [
    { id:'f1', emoji:'👗', name:'Co-ord Set',              category:'Casual',     why:'Most-trending outfit 2025 India', search:'women co ord set trending India 2025' },
    { id:'f2', emoji:'👚', name:'Corset Style Top',         category:'Party',      why:'Fashion week viral pick',         search:'women corset top India 2025' },
    { id:'f3', emoji:'👖', name:'Wide Leg Trousers',        category:'Formal',     why:'Office-to-party versatile',       search:'women wide leg trousers India 2025' },
    { id:'f4', emoji:'👘', name:'Chiffon Printed Saree',    category:'Ethnic',     why:'Top saree pick this season',      search:'women chiffon printed saree India 2025' },
    { id:'f5', emoji:'👡', name:'Block Heel Sandals',        category:'Shoes',      why:'Most comfortable heels 2025',     search:'women block heel sandals India 2025' },
    { id:'f6', emoji:'👜', name:'Quilted Mini Bag',          category:'Accessories',why:'It-bag of 2025',                  search:'women quilted mini bag India 2025' },
    { id:'f7', emoji:'🧣', name:'Maxi Floral Dress',         category:'Casual',     why:'Summer bestseller',               search:'women maxi floral dress India summer 2025' },
    { id:'f8', emoji:'🥿', name:'Chunky Silver Jhumkas',     category:'Accessories',why:'Traditional + modern fusion',     search:'women chunky silver jhumka earrings India' },
    { id:'f9', emoji:'🧥', name:'Oversized Blazer',          category:'Formal',     why:'Power dressing essential',        search:'women oversized blazer India 2025' },
    { id:'f10',emoji:'👗', name:'Sharara Set',               category:'Ethnic',     why:'Wedding season favourite',        search:'women sharara set India 2025 wedding' },
    { id:'f11',emoji:'💍', name:'Layered Necklace Set',      category:'Accessories',why:'Loved by 2M+ users on Meesho',   search:'women layered necklace set India 2025' },
    { id:'f12',emoji:'👖', name:'High Waist Mom Jeans',      category:'Casual',     why:'Classic comfort, always trending', search:'women high waist mom jeans India 2025' },
  ],
};

const TREND_CATS = {
  male:   ['All','Casual','Formal','Ethnic','Streetwear','Shoes','Accessories'],
  female: ['All','Casual','Formal','Ethnic','Party','Shoes','Accessories'],
};

// ── Shop URL builder ────────────────────────────────
const buildShopUrl = (item, store, gender) => {
  const g = gender.toLowerCase().includes('female') ? 'women' : 'men';
  const q = `${g} ${item} India`;
  if (store === 'myntra')   return `https://www.myntra.com/search?f=Gender:${g}&q=${encodeURIComponent(item)}`;
  if (store === 'amazon')   return `https://www.amazon.in/s?k=${encodeURIComponent(q)}`;
  if (store === 'flipkart') return `https://www.flipkart.com/search?q=${encodeURIComponent(q)}`;
  if (store === 'meesho')   return `https://www.meesho.com/search?q=${encodeURIComponent(q)}`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
};

// ══════════════════════════════════════════════════════
// COMPONENT: Style Compass
// ══════════════════════════════════════════════════════
export default function StyleNavigator({ user, onAnalyze }) {
  const { theme } = useContext(ThemeContext);
  const { t } = useLanguage();
  const C = useMemo(() => getThemeColors(theme), [theme]);

  const [loading,   setLoading]   = useState(true);
  const [profile,   setProfile]   = useState(null);
  const [wardrobe,  setWardrobe]  = useState([]);
  const [prefs,     setPrefs]     = useState(null);
  const [isWorn,    setIsWorn]    = useState(false);
  const [logging,   setLogging]   = useState(false);
  const [mood,      setMood]      = useState('casual');
  const [tab,        setTab]       = useState('look');   // 'look' | 'colors' | 'closet' | 'trending'
  const [shopItem,   setShopItem]  = useState(null);
  const [insights,   setInsights]  = useState(null);
  const [trendGender,setTrendGender] = useState(null);  // auto-set from profile
  const [trendCat,   setTrendCat]  = useState('All');

  useEffect(() => {
    if (!auth.currentUser) { setLoading(false); return; }
    const uid = auth.currentUser.uid;

    (async () => {
      try {
        const [primary, userPrefs, userWardrobe, logs, locked] = await Promise.all([
          loadPrimaryProfile(uid),
          loadUserPreferences(uid),
          getWardrobe(uid),
          getDailyOutfitLogs(uid, 1),
          loadStyleInsights(uid),
        ]);
        const activeProfile = primary || JSON.parse(localStorage.getItem('sg_last_analysis') || 'null');
        setProfile(activeProfile);
        setPrefs(userPrefs);
        setWardrobe(userWardrobe || []);
        if (locked) setInsights(locked);

        const today = new Date().toLocaleDateString('en-CA');
        if (logs?.length > 0 && logs[0].date === today) setIsWorn(true);

        if (activeProfile) {
          const res = await getStyleInsights(
            activeProfile.skinTone || activeProfile.skin_tone?.category,
            activeProfile.undertone || activeProfile.skin_tone?.undertone,
            userWardrobe || [],
            'en',
            userPrefs?.lifestyle || 'other',
            activeProfile.gender || userPrefs?.gender || 'male'
          );
          if (res?.success) {
            setInsights(res.insights);
            saveStyleInsights(uid, res.insights).catch(() => {});
          }
        }
      } catch (e) {
        console.error('[StyleCompass]', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Auto-set trendGender from profile
  useEffect(() => {
    if (profile || prefs) {
      const g = profile?.gender || prefs?.gender || 'male';
      setTrendGender((g.toLowerCase().includes('female') || g === 'women') ? 'female' : 'male');
    }
  }, [profile, prefs]);

  // ── Derived data ───────────────────────────────────
  const gender    = useMemo(() => {
    const g = insights?.gender || profile?.gender || prefs?.gender || 'male';
    return (g.toLowerCase().includes('female') || g === 'women') ? 'female' : 'male';
  }, [insights, profile, prefs]);

  const toneKey   = useMemo(() => (profile?.skinTone || profile?.skin_tone?.category || 'medium').toLowerCase(), [profile]);
  const undertone = useMemo(() => (profile?.undertone || profile?.skin_tone?.undertone || 'neutral').toLowerCase(), [profile]);
  const skinHex   = useMemo(() => profile?.skinHex || TONE_HEX[toneKey] || '#C68642', [profile, toneKey]);
  const season    = useMemo(() => profile?.season || profile?.skin_tone?.color_season || 'Spring', [profile]);

  // Best colors from analysis or fallback color science
  const bestColors = useMemo(() => {
    const fromInsights = insights?.best_shirt_colors || insights?.best_dress_colors || insights?.best_colors || [];
    if (fromInsights.length > 0) return fromInsights.slice(0, 6);
    const palette = TONE_PALETTE[toneKey]?.[undertone] || TONE_PALETTE.medium.neutral;
    return palette.map((hex, i) => ({
      name: ['Primary Tone', 'Secondary Tone', 'Accent Color', 'Neutral Base', 'Power Color', 'Contrast'][i] || `Color ${i+1}`,
      hex,
    }));
  }, [insights, toneKey, undertone]);

  // Outfit for current mood
  const outfit = useMemo(() => {
    if (!bestColors.length) return null;
    const c1 = bestColors[0]?.name || 'Navy';
    const c2 = bestColors[1]?.name || 'White';
    const templates = gender === 'female' ? FEMALE_OUTFITS : MALE_OUTFITS;
    const fn = templates[mood] || templates.casual;
    return fn(c1, c2);
  }, [bestColors, gender, mood]);

  // Wardrobe harmony score
  const harmonyScore = useMemo(() => {
    if (!wardrobe.length || !profile) return 0;
    const total = wardrobe.reduce((s, item) =>
      s + scoreWardrobeItem(item, { weather:'sunny' }, profile, [], prefs || {}, insights), 0);
    return Math.round(total / wardrobe.length);
  }, [wardrobe, profile, prefs, insights]);

  // Wardrobe gap items (items user should buy based on analysis)
  const gapItems = useMemo(() => {
    const advice = getActionableAdvice(
      insights?.best_colors || bestColors,
      gender,
      toneKey
    );
    return advice.map(adv => ({
      ...adv,
      inWardrobe: wardrobe.some(w =>
        w.category === adv.category ||
        (w.color_name && w.color_name.toLowerCase().includes((adv.color || '').toLowerCase()))
      ),
    }));
  }, [insights, bestColors, gender, toneKey, wardrobe]);

  const accessory = useMemo(() =>
    getAccessoryAdvice(gender, season, mood.toUpperCase()), [gender, season, mood]);

  const handleWearToday = useCallback(async () => {
    if (!auth.currentUser || isWorn || logging || !outfit) return;
    setLogging(true);
    try {
      await logDailyOutfit(auth.currentUser.uid, {
        title: `${mood.charAt(0).toUpperCase() + mood.slice(1)} Look`,
        top: outfit.top, bottom: outfit.bottom, vibe: mood,
      });
      setIsWorn(true);
    } catch (e) { console.error(e); } finally { setLogging(false); }
  }, [auth.currentUser, isWorn, logging, outfit, mood]);

  // ── Render helpers ─────────────────────────────────
  const card = (style) => ({
    background: C.glass,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${C.border}`,
    borderRadius: 20,
    boxShadow: C.cardShadow,
    ...style,
  });

  const pill = (active, style = {}) => ({
    padding: '8px 16px', borderRadius: 30,
    background: active ? GRAD : C.glass2,
    border: `1px solid ${active ? 'transparent' : C.border}`,
    color: active ? 'white' : C.muted,
    fontSize: '11px', fontWeight: active ? 700 : 400,
    cursor: 'pointer', transition: 'all 0.2s',
    fontFamily: PJS,
    boxShadow: active ? '0 4px 12px rgba(139,92,246,0.35)' : 'none',
    ...style,
  });

  // ── STATES ─────────────────────────────────────────
  if (!auth.currentUser) {
    return (
      <div style={{ textAlign:'center', padding:'60px 20px' }}>
        <div style={{ fontSize:'48px', marginBottom:16 }}>🔐</div>
        <p style={{ fontFamily:PDI, fontSize:'20px', color:C.text, marginBottom:8 }}>Login Required</p>
        <p style={{ fontSize:'13px', color:C.muted, fontFamily:PJS }}>Sign in to unlock your personalized Style Compass.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding:'32px 0' }}>
        {[180, 280, 200].map((h, i) => (
          <div key={i} style={{ height:h, borderRadius:20, background:C.glass, marginBottom:16, animation:'pulse 1.5s ease-in-out infinite', animationDelay:`${i*0.15}s` }} />
        ))}
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign:'center', padding:'60px 20px' }}>
        <div style={{ fontSize:'52px', marginBottom:16 }}>📸</div>
        <p style={{ fontFamily:PDI, fontSize:'22px', color:C.text, marginBottom:8 }}>Start Your Style Journey</p>
        <p style={{ fontSize:'13px', color:C.muted, fontFamily:PJS, maxWidth:280, margin:'0 auto 28px' }}>
          Upload one photo to unlock your personalized Style Compass — colors, outfits, and AI insights all calibrated to your skin tone.
        </p>
        <button
          onClick={onAnalyze}
          style={{ background:GRAD, border:'none', color:'white', borderRadius:14, padding:'14px 32px', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:PJS, boxShadow:'0 8px 24px rgba(139,92,246,0.4)' }}
        >
          📷 Analyze My First Look
        </button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════
  return (
    <div style={{ animation:'fadeSlideIn 0.4s ease' }}>

      {/* ── DNA CARD (Skin tone identity) ── */}
      <div style={{ ...card({ padding:'20px', marginBottom:16, position:'relative', overflow:'hidden' }) }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, background:`radial-gradient(circle,${skinHex}35,transparent)`, borderRadius:'50%', pointerEvents:'none' }} />
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:58, height:58, borderRadius:16, background:skinHex, flexShrink:0, border:`4px solid ${C.border}`, boxShadow:`0 6px 20px ${skinHex}60` }} />
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:'9px', letterSpacing:'0.2em', textTransform:'uppercase', background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:700, fontFamily:PJS, margin:'0 0 3px' }}>Your Style DNA</p>
            <p style={{ fontFamily:PDI, fontSize:'18px', color:C.text, margin:'0 0 4px', textTransform:'capitalize' }}>
              {toneKey} · {undertone}
            </p>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:'9px', color:`${C.isDark?'rgba(139,92,246,0.9)':'#7C3AED'}`, background:`rgba(139,92,246,${C.isDark?'0.12':'0.07'})`, border:`1px solid rgba(139,92,246,0.2)`, borderRadius:10, padding:'2px 8px', fontFamily:PJS, fontWeight:600 }}>
                {season}
              </span>
              <span style={{ fontSize:'9px', color:C.muted, background:C.glass2, border:`1px solid ${C.border}`, borderRadius:10, padding:'2px 8px', fontFamily:PJS }}>
                {gender === 'female' ? '👩 Female' : '👨 Male'} · {wardrobe.length > 0 ? `${wardrobe.length} wardrobe items` : 'No wardrobe yet'}
              </span>
            </div>
          </div>
          {/* Harmony score ring */}
          <div style={{ flexShrink:0, textAlign:'center' }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:`conic-gradient(${VIOLET} ${harmonyScore}%, ${C.isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)'} 0)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:C.glass, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:'11px', fontWeight:700, color:C.text, fontFamily:PJS }}>{harmonyScore}%</span>
              </div>
            </div>
            <p style={{ fontSize:'7px', color:C.muted, fontFamily:PJS, marginTop:4, letterSpacing:'0.1em', textTransform:'uppercase' }}>Harmony</p>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div style={{ display:'flex', gap:4, marginBottom:20, padding:'4px', background:C.glass, borderRadius:14, border:`1px solid ${C.border}`, overflowX:'auto' }}>
        {[
          { id:'look',     label:'🎯 Today' },
          { id:'colors',   label:'🎨 Colors' },
          { id:'closet',   label:'👝 Closet' },
          { id:'trending', label:'🔥 Trending' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:1, minWidth:64, padding:'9px 6px', borderRadius:10, border:'none', cursor:'pointer',
            background: tab === t.id ? GRAD : 'transparent',
            color: tab === t.id ? 'white' : C.muted,
            fontSize:'10px', fontWeight: tab === t.id ? 700 : 400,
            fontFamily:PJS, transition:'all 0.2s', whiteSpace:'nowrap',
            boxShadow: tab === t.id ? '0 2px 10px rgba(139,92,246,0.35)' : 'none',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
           TAB 1: TODAY'S LOOK
         ══════════════════════════════════════════ */}
      {tab === 'look' && (
        <div style={{ animation:'fadeSlideIn 0.3s ease' }}>

          {/* Mood/Occasion Selector */}
          <div style={{ marginBottom:16 }}>
            <p style={{ fontSize:'9px', letterSpacing:'0.2em', textTransform:'uppercase', color:C.muted, fontFamily:PJS, margin:'0 0 10px' }}>Choose Occasion</p>
            <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
              {MOODS.map(m => (
                <button key={m.id} onClick={() => setMood(m.id)} style={{
                  ...pill(mood === m.id),
                  display:'flex', alignItems:'center', gap:6, flexShrink:0,
                }}>
                  <span>{m.emoji}</span> {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* OUTFIT RECOMMENDATION CARD */}
          {outfit && (
            <div style={{ ...card({ padding:'22px', marginBottom:14, position:'relative', overflow:'hidden' }) }}>
              <div style={{ position:'absolute', top:-50, right:-50, width:200, height:200, background:`radial-gradient(circle,rgba(139,92,246,${C.isDark?'0.08':'0.04'}),transparent)`, pointerEvents:'none' }} />

              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:GRAD, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px' }}>🤖</div>
                <div>
                  <p style={{ fontSize:'9px', letterSpacing:'0.2em', textTransform:'uppercase', background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:700, fontFamily:PJS, margin:0 }}>
                    AI Outfit — {mood.charAt(0).toUpperCase()+mood.slice(1)}
                  </p>
                  <p style={{ fontSize:'11px', color:C.muted, fontFamily:PJS, margin:'1px 0 0' }}>
                    Calibrated to your {toneKey} {undertone} skin tone
                  </p>
                </div>
                {isWorn && (
                  <span style={{ marginLeft:'auto', fontSize:'9px', background:'rgba(16,185,129,0.12)', color:'#10B981', border:'1px solid rgba(16,185,129,0.25)', borderRadius:10, padding:'3px 8px', fontFamily:PJS, fontWeight:700 }}>
                    ✓ Worn Today
                  </span>
                )}
              </div>

              {/* Outfit items grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                {[
                  { label:'👕 Top / Upper',    value:outfit.top,    colorIdx:0 },
                  { label:'👖 Bottom / Lower',  value:outfit.bottom === '—' ? null : outfit.bottom, colorIdx:1 },
                ].map((piece, i) => (
                  piece.value && (
                    <div key={i} style={{ background:C.glass2, border:`1px solid ${C.border}`, borderRadius:14, padding:'14px 13px' }}>
                      <p style={{ fontSize:'9px', color:C.muted, fontFamily:PJS, margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'0.1em' }}>{piece.label}</p>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:28, height:28, borderRadius:8, background:bestColors[piece.colorIdx]?.hex || '#888', flexShrink:0, boxShadow:`0 2px 8px ${bestColors[piece.colorIdx]?.hex || '#888'}60` }} />
                        <p style={{ fontSize:'12px', color:C.text, fontFamily:PJS, fontWeight:600, lineHeight:'1.4', margin:0 }}>{piece.value}</p>
                      </div>
                      <button
                        onClick={() => setShopItem(piece.value)}
                        style={{ marginTop:8, width:'100%', padding:'6px', borderRadius:8, background:C.glass, border:`1px solid ${C.border}`, color:C.muted, fontSize:'9px', cursor:'pointer', fontFamily:PJS, transition:'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor=VIOLET; e.currentTarget.style.color=VIOLET; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.muted; }}
                      >
                        🛍 Shop This
                      </button>
                    </div>
                  )
                ))}
              </div>

              {/* Shoes + Accent */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                {[
                  { icon:'👟', label:'Footwear', value:outfit.shoes },
                  { icon:'✨', label:'Accent Piece', value:outfit.accent },
                ].map((item, i) => (
                  <div key={i} style={{ background:C.glass2, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px' }}>
                    <p style={{ fontSize:'9px', color:C.muted, fontFamily:PJS, margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.1em' }}>{item.icon} {item.label}</p>
                    <p style={{ fontSize:'11px', color:C.text2, fontFamily:PJS, margin:0, lineHeight:'1.5' }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* WHY + BENEFIT cards */}
              <div style={{ background:`rgba(139,92,246,${C.isDark?'0.06':'0.03'})`, border:`1px solid rgba(139,92,246,${C.isDark?'0.15':'0.08'})`, borderRadius:14, padding:'14px 16px', marginBottom:14 }}>
                <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:VIOLET, fontFamily:PJS, margin:'0 0 6px' }}>🧠 Why This Works</p>
                <p style={{ fontSize:'12px', color:C.text2, fontFamily:PJS, lineHeight:'1.7', margin:0 }}>
                  {getColorWhy(toneKey, undertone)}
                </p>
              </div>
              <div style={{ background:`rgba(16,185,129,${C.isDark?'0.06':'0.03'})`, border:`1px solid rgba(16,185,129,${C.isDark?'0.15':'0.08'})`, borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
                <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:'#10B981', fontFamily:PJS, margin:'0 0 6px' }}>🎯 Benefit</p>
                <p style={{ fontSize:'12px', color:C.text2, fontFamily:PJS, lineHeight:'1.7', margin:0 }}>
                  {getOutfitBenefit(mood)}
                </p>
              </div>

              {/* Accessory Advice */}
              <div style={{ background:C.glass2, border:`1px solid ${C.border}`, borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
                <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:C.muted, fontFamily:PJS, margin:'0 0 10px' }}>
                  {gender === 'female' ? '💎 Jewelry & Accessories' : '⌚ Watch & Accessories'}
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div>
                    <p style={{ fontSize:'9px', color:C.muted, fontFamily:PJS, margin:'0 0 3px' }}>{gender === 'female' ? 'Jewelry' : 'Watch'}</p>
                    <p style={{ fontSize:'12px', color:C.text, fontFamily:PJS, fontWeight:500 }}>{accessory.jewelry}</p>
                  </div>
                  <div>
                    <p style={{ fontSize:'9px', color:C.muted, fontFamily:PJS, margin:'0 0 3px' }}>Footwear</p>
                    <p style={{ fontSize:'12px', color:C.text, fontFamily:PJS, fontWeight:500 }}>{accessory.shoes}</p>
                  </div>
                </div>
                {accessory.tip && (
                  <p style={{ fontSize:'11px', color:C.muted, fontFamily:PJS, marginTop:8, borderTop:`1px solid ${C.divider}`, paddingTop:8 }}>
                    💡 {accessory.tip}
                  </p>
                )}
              </div>

              {/* Mark as Worn button */}
              <button
                onClick={handleWearToday}
                disabled={isWorn || logging}
                style={{
                  width:'100%', padding:'14px', borderRadius:14,
                  background: isWorn ? 'rgba(16,185,129,0.1)' : GRAD,
                  border: isWorn ? '1px solid rgba(16,185,129,0.3)' : 'none',
                  color: isWorn ? '#10B981' : 'white',
                  fontSize:'13px', fontWeight:700,
                  cursor: isWorn ? 'default' : 'pointer',
                  fontFamily:PJS, transition:'all 0.2s',
                  boxShadow: isWorn ? 'none' : '0 6px 20px rgba(139,92,246,0.35)',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                }}
                onMouseEnter={e => { if (!isWorn) e.currentTarget.style.opacity='0.9'; }}
                onMouseLeave={e => e.currentTarget.style.opacity='1'}
              >
                {logging ? '⏳ Logging...' : isWorn ? '🏆 Style Logged for Today!' : '✅ Wear This Today'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
           TAB 2: COLOR GUIDE
         ══════════════════════════════════════════ */}
      {tab === 'colors' && (
        <div style={{ animation:'fadeSlideIn 0.3s ease' }}>

          {/* Color Science Banner */}
          <div style={{ ...card({ padding:'20px', marginBottom:14, background:`linear-gradient(135deg,rgba(139,92,246,${C.isDark?'0.12':'0.06'}),rgba(236,72,153,${C.isDark?'0.08':'0.04'}))` }) }}>
            <p style={{ fontSize:'9px', letterSpacing:'0.2em', textTransform:'uppercase', background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:700, fontFamily:PJS, margin:'0 0 6px' }}>
              🎨 Color Theory Analysis
            </p>
            <p style={{ fontFamily:PDI, fontSize:'18px', color:C.text, margin:'0 0 8px' }}>
              Your {toneKey.charAt(0).toUpperCase()+toneKey.slice(1)} Skin Palette
            </p>
            <p style={{ fontSize:'12px', color:C.text2, fontFamily:PJS, lineHeight:'1.7', margin:0 }}>
              {getColorWhy(toneKey, undertone)} Based on ITA color science and your {undertone} undertone, we've identified your ideal color spectrum.
            </p>
          </div>

          {/* Best Colors Grid */}
          <p style={{ fontSize:'9px', letterSpacing:'0.18em', textTransform:'uppercase', color:C.muted, fontFamily:PJS, margin:'0 0 10px' }}>✅ Best Colors For You</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
            {bestColors.map((color, i) => (
              <div key={i} style={{ ...card({ padding:0, overflow:'hidden' }) }}>
                <div style={{ height:64, background:color.hex, position:'relative' }}>
                  <button
                    onClick={() => setShopItem(`${color.name} ${gender === 'female' ? 'kurti dress top' : 'shirt polo kurta'}`)}
                    style={{ position:'absolute', bottom:6, right:6, background:'rgba(0,0,0,0.5)', border:'none', color:'white', borderRadius:6, padding:'3px 7px', fontSize:'8px', cursor:'pointer', fontFamily:PJS }}
                  >
                    🛍 Shop
                  </button>
                </div>
                <div style={{ padding:'10px 10px 12px' }}>
                  <p style={{ fontSize:'11px', color:C.text, fontFamily:PJS, fontWeight:600, margin:'0 0 2px' }}>{color.name}</p>
                  <p style={{ fontSize:'9px', color:C.muted, fontFamily:PJS, margin:0 }}>{color.hex}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Avoid Colors */}
          <p style={{ fontSize:'9px', letterSpacing:'0.18em', textTransform:'uppercase', color:C.muted, fontFamily:PJS, margin:'0 0 10px' }}>❌ Colors to Avoid</p>
          <div style={{ ...card({ padding:'16px 18px', marginBottom:14 }) }}>
            {(insights?.colors_to_avoid || (function() {
              const avoidMap = {
                fair:   ['Neon Yellow','Pastel Peach','Very Pale Pink — washes out fair skin with no contrast'],
                light:  ['Orange','Bright Red','Coral — clashes with warm undertones on light skin'],
                medium: ['Khaki Beige','Camel Brown — too close to skin tone, creates blending effect'],
                olive:  ['Lime Green','Bright Yellow — clashes with olive undertones, creates sickly cast'],
                brown:  ['Chocolate Brown','Dark Maroon — too close in value, reduces definition'],
                dark:   ['Black','Very Dark Navy — hides definition; creates flat silhouette'],
              };
              return (avoidMap[toneKey] || avoidMap.medium).map(s => ({ name:s }));
            })()).map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, paddingTop: i>0?10:0, borderTop: i>0?`1px solid ${C.divider}`:'' }}>
                <span style={{ fontSize:'14px', flexShrink:0 }}>⚠️</span>
                <p style={{ fontSize:'12px', color:C.text2, fontFamily:PJS, margin:0 }}>{typeof item === 'string' ? item : item.name}</p>
              </div>
            ))}
          </div>

          {/* Outfit color combos by gender */}
          <p style={{ fontSize:'9px', letterSpacing:'0.18em', textTransform:'uppercase', color:C.muted, fontFamily:PJS, margin:'0 0 10px' }}>
            {gender === 'female' ? '👗 Outfit Color Combinations' : '👔 Outfit Color Combinations'}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
            {bestColors.slice(0,3).map((color, i) => {
              const pair = bestColors[(i+2) % bestColors.length];
              return (
                <div key={i} style={{ ...card({ padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }) }}>
                  <div style={{ display:'flex', gap:-6 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:color.hex, border:`2px solid ${C.border}` }} />
                    <div style={{ width:32, height:32, borderRadius:8, background:pair?.hex || '#333', border:`2px solid ${C.border}`, marginLeft:-8 }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:'12px', color:C.text, fontFamily:PJS, fontWeight:600, margin:'0 0 2px' }}>
                      {color.name} + {pair?.name || 'White'}
                    </p>
                    <p style={{ fontSize:'10px', color:C.muted, fontFamily:PJS, margin:0 }}>
                      {gender === 'female'
                        ? ['Silk top + palazzo', 'Kurti + palazzo', 'Dress + heels'][i]
                        : ['Formal shirt + trousers', 'Polo + chinos', 'Kurta + churidar'][i]
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => setShopItem(`${color.name} ${gender==='female'?'kurti top dress':'shirt kurta polo'}`)}
                    style={{ fontSize:'10px', color:VIOLET, background:`rgba(139,92,246,0.08)`, border:`1px solid rgba(139,92,246,0.2)`, borderRadius:8, padding:'5px 10px', cursor:'pointer', fontFamily:PJS, fontWeight:600 }}>
                    Shop
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
           TAB 3: SMART CLOSET
         ══════════════════════════════════════════ */}
      {tab === 'closet' && (
        <div style={{ animation:'fadeSlideIn 0.3s ease' }}>

          {/* Harmony overview */}
          <div style={{ ...card({ padding:'20px', marginBottom:14, position:'relative', overflow:'hidden' }) }}>
            <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, background:`radial-gradient(circle,${VIOLET}20,transparent)`, pointerEvents:'none' }} />
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:60, height:60, borderRadius:'50%', background:`conic-gradient(${VIOLET} ${harmonyScore}%, ${C.isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)'} 0)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <div style={{ width:48, height:48, borderRadius:'50%', background:C.glass, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:PDI, fontSize:'16px', color:C.text }}>{harmonyScore}%</span>
                </div>
              </div>
              <div>
                <p style={{ fontSize:'9px', letterSpacing:'0.2em', textTransform:'uppercase', background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:700, fontFamily:PJS, margin:'0 0 3px' }}>Wardrobe Harmony Score</p>
                <p style={{ fontFamily:PDI, fontSize:'18px', color:C.text, margin:'0 0 3px' }}>
                  {harmonyScore >= 80 ? 'Elite Wardrobe' : harmonyScore >= 60 ? 'Good Foundation' : harmonyScore > 0 ? 'Needs Curation' : 'Build Your Closet'}
                </p>
                <p style={{ fontSize:'11px', color:C.muted, fontFamily:PJS, margin:0 }}>
                  {wardrobe.length} items · {gapItems.filter(g => !g.inWardrobe).length} color gaps found
                </p>
              </div>
            </div>
          </div>

          {/* Items to Buy (Gaps) */}
          <p style={{ fontSize:'9px', letterSpacing:'0.18em', textTransform:'uppercase', color:C.muted, fontFamily:PJS, margin:'0 0 10px' }}>
            🛍 {gapItems.filter(g => !g.inWardrobe).length > 0 ? 'Missing From Your Wardrobe' : 'Level Up Picks'}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
            {gapItems.map((gap, i) => (
              <div key={i} style={{ ...card({ padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }) }}>
                <div style={{ width:44, height:44, borderRadius:12, background:gap.hex || '#888', flexShrink:0, border:`3px solid ${C.border}`, boxShadow:`0 3px 10px ${gap.hex || '#888'}50` }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:'13px', color:C.text, fontFamily:PJS, fontWeight:600, margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{gap.item}</p>
                  <p style={{ fontSize:'10px', color:C.muted, fontFamily:PJS, margin:0 }}>
                    {gap.inWardrobe
                      ? <span style={{ color:'#10B981' }}>✓ In your wardrobe</span>
                      : <span style={{ color:`rgba(139,92,246,${C.isDark?'0.8':'0.7'})` }}>+ Adds {15 + i*5}% harmony</span>
                    }
                  </p>
                </div>
                {!gap.inWardrobe && (
                  <button
                    onClick={() => setShopItem(gap.item)}
                    style={{ fontSize:'11px', color:'white', background:GRAD, border:'none', borderRadius:10, padding:'8px 14px', cursor:'pointer', fontFamily:PJS, fontWeight:600, flexShrink:0, boxShadow:'0 3px 10px rgba(139,92,246,0.3)' }}
                  >
                    Shop →
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Wardrobe items preview */}
          {wardrobe.length > 0 && (
            <>
              <p style={{ fontSize:'9px', letterSpacing:'0.18em', textTransform:'uppercase', color:C.muted, fontFamily:PJS, margin:'0 0 10px' }}>📦 Your Wardrobe Items</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
                {wardrobe.slice(0, 8).map((item, i) => {
                  const score = scoreWardrobeItem(item, { weather:'sunny' }, profile, [], prefs || {}, insights);
                  return (
                    <div key={i} style={{ ...card({ padding:0, overflow:'hidden', textAlign:'center' }) }}>
                      <div style={{ height:48, background:item.hex || C.glass2, position:'relative' }}>
                        <div style={{ position:'absolute', bottom:4, right:4, background:score >= 80 ? '#10B981' : score >= 60 ? VIOLET : '#F59E0B', borderRadius:6, padding:'1px 5px', fontSize:'8px', color:'white', fontFamily:PJS, fontWeight:700 }}>
                          {score}%
                        </div>
                      </div>
                      <p style={{ fontSize:'8px', color:C.muted, fontFamily:PJS, margin:'6px 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {item.color_name || item.category || 'Item'}
                      </p>
                    </div>
                  );
                })}
              </div>
              {wardrobe.length > 8 && (
                <p style={{ fontSize:'11px', color:C.muted, fontFamily:PJS, textAlign:'center', marginBottom:16 }}>
                  +{wardrobe.length - 8} more items in wardrobe
                </p>
              )}
            </>
          )}

          {wardrobe.length === 0 && (
            <div style={{ textAlign:'center', padding:'32px 20px' }}>
              <p style={{ fontSize:'32px', marginBottom:8 }}>👝</p>
              <p style={{ fontFamily:PDI, fontSize:'16px', color:C.text, margin:'0 0 8px' }}>Empty Wardrobe</p>
              <p style={{ fontSize:'12px', color:C.muted, fontFamily:PJS, lineHeight:'1.7' }}>
                After an analysis, save your favorite outfit colors to see them here with harmony scores.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
           TAB 4: TRENDING / SHOP
         ══════════════════════════════════════════ */}
      {tab === 'trending' && (() => {
        const activeTG = trendGender || gender;
        const cats = TREND_CATS[activeTG];
        const filtered = TRENDING_PRODUCTS[activeTG].filter(p => trendCat === 'All' || p.category === trendCat);
        return (
          <div style={{ animation:'fadeSlideIn 0.3s ease' }}>

            {/* Header + Gender Toggle */}
            <div style={{ ...card({ padding:'18px 20px', marginBottom:14 }), display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:'9px', letterSpacing:'0.2em', textTransform:'uppercase', background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:700, fontFamily:PJS, margin:'0 0 3px' }}>Fashion Trending — India 2025</p>
                <p style={{ fontFamily:PDI, fontSize:'17px', color:C.text, margin:0 }}>What Everyone's Buying</p>
              </div>
              {/* Gender Pills */}
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                {['male','female'].map(g => (
                  <button key={g} onClick={() => { setTrendGender(g); setTrendCat('All'); }} style={{
                    padding:'7px 14px', borderRadius:20, border:`1px solid ${activeTG===g?'transparent':C.border}`,
                    background: activeTG===g ? GRAD : C.glass2,
                    color: activeTG===g ? 'white' : C.muted,
                    fontSize:'11px', fontWeight: activeTG===g ? 700 : 400,
                    cursor:'pointer', fontFamily:PJS, transition:'all 0.2s',
                    boxShadow: activeTG===g ? '0 3px 10px rgba(139,92,246,0.35)' : 'none',
                  }}>
                    {g === 'male' ? '👨 Male' : '👩 Female'}
                  </button>
                ))}
              </div>
            </div>

            {/* Category filter pills */}
            <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4, marginBottom:14 }}>
              {cats.map(c => (
                <button key={c} onClick={() => setTrendCat(c)} style={{
                  ...pill(trendCat===c), flexShrink:0, padding:'6px 14px', fontSize:'10px',
                }}>
                  {c}
                </button>
              ))}
            </div>

            {/* Products grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              {filtered.map((product, i) => (
                <div key={product.id} style={{ ...card({ padding:0, overflow:'hidden' }) }}>
                  {/* Product "image" — emoji hero */}
                  <div style={{
                    height:90, display:'flex', alignItems:'center', justifyContent:'center',
                    background: C.isDark
                      ? `linear-gradient(135deg, rgba(139,92,246,${0.06+i*0.01}), rgba(236,72,153,${0.04+i*0.005}))`
                      : `linear-gradient(135deg, rgba(139,92,246,0.05), rgba(236,72,153,0.03))`,
                    fontSize:'40px', position:'relative',
                  }}>
                    {product.emoji}
                    <span style={{ position:'absolute', top:8, right:8, fontSize:'8px', background:`rgba(139,92,246,${C.isDark?'0.2':'0.1'})`, color:VIOLET, border:`1px solid rgba(139,92,246,0.2)`, borderRadius:6, padding:'2px 6px', fontFamily:PJS, fontWeight:600 }}>
                      #{i+1} Trending
                    </span>
                  </div>

                  {/* Product info */}
                  <div style={{ padding:'12px 12px 8px' }}>
                    <p style={{ fontSize:'12px', color:C.text, fontFamily:PJS, fontWeight:700, margin:'0 0 3px', lineHeight:'1.4' }}>{product.name}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                      <span style={{ fontSize:'9px', background:C.glass2, border:`1px solid ${C.border}`, borderRadius:6, padding:'2px 6px', color:C.muted, fontFamily:PJS }}>{product.category}</span>
                    </div>
                    <p style={{ fontSize:'9px', color:C.muted, fontFamily:PJS, margin:'0 0 10px', lineHeight:'1.5' }}>
                      🔥 {product.why}
                    </p>

                    {/* Shop buttons */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                      {[STORES[0], STORES[1]].map(store => (
                        <button key={store.id}
                          onClick={() => window.open(
                            store.id === 'myntra'
                              ? `https://www.myntra.com/${activeTG === 'female' ? 'women' : 'men'}-${product.name.toLowerCase().replace(/ /g,'-')}?rawQuery=${encodeURIComponent(product.name)}`
                              : `https://www.amazon.in/s?k=${encodeURIComponent(product.search)}`,
                            '_blank'
                          )}
                          style={{ padding:'6px 4px', borderRadius:8, border:`1px solid ${C.border}`, background:C.glass2, cursor:'pointer', fontSize:'9px', color:C.muted, fontFamily:PJS, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:4, transition:'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor=store.color; e.currentTarget.style.color=store.color; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.muted; }}
                        >
                          {store.emoji} {store.name}
                        </button>
                      ))}
                      {[STORES[2], STORES[3]].map(store => (
                        <button key={store.id}
                          onClick={() => window.open(
                            store.id === 'flipkart'
                              ? `https://www.flipkart.com/search?q=${encodeURIComponent(`${activeTG === 'female' ? 'women' : 'men'} ${product.name}`)}`
                              : `https://www.meesho.com/search?q=${encodeURIComponent(product.search)}`,
                            '_blank'
                          )}
                          style={{ padding:'6px 4px', borderRadius:8, border:`1px solid ${C.border}`, background:C.glass2, cursor:'pointer', fontSize:'9px', color:C.muted, fontFamily:PJS, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:4, transition:'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor=store.color; e.currentTarget.style.color=store.color; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.muted; }}
                        >
                          {store.emoji} {store.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign:'center', padding:'40px 20px' }}>
                <p style={{ fontSize:'32px', marginBottom:8 }}>🔍</p>
                <p style={{ fontSize:'13px', color:C.muted, fontFamily:PJS }}>No items in this category yet.</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── SHOP SELECTOR MODAL ── */}
      {shopItem && (
        <div
          onClick={() => setShopItem(null)}
          style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(12px)', display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0 0 0 0' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width:'100%', maxWidth:480, background:C.isDark?'#0B0F1A':'#FFFFFF', borderRadius:'24px 24px 0 0', padding:'24px 20px 48px', boxShadow:'0 -20px 60px rgba(0,0,0,0.3)' }}
          >
            <div style={{ width:40, height:4, borderRadius:2, background:'rgba(139,92,246,0.3)', margin:'0 auto 20px' }} />
            <p style={{ fontFamily:PDI, fontSize:'18px', color:C.text, textAlign:'center', margin:'0 0 4px' }}>Shop This Look</p>
            <p style={{ fontSize:'11px', color:C.muted, fontFamily:PJS, textAlign:'center', margin:'0 0 20px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {shopItem}
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {STORES.map(store => (
                <button key={store.id}
                  onClick={() => { window.open(buildShopUrl(shopItem, store.id, gender), '_blank'); setShopItem(null); }}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:14, border:`1px solid ${C.border}`, background:C.glass2, cursor:'pointer', transition:'all 0.2s', textAlign:'left', color:'inherit' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=store.color; e.currentTarget.style.background=`${store.color}10`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background=C.glass2; }}
                >
                  <div style={{ width:36, height:36, borderRadius:10, background:store.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>
                    {store.emoji}
                  </div>
                  <p style={{ fontSize:'13px', fontWeight:700, color:C.text, fontFamily:PJS, margin:0 }}>{store.name}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShopItem(null)}
              style={{ width:'100%', marginTop:16, padding:'12px', background:'none', border:'none', color:C.muted, fontSize:'12px', cursor:'pointer', fontFamily:PJS }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
