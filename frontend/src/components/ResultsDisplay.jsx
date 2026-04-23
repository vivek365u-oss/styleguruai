// ============================================================
// StyleGuru — Tab-Based Results Display (App-like UX)
// ============================================================
import { useState, useEffect, useContext, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { ThemeContext } from '../context/ThemeContext';
import { publishToCommunityFeed, auth, saveSavedColor, getSavedColors, saveHistory, savePrimaryProfile, saveToLookbook } from '../api/styleApi';
import { translateBackendObject } from '../i18n/backendTranslations';
import ProductShowcase from './ProductShowcase';
import ColorRecommendationsShop from './ColorRecommendationsShop';
import { motion, AnimatePresence } from 'framer-motion';
import { MISSIONS, scoreWardrobeItem } from '../utils/stylingEngine';
import AffiliateLink from './AffiliateLink';
import AdSense from '../AdSense';
import { buildMyntraUrl } from '../utils/myntraUrl';
import ShopActionSheet from './ShopActionSheet';

function ShoppingLinks({ colorName, category = "shirt", gender = "male", onShop }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [budget, setBudget] = useState(null);

  const budgets = [
    { label: '₹500', max: 500 },
    { label: '₹1000', max: 1000 },
    { label: '₹2000', max: 2000 },
    { label: 'Any', max: null },
  ];

  const PRODUCT_MAP = {
    shirt: { male: 'shirt', female: 'top' },
    pant: { male: 'trouser', female: 'trouser' },
    kurta: { male: 'kurta', female: 'kurti' },
    accessory: { male: 'accessory', female: 'accessory' },
    makeup: { male: 'makeup', female: 'makeup' },
  };

  const catKey = (category || 'shirt').toLowerCase().replace(/^cat_/, '');
  const productLabel = PRODUCT_MAP[catKey]?.[gender === 'female' ? 'female' : 'male'] || (gender === 'female' ? 'top' : 'shirt');

  return (
    <div className="mt-2 space-y-2" onClick={e => e.stopPropagation()}>
      <div className="flex gap-1.5 flex-wrap">
        {budgets.map((b) => (
          <button
            key={b.label}
            onClick={(e) => { e.stopPropagation(); setBudget(b.label === 'Any' ? null : b); }}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${(b.label === 'Any' && !budget) || budget?.label === b.label
                ? isDark ? 'bg-purple-500/40 border-purple-400 text-purple-200' : 'bg-purple-600 border-purple-600 text-white shadow-sm'
                : isDark ? 'bg-white/5 border-white/10 text-white/40 hover:text-white/70' : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onShop(`${colorName} ${productLabel}`, budget?.max); }}
        className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-violet-500/20 active:scale-95 transition-all mt-4 border border-violet-400/30 hover:bg-violet-500"
      >
        Shop Direct →
      </button>
    </div>
  );
}



// ── Makeup Shopping Links ──────────────────────────────────────
function MakeupShoppingLinks({ product, shade, onShop }) {
  return (
    <div className="mt-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onShop(`${shade || ''} ${product} makeup`);
        }}
        className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-violet-500/20 active:scale-95 transition-all mt-4 border border-violet-400/30 hover:bg-violet-500"
      >
        Shop Direct →
      </button>
    </div>
  );
}

// ── Color Card (compact, tap to expand) ─────────────────────

function ColorCard({ color, category, gender, isDark, onShop, className = '' }) {
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingColor, setSavingColor] = useState(false);
  const [savedColorId, setSavedColorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const isLoggedIn = !!auth.currentUser;

  // Load saved status when component mounts
  useEffect(() => {
    const loadSavedStatus = async () => {
      if (!isLoggedIn) {
        setLoading(false);
        return;
      }

      try {
        const savedColors = await getSavedColors(auth.currentUser.uid);
        // Check if this color hex is already saved
        const foundColor = savedColors.find(sc => sc.hex === color.hex);
        if (foundColor) {
          setSaved(true);
          setSavedColorId(foundColor.id);
        }
      } catch (err) {
        console.error('Error loading saved color status:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSavedStatus();
  }, [color.hex, isLoggedIn]);

  const toggleSave = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      alert('Please login to save colors');
      return;
    }

    setSavingColor(true);

    try {
      if (saved && savedColorId) {
        // Delete saved color
        const { db } = await import('../firebase');
        const { deleteDoc, doc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'saved_colors', savedColorId));
        setSaved(false);
        setSavedColorId(null);
        console.log('Color unsaved:', color.name);
      } else {
        // Save new color
        const colorId = await saveSavedColor(auth.currentUser.uid, {
          name: color.name,
          hex: color.hex,
          category,
          gender,
          reason: color.reason || ''
        });
        setSaved(true);
        setSavedColorId(colorId);
      }
    } catch (err) {
      console.error('Error saving color:', err);
      alert('Failed to save color. Please try again.');
    } finally {
      setSavingColor(false);
    }
  };

  const cardCls = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm';
  const nameCls = isDark ? 'text-white' : 'text-gray-800';
  const hexCls = isDark ? 'text-white/30' : 'text-gray-400';
  const chevronCls = isDark ? 'text-white/30' : 'text-gray-400';
  const hexBorderCls = isDark ? 'border-white/10' : 'border-gray-200';
  const dividerCls = isDark ? 'border-white/5' : 'border-gray-100';
  const reasonCls = isDark ? 'text-white/50' : 'text-gray-500';

  return (
    <div className={`${cardCls} ${className} rounded-2xl overflow-hidden transition-all duration-300 hover:border-purple-500/40`} onClick={() => setExpanded(e => !e)}>
      <div className="flex items-center gap-3 p-3 cursor-pointer">
        <div className={`w-12 h-12 rounded-xl flex-shrink-0 shadow-lg border ${hexBorderCls} swatch-pop`} style={{ backgroundColor: color.hex }} />
        <div className="flex-1 min-w-0">
          <p className={`${nameCls} font-bold text-sm truncate`}>{color.name}</p>
          <p className={`${hexCls} text-xs font-mono`}>{color.hex}</p>
        </div>
        <button
          onClick={toggleSave}
          disabled={!isLoggedIn || savingColor || loading}
          className={`text-lg transition-transform hover:scale-125 ${!isLoggedIn ? 'opacity-30 cursor-not-allowed' : (saved ? 'text-pink-400' : isDark ? 'text-white/20 hover:text-pink-400' : 'text-gray-300 hover:text-pink-400')} ${savingColor ? 'opacity-50' : ''}`}
          title={!isLoggedIn ? 'Login to save colors' : (saved ? 'Remove from saved' : 'Save color')}
        >
          {saved ? '❤️' : '🤍'}
        </button>
        <span className={`${chevronCls} text-xs transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▼</span>
      </div>
      {expanded && (
        <div className={`px-3 pb-3 border-t ${dividerCls} pt-2 scale-in`} onClick={e => e.stopPropagation()}>
          {color.reason && <p className={`${reasonCls} text-xs leading-relaxed mb-3`}>{color.reason}</p>}
          <button
            onClick={() => onShop(`${color.name} ${gender === 'female' ? 'top' : 'shirt'}`)}
            className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-violet-500/20 active:scale-95 transition-all mt-3 border border-violet-400/30 hover:bg-violet-500"
          >
            Shop Direct →
          </button>
        </div>
      )}
    </div>
  );
}


// ── Outfit Card ──────────────────────────────────────────────
function OutfitCard({ combo, index, isDark, onShop }) {
  const colors = ["purple", "pink", "blue", "emerald", "amber"];
  const color = colors[index % colors.length];
  const colorMap = {
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    pink: "from-pink-500/20 to-pink-600/10 border-pink-500/30",
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
    amber: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
  };
  const topItem = combo.shirt || combo.top || combo.dress || "";
  const bottomItem = combo.pant || combo.bottom || "";
  const headingCls = isDark ? 'text-white' : 'text-gray-800';
  const subCls = isDark ? 'text-white/60' : 'text-gray-500';
  const badgeCls = isDark ? 'bg-white/10 text-white/80' : 'bg-white/60 text-gray-700';
  const vibeCls = isDark ? 'text-white/30' : 'text-gray-400';

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-4`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1">
          <p className={`${headingCls} font-bold text-sm mb-1`}>{topItem}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {bottomItem && <span className={subCls}>👖 {bottomItem}</span>}
            {combo.shoes && <span className={subCls}>👟 {combo.shoes}</span>}
            {combo.dupatta && combo.dupatta !== "-" && <span className={subCls}>🧣 {combo.dupatta}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={`${badgeCls} text-xs px-2 py-1 rounded-full`}>{combo.occasion}</span>
          {combo.vibe && <p className={`${vibeCls} text-xs mt-1 italic`}>{combo.vibe}</p>}
        </div>
      </div>
      <button
        onClick={() => onShop(topItem)}
        className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-violet-500/10 active:scale-95 transition-all mt-4 border border-violet-400/20 hover:bg-violet-500"
      >
        Shop Direct →
      </button>
    </div>
  );
}

// ── Color Palette Download ───────────────────────────────────
function downloadPalette(colors, skinTone) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#050816';
  ctx.fillRect(0, 0, 600, 200);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText(`StyleGuru AI — ${skinTone} Skin Palette`, 20, 30);
  ctx.fillStyle = '#a855f7';
  ctx.font = '11px Arial';
  ctx.fillText('styleguruai.in', 20, 48);

  // Color swatches
  const swatchW = 70, swatchH = 100, startX = 20, startY = 65, gap = 10;
  colors.slice(0, 7).forEach((color, i) => {
    const x = startX + i * (swatchW + gap);
    ctx.fillStyle = color.hex;
    ctx.beginPath();
    ctx.roundRect(x, startY, swatchW, swatchH, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Arial';
    ctx.fillText(color.name?.slice(0, 10) || '', x + 4, startY + swatchH + 14);
    ctx.fillStyle = '#888';
    ctx.font = '8px Arial';
    ctx.fillText(color.hex, x + 4, startY + swatchH + 25);
  });

  const link = document.createElement('a');
  link.download = `styleguruai-${skinTone}-palette.png`;
  link.href = canvas.toDataURL();
  link.click();
}

// ── Celebrity Skin Match ─────────────────────────────────────
const CELEBRITY_MAP = {
  fair: {
    male: [
      { name: 'Ranbir Kapoor', tip: 'Navy, burgundy, olive green, charcoal' },
      { name: 'Shahid Kapoor', tip: 'Deep maroon, forest green, royal blue' },
      { name: 'Hrithik Roshan', tip: 'White, navy, teal, mustard' },
    ],
    female: [
      { name: 'Alia Bhatt', tip: 'Pastels, blush pink, lavender, navy' },
      { name: 'Shraddha Kapoor', tip: 'Mint green, coral, sky blue, white' },
      { name: 'Anushka Sharma', tip: 'Dusty rose, sage green, cobalt blue' },
    ],
  },
  light: {
    male: [
      { name: 'Varun Dhawan', tip: 'Sky blue, olive, rust, maroon' },
      { name: 'Tiger Shroff', tip: 'White, navy, coral, forest green' },
      { name: 'Kartik Aaryan', tip: 'Mustard, teal, burgundy, sky blue' },
    ],
    female: [
      { name: 'Katrina Kaif', tip: 'Coral, peach, sky blue, mint green' },
      { name: 'Jacqueline Fernandez', tip: 'Bright yellow, hot pink, white, teal' },
      { name: 'Kriti Sanon', tip: 'Olive, rust, mustard, navy blue' },
    ],
  },
  medium: {
    male: [
      { name: 'Shah Rukh Khan', tip: 'White, navy, maroon, olive green' },
      { name: 'Salman Khan', tip: 'Sky blue, white, rust, forest green' },
      { name: 'Ranveer Singh', tip: 'Bold colors — coral, mustard, teal' },
    ],
    female: [
      { name: 'Deepika Padukone', tip: 'Terracotta, rust, teal, mustard' },
      { name: 'Kareena Kapoor', tip: 'White, coral, sky blue, olive green' },
      { name: 'Madhuri Dixit', tip: 'Maroon, navy, forest green, coral' },
    ],
  },
  olive: {
    male: [
      { name: 'Ajay Devgn', tip: 'White, sky blue, olive, rust' },
      { name: 'Akshay Kumar', tip: 'Bright colors — yellow, coral, white' },
      { name: 'Anil Kapoor', tip: 'White, royal blue, coral, cream' },
    ],
    female: [
      { name: 'Priyanka Chopra', tip: 'Olive, burnt orange, forest green' },
      { name: 'Sushmita Sen', tip: 'White, royal blue, coral, gold' },
      { name: 'Shilpa Shetty', tip: 'Bright yellow, white, teal, coral' },
    ],
  },
  brown: {
    male: [
      { name: 'Nawazuddin Siddiqui', tip: 'White, sky blue, cobalt, bright yellow' },
      { name: 'Irrfan Khan', tip: 'White, royal blue, emerald, cream' },
      { name: 'Manoj Bajpayee', tip: 'White, bright blue, coral, gold' },
    ],
    female: [
      { name: 'Bipasha Basu', tip: 'Cobalt blue, fuchsia, gold, white' },
      { name: 'Kajol', tip: 'White, royal blue, bright yellow, coral' },
      { name: 'Tabu', tip: 'Emerald, white, cobalt blue, gold' },
    ],
  },
  dark: {
    male: [
      { name: 'Vijay (Thalapathy)', tip: 'White, bright yellow, royal blue, gold' },
      { name: 'Rajinikanth', tip: 'White, cream, bright colors, gold' },
      { name: 'Dhanush', tip: 'White, cobalt blue, bright yellow, coral' },
    ],
    female: [
      { name: 'Nandita Das', tip: 'Bright jewel tones, white, gold, red' },
      { name: 'Vidya Balan', tip: 'White, bright yellow, royal blue, coral' },
      { name: 'Konkona Sen Sharma', tip: 'White, emerald, cobalt blue, gold' },
    ],
  },
};

// ── Mission Selector (Event Wizard) ──────────────────────────
function MissionSelector({ activeMissionId, onMissionSelect, isDark }) {
  const missionsList = Object.values(MISSIONS);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🎯</span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-purple-500">Stylist Protocol</p>
          <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>Select Your Style Mission</h3>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 mask-fade-edges">
        {missionsList.map((m) => {
          const isActive = activeMissionId === m.id;
          return (
            <motion.button
              key={m.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onMissionSelect(m.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all ${isActive
                  ? 'bg-purple-600/20 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : isDark ? 'bg-white/5 border-white/5 text-white/40' : 'bg-gray-100 border-gray-100 text-gray-500'
                }`}
            >
              <span className="text-lg">{m.emoji}</span>
              <span className="text-xs font-bold whitespace-nowrap">{m.label}</span>
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="w-1.5 h-1.5 rounded-full bg-purple-400"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── DNA Breakdown (Explainable AI) ──────────────────────────
function DNABreakdown({ analysis, isDark }) {
  const ita = analysis.skin_tone.ita || 45;
  const confidence = Math.round((analysis.skin_tone.confidence_score || 0.98) * 100);

  const cardCls = isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200';
  const labelCls = isDark ? 'text-white/40' : 'text-gray-500';
  const valueCls = isDark ? 'text-purple-400' : 'text-purple-600';

  return (
    <div className={`${cardCls} rounded-2xl p-4 mt-2 mb-4 overflow-hidden relative`}>
      {/* Decorative tech-grid bg */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#a855f7 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧬</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-purple-500">Intelligence Protocol</p>
              <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>Style DNA Breakdown</h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-green-500 uppercase">Status: Elite</p>
            <p className={`text-xs font-mono ${isDark ? 'text-white/30' : 'text-gray-400'}`}>v5.1_SAFE</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className={`${labelCls} text-[9px] font-bold uppercase`}>Luminosity Index</p>
              <p className={`${valueCls} text-xs font-black`}>Deep Premium</p>
              <div className="h-1 w-full bg-purple-500/10 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full animate-width-slow" style={{ width: '88%' }} />
              </div>
            </div>
            <div>
              <p className={`${labelCls} text-[9px] font-bold uppercase`}>Chromatic Depth</p>
              <p className={`${valueCls} text-xs font-black`}>Elite Level</p>
              <div className="h-1 w-full bg-purple-500/10 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full animate-width-slow" style={{ width: '92%' }} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className={`${labelCls} text-[9px] font-bold uppercase`}>ITA Calculation</p>
              <p className={`${valueCls} text-xs font-black`}>{ita}° Spectrum</p>
              <p className={`${labelCls} text-[8px] mt-1`}>Precise Typology Angle</p>
            </div>
            <div>
              <p className={`${labelCls} text-[9px] font-bold uppercase`}>Detection Logic</p>
              <p className={`${valueCls} text-xs font-black`}>{confidence}% Confidence</p>
              <p className={`${labelCls} text-[8px] mt-1`}>Neural Match Score</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-purple-500/10">
          <p className={`${isDark ? 'text-white/60' : 'text-gray-600'} text-[10px] leading-relaxed italic`}>
            "Based on your <strong>Index Deep Premium</strong> profile, our AI suggests a high-contrast palette to enhance your natural features."
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Profile Hero Card ────────────────────────────────────────
function ProfileCard({ analysis, recommendations, uploadedImage, isFemale, isSeasonal, isDark, photoQuality }) {
  const { t } = useLanguage();
  const toneColors = { fair: "#F5DEB3", light: "#D2A679", medium: "#C68642", olive: "#A0724A", brown: "#7B4F2E", dark: "#4A2C0A" };
  const wrapperCls = isDark
    ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10'
    : 'bg-white border border-gray-200 shadow-sm';
  const labelCls = isDark ? 'text-white/40' : 'text-gray-500';
  const headingCls = isDark ? 'text-white' : 'text-gray-800';
  const skinLabelCls = isDark ? 'text-white/40' : 'text-gray-400';
  const imgBorderCls = isDark ? 'border-white/20' : 'border-gray-200';
  const summaryBgCls = isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200';
  const summaryCls = isDark ? 'text-white/60' : 'text-gray-500';

  const celebList = CELEBRITY_MAP[analysis.skin_tone.category]?.[isFemale ? 'female' : 'male'] || [];
  // Pick celebrity based on undertone to add variety
  const undertoneIdx = analysis.skin_tone.undertone === 'warm' ? 0 : analysis.skin_tone.undertone === 'cool' ? 1 : 2;
  const celeb = celebList[undertoneIdx % celebList.length];

  // Style Score — dynamic based on actual quality score + confidence
  const qualityScore = photoQuality?.score || 85;
  const confidenceBonus = analysis.skin_tone.confidence === 'high' ? 10 : analysis.skin_tone.confidence === 'medium' ? 5 : 0;
  const rawScore = Math.round((qualityScore * 0.7) + confidenceBonus + (analysis.skin_tone.brightness_score ? Math.min(10, analysis.skin_tone.brightness_score / 25) : 5));
  const styleScore = Math.min(98, Math.max(55, rawScore));

  // WhatsApp share
  const handleWhatsAppShare = () => {
    const skinTone = analysis.skin_tone.category;
    const undertone = analysis.skin_tone.undertone;
    const season = analysis.skin_tone.color_season;
    const celebName = celeb?.name || celebList[0]?.name || '';
    const msg = `✨ My StyleGuru AI Style Profile!\n\n🎨 Skin Tone: ${skinTone} (${undertone} undertone)\n🍂 Color Season: ${season}\n⭐ Celebrity Match: ${celebName}\n💯 Style Score: ${styleScore}/100\n\nGet your FREE AI style analysis 👇\nhttps://www.styleguruai.in`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className={`relative overflow-hidden ${wrapperCls} rounded-2xl p-4`}>
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ backgroundColor: toneColors[analysis.skin_tone.category] }} />
      <div className="flex items-center gap-4">
        {uploadedImage && (
          <div className="relative flex-shrink-0">
            <img src={uploadedImage} alt="Your photo" className={`w-20 h-20 object-cover rounded-2xl border-2 ${imgBorderCls} shadow-xl`} />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-slate-900" style={{ backgroundColor: toneColors[analysis.skin_tone.category] }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`${labelCls} text-xs uppercase tracking-widest mb-0.5`}>
            {isSeasonal ? 'Seasonal' : isFemale ? '👩 Female' : '👨 Male'} Profile
          </p>
          <h2 className={`${headingCls} text-2xl font-black capitalize`}>
            {analysis.skin_tone.category} <span className={`${skinLabelCls} font-light text-lg`}>Skin</span>
          </h2>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${isDark ? 'bg-purple-500/20 border-purple-500/30 text-purple-200' : 'bg-purple-100 border-purple-400 text-purple-800 font-semibold'}`}>{analysis.skin_tone.undertone}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${isDark ? 'bg-pink-500/20 border-pink-500/30 text-pink-200' : 'bg-pink-100 border-pink-400 text-pink-800 font-semibold'}`}>🍂 {analysis.skin_tone.color_season}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${analysis.skin_tone.confidence === "high"
              ? isDark ? "bg-green-500/20 border-green-500/30 text-green-300" : "bg-green-100 border-green-500 text-green-800 font-semibold"
              : isDark ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-300" : "bg-yellow-100 border-yellow-500 text-yellow-800 font-semibold"
              }`}>
              {analysis.skin_tone.confidence === "high" ? "✓ High" : "~ Medium"}
            </span>
          </div>
        </div>
      </div>

      {/* Style Score */}
      <div className={`mt-3 rounded-xl p-3 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center justify-between mb-1.5">
          <p className={`text-xs font-bold ${isDark ? 'text-white/70' : 'text-gray-700'}`}>💯 {t('styleScore')}</p>
          <span className="text-purple-400 font-black text-sm">{styleScore}/100</span>
        </div>
        <div className={`h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
          <div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 fill-bar" style={{ '--target-width': `${styleScore}%`, width: `${styleScore}%` }} />
        </div>
      </div>

      {/* Celebrity Match */}
      {celeb && (
        <div className={`mt-2 rounded-xl p-3 border flex items-center gap-3 ${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
          <span className="text-2xl">🌟</span>
          <div className="flex-1">
            <p className={`text-xs font-bold ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>⭐ {t('celebMatch')}</p>
            <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>{t(celeb?.name)}</p>
            <p className={`text-xs ${isDark ? 'text-amber-100/60' : 'text-amber-700'}`}>{celeb?.tip}</p>
          </div>
        </div>
      )}

      {/* Summary */}
      {(recommendations.summary || recommendations.description) && (
        <div className={`mt-2 ${summaryBgCls} rounded-xl p-3`}>
          <p className={`${summaryCls} text-xs leading-relaxed`}>{recommendations.summary || recommendations.description}</p>
        </div>
      )}

      {/* WhatsApp Share + Download Style Card */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleWhatsAppShare}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl text-green-400 font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>📱</span>
          <span>WhatsApp</span>
        </button>
        <button
          onClick={() => {
            // Generate shareable Style Card V2 (Phase 3 Upgrade)
            const canvas = document.createElement('canvas');
            const W = 1080, H = 1350;
            canvas.width = W; canvas.height = H;
            const ctx = canvas.getContext('2d');

            // 1. Premium Background Gradient
            const mission = Object.values(MISSIONS).find(m => m.id === activeMission);
            const grad = ctx.createLinearGradient(0, 0, W, H);
            if (activeMission === 'wedding') { grad.addColorStop(0, '#1e1b4b'); grad.addColorStop(1, '#431407'); }
            else if (activeMission === 'office') { grad.addColorStop(0, '#0f172a'); grad.addColorStop(1, '#334155'); }
            else { grad.addColorStop(0, '#0f0c29'); grad.addColorStop(0.5, '#302b63'); grad.addColorStop(1, '#24243e'); }
            ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

            // 2. Mission Texture (Subtle)
            ctx.globalAlpha = 0.05; ctx.fillStyle = '#ffffff';
            for (let i = 0; i < W; i += 40) { ctx.fillRect(i, 0, 1, H); ctx.fillRect(0, i, W, 1); }
            ctx.globalAlpha = 1.0;

            // 3. Header
            ctx.fillStyle = '#a855f7'; ctx.font = 'bold 24px Arial'; ctx.letterSpacing = '4px';
            ctx.fillText('STYLEGURU AI PROTOCOL', 80, 100);

            // 4. Mission Badge
            ctx.fillStyle = 'rgba(168,85,247,0.2)';
            ctx.beginPath(); ctx.roundRect(80, 140, 300, 60, 30); ctx.fill();
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 24px Arial';
            ctx.fillText(`${mission?.emoji || '🎯'} ${mission?.label || 'Custom Match'}`, 110, 180);

            // 5. Main Title (Skin Tone)
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 84px Arial';
            ctx.fillText(analysis.skin_tone.category.toUpperCase(), 80, 320);
            ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '300 40px Arial';
            ctx.fillText('SKIN COMPASS: ELITE CLASS', 80, 380);

            // 6. Style DNA Details
            ctx.fillStyle = '#ffffff'; ctx.font = '28px Arial';
            ctx.fillText(`• Undertone: ${analysis.skin_tone.undertone.toUpperCase()}`, 80, 460);
            ctx.fillText(`• Season: ${analysis.skin_tone.color_season.toUpperCase()}`, 80, 510);
            ctx.fillText(`• Style Score: ${styleScore}/100`, 80, 560);

            // 7. Large Palette Display
            const cardColors = [
              ...(recommendations.best_shirt_colors || recommendations.best_dress_colors || []),
            ].slice(0, 5);

            cardColors.forEach((c, i) => {
              // Circle shadow
              ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 20;
              ctx.beginPath(); ctx.arc(160 + i * 180, 800, 75, 0, Math.PI * 2);
              ctx.fillStyle = c.hex; ctx.fill();
              ctx.shadowBlur = 0; // reset
              ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 4; ctx.stroke();
            });

            // 8. Footer / Branding
            ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = 'bold 20px Arial';
            ctx.fillText('WWW.STYLEGURUAI.IN', W / 2 - 120, H - 100);

            // Watermark
            ctx.save(); ctx.translate(W - 100, H / 2); ctx.rotate(-Math.PI / 2);
            ctx.fillStyle = 'rgba(168,85,247,0.1)'; ctx.font = 'bold 120px Arial';
            ctx.fillText('STYLEGURU DNA', 0, 0); ctx.restore();

            // 9. Download
            const link = document.createElement('a');
            link.download = `styleguru-elite-${activeMission}-${Date.now()}.png`;
            link.href = canvas.toDataURL(); link.click();
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-400 font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>🎨</span>
          <span>Elite Style Card</span>
        </button>
      </div>
    </div>
  );
}

// ── Complete the Look ────────────────────────────────────────

// ── Complete the Look ────────────────────────────────────────
function CompleteTheLook({ shirtColor, pantColors, isDark, gender, onShop }) {
  const { t } = useLanguage();
  const AMAZON_TAG = 'styleguruai-21';
  const isFemale = gender === 'female';
  const pant = pantColors?.[0];

  const items = [
    { label: isFemale ? '👚 Top' : '👕 T-Shirt', color: shirtColor, cat: isFemale ? 'top' : 'shirt' },
    pant ? { label: isFemale ? '👖 Bottom' : '👖 Cargo/Jogger', color: pant, cat: isFemale ? 'bottom' : 'pant' } : null,
    { label: isFemale ? '👟 Sneakers' : '👟 Sneakers', color: { name: 'White', hex: '#FFFFFF' }, cat: 'shoes' },
  ].filter(Boolean);

  const cardCls = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm';
  const labelCls = isDark ? 'text-white/50' : 'text-gray-500';
  const nameCls = isDark ? 'text-white' : 'text-gray-800';

  return (
    <div className={`${cardCls} rounded-2xl p-4`}>
      <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${labelCls}`}>✨ {t('completeLook')}</p>
      <div className="flex gap-2 mb-3">
        {items.map((item, i) => (
          <div key={i} className="flex-1 text-center">
            <div className="w-10 h-10 rounded-xl mx-auto mb-1 border border-white/20 shadow" style={{ backgroundColor: item.color.hex }} />
            <p className={`text-xs font-semibold ${nameCls}`}>{item.label}</p>
            <p className={`text-xs ${labelCls} truncate`}>{item.color.name}</p>
          </div>
        ))}
      </div>
      {/* Shop the full look */}
      <button
        onClick={() => onShop(`${shirtColor.name} ${isFemale ? 'women coord set' : 'men outfit'}`)}
        className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-violet-500/20 active:scale-95 transition-all mt-3 border border-violet-400/30 hover:bg-violet-500"
      >
        🛒 Shop Full Outfit →
      </button>
    </div>
  );
}

// ── Colors Tab ───────────────────────────────────────────────
function ColorsTab({ recommendations, isFemale, isSeasonal, effectiveGender, shirtCategory, isDark, onShop }) {
  const { t } = useLanguage();
  const avoidColors = recommendations.colors_to_avoid || [];
  const sectionLabelCls = isDark ? 'text-white/50' : 'text-gray-500';

  if (isSeasonal) {
    const seasonalColors = recommendations.seasonal_colors || [];
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4">
          <p className="text-amber-200 font-bold text-sm mb-1">{recommendations.title}</p>
          <p className="text-amber-100/50 text-xs">{recommendations.description}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {(recommendations.fabrics_recommended || []).map((f, i) => <span key={i} className="bg-green-500/20 text-green-200 text-xs px-2 py-0.5 rounded-full">{f}</span>)}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {seasonalColors.map((color, i) => <ColorCard key={i} color={color} category={shirtCategory} gender={effectiveGender} isDark={isDark} onShop={onShop} />)}
        </div>
      </div>
    );
  }

  if (isFemale) {
    const femaleSections = [
      { label: '👗 Dress Colors', colors: recommendations.best_dress_colors || [], cat: 'dress' },
      { label: '👚 Top / Blouse Colors', colors: recommendations.best_top_colors || [], cat: 'top' },
      { label: '🥻 Kurti Colors', colors: recommendations.best_kurti_colors || [], cat: 'kurti' },
      { label: '🎀 Lehenga Colors', colors: recommendations.best_lehenga_colors || [], cat: 'lehenga' },
      { label: '🪭 Saree Colors', colors: recommendations.best_saree_colors || [], cat: 'saree' },
      { label: '✨ Sharara / Suit Colors', colors: recommendations.best_sharara_colors || recommendations.best_suit_colors || [], cat: 'sharara' },
      { label: '🌸 Dupatta / Stole', colors: recommendations.best_dupatta_colors || [], cat: 'dupatta' },
      { label: '👖 Bottom Colors', colors: recommendations.best_bottom_colors || recommendations.best_pant_colors || [], cat: 'bottom' },
    ].filter(s => s.colors.length > 0);

    return (
      <div className="space-y-5">
        {femaleSections.map((sec) => (
          <div key={sec.label}>
            <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>{sec.label}</p>
            <div className="grid grid-cols-1 gap-2">
              {sec.colors.map((color, i) => <ColorCard key={i} color={color} category={sec.cat} gender="female" isDark={isDark} onShop={onShop} />)}
            </div>
          </div>
        ))}

        {/* Fallback */}
        {femaleSections.length === 0 && (
          <p className={`${sectionLabelCls} text-xs text-center py-6`}>No color data available. Try analyzing again.</p>
        )}

        {avoidColors.length > 0 && (
          <div>
            <p className="text-red-400/70 text-xs font-semibold uppercase tracking-wide mb-2">🚫 {t('avoidThese')}</p>
            <div className="grid grid-cols-1 gap-2">
              {avoidColors.map((color, i) => <ColorCard key={i} color={color} category="dress" gender="female" isDark={isDark} onShop={onShop} />)}
            </div>
          </div>
        )}

        {/* Complete the Look — Female */}
        {(() => {
          const topColor = (recommendations.best_dress_colors || recommendations.best_top_colors || [])[0];
          const bottomColor = (recommendations.best_bottom_colors || recommendations.best_pant_colors || [])[0];
          return topColor ? <CompleteTheLook shirtColor={topColor} pantColors={bottomColor ? [bottomColor] : []} isDark={isDark} gender="female" onShop={onShop} /> : null;
        })()}
      </div>
    );
  }


  // Male
  const shirtColors = recommendations.best_shirt_colors || [];
  const pantColors = recommendations.best_pant_colors || recommendations.base_pant_colors || [];
  const kurataColors = recommendations.best_kurta_colors || [];
  const hoodieColors = recommendations.best_hoodie_colors || [];
  const blazerColors = recommendations.best_blazer_colors || [];

  const maleSections = [
    { label: '👕 T-Shirt / Top Colors', colors: shirtColors, cat: 'shirt' },
    { label: '👖 Pants / Cargo Colors', colors: pantColors, cat: 'pant' },
    { label: '🥷 Kurta Colors', colors: kurataColors, cat: 'kurta' },
    { label: '🧥 Hoodie / Sweatshirt', colors: hoodieColors, cat: 'hoodie' },
    { label: '🕴️ Blazer / Formal Shirt', colors: blazerColors, cat: 'blazer' },
  ].filter(s => s.colors.length > 0);

  return (
    <div className="space-y-5">
      {maleSections.map((sec) => (
        <div key={sec.label}>
          <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>{sec.label}</p>
          <div className="grid grid-cols-1 gap-2">
            {sec.colors.map((color, i) => <ColorCard key={i} color={color} category={sec.cat} gender="male" isDark={isDark} onShop={onShop} className={`stagger-${Math.min(i + 1, 6)}`} />)}
          </div>
        </div>
      ))}

      {/* Fallback: if backend sends shirt colors but not categorized */}
      {maleSections.length === 0 && shirtColors.length === 0 && (
        <p className={`${sectionLabelCls} text-xs text-center py-6`}>No color data available. Try analyzing again.</p>
      )}

      {avoidColors.length > 0 && (
        <div>
          <p className="text-red-400/70 text-xs font-semibold uppercase tracking-wide mb-2">🚫 Avoid These</p>
          <div className="grid grid-cols-1 gap-2">
            {avoidColors.map((color, i) => <ColorCard key={i} color={color} category="shirt" gender="male" isDark={isDark} onShop={onShop} />)}
          </div>
        </div>
      )}

      {/* Complete the Look */}
      {shirtColors.length > 0 && (
        <CompleteTheLook shirtColor={shirtColors[0]} pantColors={pantColors} isDark={isDark} gender="male" onShop={onShop} />
      )}
    </div>
  );
}

// ── Outfits Tab ──────────────────────────────────────────────
function OutfitsTab({ recommendations, isFemale, isSeasonal, seasonalGender, styleTips, occasionAdvice, ethnicWear, sareeSuggestions, isDark, onShop, bodyTypeTips = [], bodyType = null, userOccasion = 'casual', activeMission = 'casual' }) {
  const { t } = useLanguage();
  let outfits = [];
  if (isSeasonal) outfits = seasonalGender === 'female' ? (recommendations.female_outfits || []) : (recommendations.male_outfits || []);
  else if (isFemale) outfits = recommendations.outfit_combos || [];
  else outfits = recommendations.outfit_combinations || recommendations.outfit_combos || [];

  const sectionLabelCls = isDark ? 'text-white/50' : 'text-gray-500';
  const cardBgCls = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm';
  const bodyTextCls = isDark ? 'text-white/60' : 'text-gray-500';
  const mutedCls = isDark ? 'text-white/30' : 'text-gray-400';
  const tipTextCls = isDark ? 'text-white/70' : 'text-gray-700';


  // Phase 2: Mission-based Re-ranking Logic
  const scoredOutfits = useMemo(() => {
    const mission = Object.values(MISSIONS).find(m => m.id === activeMission);
    if (!mission) return outfits.map(o => ({ ...o, missionScore: 0 }));

    return outfits.map(o => {
      let score = 0;
      const text = `${o.upper || ''} ${o.lower || ''} ${o.description || ''} ${o.name || ''}`.toLowerCase();

      // Keywords boost
      mission.boost.forEach(b => {
        const catName = b.replace('cat_', '').replace('_', ' ');
        if (text.includes(catName)) score += 30;
      });

      // Colors boost
      mission.colors.forEach(c => {
        const colName = c.replace('_', ' ');
        if (text.includes(colName)) score += 20;
      });

      // Fabric boost
      mission.fabric.forEach(f => {
        if (text.includes(f)) score += 10;
      });

      return { ...o, missionScore: score };
    }).sort((a, b) => b.missionScore - a.missionScore);
  }, [outfits, activeMission]);

  // Find occasion-specific advice
  const occasionKey = Object.keys(occasionAdvice).find(k => k.toLowerCase().includes(userOccasion)) || null;
  const featuredAdvice = occasionKey ? occasionAdvice[occasionKey] : null;

  return (
    <div className="space-y-5">
      {/* Featured occasion advice (highlighted) */}
      {featuredAdvice && (
        <div className={`rounded-2xl p-4 border-2 border-purple-500/40 ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
          <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
            ✨ For Your {occasionKey} Look
          </p>
          <p className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-gray-800'}`}>{featuredAdvice}</p>
        </div>
      )}
      {/* Outfit combos */}
      {scoredOutfits.length > 0 && (
        <div>
          <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>🧥 {t('outfitCombos')}</p>
          <div className="space-y-2">
            {scoredOutfits.map((combo, i) => (
              <div key={i} className="relative">
                {combo.missionScore > 20 && (
                  <div className="absolute -top-1.5 -right-1.5 z-10 bg-gradient-to-r from-purple-600 to-pink-600 text-[9px] font-black text-white px-2 py-0.5 rounded-full shadow-lg border border-white/20 uppercase tracking-tighter">
                    Mission Match
                  </div>
                )}
                <OutfitCard combo={combo} index={i} isDark={isDark} onShop={onShop} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Occasion advice */}
      {Object.keys(occasionAdvice).length > 0 && (
        <div>
          <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>📅 {t('whatToWear')}</p>
          <div className="space-y-2">
            {Object.entries(occasionAdvice).map(([occasion, advice], i) => (
              <div key={i} className={`${cardBgCls} rounded-xl p-3`}>
                <p className="text-purple-300 text-xs font-bold uppercase tracking-wide mb-1">{occasion}</p>
                <p className={`${bodyTextCls} text-sm`}>{advice}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Style tips */}
      {styleTips.length > 0 && (
        <div>
          <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>💡 {t('styleTips')}</p>
          <div className="space-y-2">
            {styleTips.map((tip, i) => (
              <div key={i} className={`flex items-start gap-2 ${cardBgCls} rounded-xl p-3`}>
                <span className="text-purple-400 flex-shrink-0">✦</span>
                <p className={`${tipTextCls} text-sm leading-relaxed`}>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ethnic wear */}
      {/* Body Type Tips */}
      {bodyTypeTips.length > 0 && (
        <div>
          <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>
            👤 {bodyType === 'slim' ? 'Slim Body' : bodyType === 'athletic' ? 'Athletic Body' : bodyType === 'plus' ? 'Plus Size' : 'Body Type'} Tips
          </p>
          <div className={`rounded-2xl p-4 space-y-2 border ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
            {bodyTypeTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-blue-400 flex-shrink-0">✦</span>
                <p className={`text-sm ${isDark ? 'text-blue-100/70' : 'text-blue-800'}`}>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {ethnicWear.length > 0 && (
        <div>
          <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>🪷 {t('ethnicWear')}</p>
          <div className={`rounded-2xl p-4 space-y-2 border ${isDark ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
            {ethnicWear.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-amber-500 flex-shrink-0">★</span>
                <p className={`text-sm ${isDark ? 'text-amber-100/70' : 'text-amber-800'}`}>{typeof s === "string" ? s : `${s.type}: ${s.colors} — ${s.occasion}`}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saree suggestions (female) */}
      {sareeSuggestions.length > 0 && (
        <div>
          <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>🥻 {t('sareeSuits')}</p>
          <div className="space-y-2">
            {sareeSuggestions.map((item, i) => (
              <div key={i} className={`${isDark ? 'bg-white/5' : 'bg-white shadow-sm'} rounded-xl p-3 border border-pink-500/20`}>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className={`${isDark ? 'text-pink-200' : 'text-pink-700'} font-bold text-sm`}>{item.type}</p>
                    <p className={`${isDark ? 'text-white/50' : 'text-gray-500'} text-xs mt-0.5`}>🎨 {item.colors}</p>
                    <p className={`${mutedCls} text-xs`}>{item.reason}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${isDark ? 'bg-pink-500/20 text-pink-300 border-pink-500/20' : 'bg-pink-100 text-pink-700 border-pink-300 font-semibold'}`}>{item.occasion}</span>
                </div>
                <ShoppingLinks colorName={`${item.colors} ${item.type}`} category="kurta" gender="female" onShop={onShop} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Accessories Tab ──────────────────────────────────────────
function AccessoriesTab({ recommendations, isFemale, makeupSuggestions, isDark, onShop }) {
  const accessories = recommendations.accessories || [];
  const accentColors = recommendations.accent_colors || [];

  const getAccCat = (typeLC, isFem) => {
    if (typeLC.includes('earring')) return 'earrings';
    if (typeLC.includes('necklace')) return 'necklace';
    if (typeLC.includes('bangle')) return 'bangles';
    if (typeLC.includes('bag') || typeLC.includes('purse') || typeLC.includes('clutch')) return isFem ? 'handbag' : 'backpack';
    if (typeLC.includes('footwear') || typeLC.includes('shoe') || typeLC.includes('sandal')) return 'sneakers';
    if (typeLC.includes('heel')) return 'heels';
    if (typeLC.includes('watch')) return 'watch';
    if (typeLC.includes('dupatta') || typeLC.includes('scarf') || typeLC.includes('stole')) return 'dupatta';
    if (typeLC.includes('belt')) return isFem ? 'belt_f' : 'belt';
    if (typeLC.includes('wallet')) return 'wallet';
    if (typeLC.includes('sunglass')) return isFem ? 'sunglasses_f' : 'sunglasses';
    if (typeLC.includes('backpack')) return 'backpack';
    return 'accessory';
  };

  const sectionLabelCls = isDark ? 'text-white/50' : 'text-gray-500';
  const cardBgCls = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm';
  const subCls = isDark ? 'text-white/50' : 'text-gray-500';
  const mutedCls = isDark ? 'text-white/30' : 'text-gray-400';

  const emptyTextCls = isDark ? 'text-white/40' : 'text-gray-400';

  return (
    <div className="space-y-5">
      {/* Female accessories */}
      {isFemale && accessories.length > 0 && (
        <div>
          <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>👜 Accessories & Jewellery</p>
          <div className="space-y-2">
            {accessories.map((item, i) => {
              const typeLC = (item.type || '').toLowerCase();
              const cat = getAccCat(typeLC, true);
              const searchTerm = item.colors || item.suggestion || item.type;
              return (
                <div key={i} className={`${cardBgCls} rounded-xl p-3`}>
                  <p className="text-purple-300 font-bold text-sm">{item.type}</p>
                  <p className={`${subCls} text-xs mt-0.5`}>{item.suggestion || item.colors}</p>
                  {item.reason && <p className={`${mutedCls} text-xs`}>{item.reason}</p>}
                  <ShoppingLinks colorName={searchTerm} category={cat} gender="female" onShop={onShop} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Male accent colors / accessories */}
      {!isFemale && accentColors.length > 0 && (
        <div>
          <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>⌚ Accessories For You</p>
          <div className="space-y-2">
            {accentColors.map((item, i) => {
              const typeLC = (item.type || '').toLowerCase();
              const cat = getAccCat(typeLC, false);
              const searchTerm = item.colors || item.name || item.suggestion || item.type;
              return (
                <div key={i} className={`${cardBgCls} rounded-xl p-3`}>
                  <p className="text-purple-300 font-bold text-sm">{item.type}</p>
                  <p className={`${subCls} text-xs mt-0.5`}>{item.name}</p>
                  {item.reason && <p className={`${mutedCls} text-xs`}>{item.reason}</p>}
                  <ShoppingLinks colorName={searchTerm} category={cat} gender="male" onShop={onShop} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Makeup (female) */}
      {isFemale && makeupSuggestions.length > 0 && (
        <div>
          <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>💄 Makeup Suggestions</p>
          <div className="space-y-2">
            {makeupSuggestions.map((item, i) => (
              <div key={i} className={`${isDark ? 'bg-white/5' : 'bg-white shadow-sm'} rounded-xl p-3 border border-rose-500/20`}>
                <p className="text-rose-200 font-bold text-sm">{item.product}</p>
                <p className={`${subCls} text-xs mt-0.5`}>{item.shade || item.shades}</p>
                {item.brands && <p className={`${mutedCls} text-xs`}>Brands: {item.brands}</p>}
                <MakeupShoppingLinks product={item.product} shade={item.shade || item.shades} onShop={onShop} />
                {item.tip && <p className={`${isDark ? 'text-white/40' : 'text-gray-400'} text-xs mt-2 italic`}>💡 {item.tip}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isFemale && accentColors.length === 0 && (
        <div className="text-center py-8">
          <p className="text-4xl mb-3">⌚</p>
          <p className={`${emptyTextCls} text-sm`}>No accessories data available</p>
        </div>
      )}
    </div>
  );
}



// ── Main ResultsDisplay ──────────────────────────────────────
function ResultsDisplay({ data, uploadedImage, onReset }) {
  const { language, t } = useLanguage();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  // UI Class constants
  const tipTextCls = isDark ? 'text-white/70' : 'text-gray-700';
  const mutedCls = isDark ? 'text-white/40' : 'text-gray-400';
  const labelCls = isDark ? 'text-white/50' : 'text-gray-500';
  const [activeTab, setActiveTab] = useState('colors');
  const [activeMission, setActiveMission] = useState(data?.analysis?.skin_tone?.color_season === 'Winter' ? 'office' : 'casual');
  const [showConfetti, setShowConfetti] = useState(() => {
    const isFirst = !localStorage.getItem('sg_analysis_count') || localStorage.getItem('sg_analysis_count') === '1';
    return isFirst;
  });
  const [shareStatus, setShareStatus] = useState(null);

  // Normalize data to handle both { analysis: { skin_tone } } and { skin_tone } root formats
  const normalizedData = useMemo(() => {
    if (!data) return null;
    let base = { ...data };

    // If skin_tone is at root, move it into analysis wrapper for consistency
    if (!base.analysis && base.skin_tone) {
      base.analysis = {
        skin_tone: base.skin_tone,
        skin_color: base.skin_color,
        description: base.description || base.summary
      };
    }

    // Ensure recommendations is at root if it was nested
    if (!base.recommendations && base.analysis?.recommendations) {
      base.recommendations = base.analysis.recommendations;
    }

    // Translate if recommendations exist
    if (base.recommendations) {
      base.recommendations = translateBackendObject(base.recommendations, language);
    }

    return base;
  }, [data, language]);

  const finalData = normalizedData;

  useEffect(() => {
    if (showConfetti) { const timer = setTimeout(() => setShowConfetti(false), 2000); return () => clearTimeout(timer); }
  }, [showConfetti]);

  if (!finalData || !finalData.analysis?.skin_tone) {
    return (
      <div className="mt-8 text-center px-6">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-white/60 text-sm font-medium mb-2">{t('resultsLoadError') || 'Analysis results could not be processed.'}</p>
        <p className="text-white/30 text-xs mb-6">This usually happens if the photo was too dark or blurry.</p>
        <button onClick={onReset} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95">
          {t('tryAgain')}
        </button>
      </div>
    );
  }

  const analysis = finalData.analysis;
  const recommendations = finalData.recommendations || {};
  const photo_quality = finalData.photo_quality || { score: 80, warnings: [] };
  const isFemale = finalData.gender === "female";
  const isSeasonal = finalData.gender === "seasonal";
  const seasonalGender = data.seasonalGender || "male";
  const bodyType = data.bodyType || null;
  const userOccasion = data.occasion || 'casual';
  const userBudget = data.budget || 'any';

  const OCCASION_LABELS = { casual: '😎 Casual', office: '💼 Office', wedding: '💍 Wedding', party: '🎉 Party', date: '❤️ Date' };
  const BUDGET_LABELS = { any: 'Any Budget', '500': 'Under ₹500', '1000': 'Under ₹1000', '2000': 'Under ₹2000' };

  const BODY_TYPE_TIPS = {
    slim: ['Layering adds visual bulk — try oversized tees over shirts', 'Horizontal stripes and bold patterns work great for you', 'Baggy jeans and cargo pants suit your frame perfectly'],
    athletic: ['V-neck tees highlight your shoulders beautifully', 'Slim-fit or straight-cut pants balance your proportions', 'Polo shirts and fitted tees are your best friends'],
    average: ['You can wear almost any silhouette — experiment freely', 'Both oversized and fitted styles suit you well', 'Monochromatic outfits create a sleek, elongated look'],
    plus: ['Dark colors and vertical patterns create a slimming effect', 'Well-fitted clothes look better than very loose or very tight', 'High-waist bottoms define your waist beautifully'],
  };
  const bodyTypeTips = bodyType ? BODY_TYPE_TIPS[bodyType] || [] : [];
  const effectiveGender = isSeasonal ? seasonalGender : (isFemale ? 'female' : 'male');
  const shirtCategory = effectiveGender === 'female' ? "dress" : "shirt";
  const pantCategory = effectiveGender === 'female' ? "bottom" : "pant";
  const styleTips = isSeasonal ? (recommendations.outfit_tips || []) : (recommendations.style_tips || []);
  const occasionAdvice = recommendations.occasion_advice || {};
  const sareeSuggestions = recommendations.saree_suggestions || [];
  const [shopItem, setShopItem] = useState(null);
  const [shopBudget, setShopBudget] = useState(null);

  const makeupSuggestions = recommendations.makeup_suggestions || [];
  const ethnicWear = recommendations.ethnic_wear || sareeSuggestions;

  const tabs = [
    { id: 'colors', label: 'Colors', emoji: '🎨' },
    { id: 'outfits', label: 'Outfits', emoji: '👔' },
    { id: 'accessories', label: 'Accessories', emoji: '✨' },
  ];

  const tabBarBg = isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-100 border border-gray-200';
  const inactiveTabCls = isDark ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-600';

  return (
    <div className="space-y-4 pb-4 bg-transparent">
      {/* First analysis confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-start justify-center pt-20">
          <div className="text-center scale-in">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-white font-black text-lg bg-purple-600/90 px-6 py-3 rounded-2xl shadow-2xl">
              Your Style Profile is Ready!
            </p>
          </div>
          {['🎨', '✨', '💜', '🌟', '👗'].map((e, i) => (
            <span key={i} className="confetti absolute text-2xl"
              style={{ left: `${15 + i * 18}%`, animationDelay: `${i * 0.15}s` }}>{e}</span>
          ))}
        </div>
      )}
      {/* Festival Mode Banner */}
      {(() => {
        const month = new Date().getMonth() + 1;
        const isFestive = [10, 11, 12, 1].includes(month);
        if (!isFestive) return null;
        const festivals = { 10: '🪔 Diwali', 11: '🎉 Wedding Season', 12: '🎄 Christmas', 1: '🎊 New Year' };
        return (
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3">
            <span className="text-2xl">{festivals[month]?.split(' ')[0]}</span>
            <div>
              <p className={`text-xs font-bold ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>{festivals[month]} Special!</p>
              <p className={`text-xs ${isDark ? 'text-amber-100/60' : 'text-amber-700'}`}>Check Outfits tab for festive recommendations</p>
            </div>
          </div>
        );
      })()}
      {/* Photo quality warning */}
      {photo_quality?.warnings?.length > 0 && (
        <div className={`rounded-xl p-3 border ${isDark ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-50 border-yellow-300'}`}>
          <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>💡 Photo Tips:</p>
          {photo_quality.warnings.map((w, i) => <p key={i} className={`text-xs ${isDark ? 'text-yellow-300/60' : 'text-yellow-600'}`}>• {w.message} → {w.fix}</p>)}
        </div>
      )}

      {/* Occasion + Budget context banner */}
      <div className={`flex items-center gap-2 flex-wrap rounded-xl px-3 py-2 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
        <span className={`text-xs font-semibold ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Styled for:</span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${isDark ? 'bg-pink-500/20 border-pink-500/30 text-pink-300' : 'bg-pink-100 border-pink-300 text-pink-700'}`}>
          {OCCASION_LABELS[userOccasion] || '😎 Casual'}
        </span>
        {userBudget !== 'any' && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${isDark ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-green-100 border-green-300 text-green-700'}`}>
            💰 {BUDGET_LABELS[userBudget]}
          </span>
        )}
      </div>

      {/* Profile card */}
      <ProfileCard
        analysis={analysis}
        recommendations={recommendations}
        uploadedImage={uploadedImage}
        isFemale={isFemale}
        isSeasonal={isSeasonal}
        isDark={isDark}
        photoQuality={photo_quality}
      />

      {/* NEW: Event Styling Wizard (Phase 2) */}
      <section className="mt-8 pt-4 border-t border-purple-500/10">
        <MissionSelector
          activeMissionId={activeMission}
          onMissionSelect={setActiveMission}
          isDark={isDark}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeMission}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl border ${isDark ? 'bg-purple-900/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'} mb-6`}
          >
            <div className="flex gap-3">
              <span className="text-2xl mt-1">💡</span>
              <div>
                <p className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                  Expert Stylist Advice
                </p>
                <p className={`text-sm mt-1 leading-relaxed ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                  {activeMission === 'wedding' && "For your Wedding Elite mission, we've prioritized high-contrast silk combinations. Aim for jewel tones that complement your deep premium luminosity."}
                  {activeMission === 'office' && "Focusing on Corporate Power. We've filtered for crisp cottons and structured silhouettes in your core neutral palette for maximum authority."}
                  {activeMission === 'monsoon' && "Monsoon Minimal mode active. Stick to darker saturated tones to maintain a sharp profile even in overcast lighting."}
                  {activeMission === 'pooja' && "Traditional Morning Pooja DNA detected. Opt for saffron and ivory tones to reflect serenity while keeping your natural brightness front and center."}
                  {activeMission === 'date' && "Entering Date Night mode. Soft satin finishes in deep wine or midnight blue will interact perfectly with evening ambient light."}
                  {activeMission === 'casual' && "Relaxed daily mode. Focus on comfort within your seasonal spectrum — keeping it effortless yet curated."}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* NEW: Explainability Section */}
      <DNABreakdown analysis={analysis} isDark={isDark} />

      {/* NEW: Phase 3 Action Center */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <button
          onClick={async () => {
            const subjectName = window.prompt("Who is this Lookbook for? (e.g., Myself, Rahul, Sister)", "Myself");
            if (subjectName === null) return; // User cancelled saving

            const btn = document.getElementById('save-lookbook-btn');
            if (btn) { btn.textContent = '⏳ Saving...'; btn.disabled = true; }

            const mission = Object.values(MISSIONS).find(m => m.id === activeMission);
            const hexMap = {
              gold: '#FFD700', maroon: '#800000', emerald: '#50C878', royal_blue: '#4169E1', red: '#FF0000',
              navy: '#000080', charcoal: '#36454F', white: '#f8fafc', grey: '#808080', black: '#0f172a',
              dark_grey: '#A9A9A9', olive: '#808000',
              yellow: '#FFFF00', ivory: '#FFFFF0', saffron: '#F4C430', light_pink: '#FFB6C1',
              wine: '#722F37', crimson: '#DC143C', midnight_blue: '#191970', champagne: '#F7E7CE'
            };

            const missionColors = mission ? mission.colors.map(c => ({
              name: c.replace('_', ' '),
              hex: hexMap[c] || '#888888'
            })) : [
              ...(recommendations.best_shirt_colors || recommendations.best_dress_colors || []),
            ].map(c => typeof c === 'string' ? { name: c, hex: '#888888' } : c).slice(0, 5);

            let expertAdvice = "";
            if (activeMission === 'wedding') expertAdvice = "For your Wedding Elite mission, we've prioritized high-contrast silk combinations. Aim for jewel tones that complement your deep premium luminosity.";
            else if (activeMission === 'office') expertAdvice = "Focusing on Corporate Power. We've filtered for crisp cottons and structured silhouettes in your core neutral palette for maximum authority.";
            else if (activeMission === 'monsoon') expertAdvice = "Monsoon Minimal mode active. Stick to darker saturated tones to maintain a sharp profile even in overcast lighting.";
            else if (activeMission === 'pooja') expertAdvice = "Traditional Morning Pooja DNA detected. Opt for saffron and ivory tones to reflect serenity while keeping your natural brightness front and center.";
            else if (activeMission === 'date') expertAdvice = "Entering Date Night mode. Soft satin finishes in deep wine or midnight blue will interact perfectly with evening ambient light.";
            else expertAdvice = "Relaxed daily mode. Focus on comfort within your seasonal spectrum — keeping it effortless yet curated.";

            // --- BUILD THE OUTFIT ---
            let outfits = [];
            if (isSeasonal) outfits = seasonalGender === 'female' ? (recommendations.female_outfits || []) : (recommendations.male_outfits || []);
            else if (isFemale) outfits = recommendations.outfit_combos || [];
            else outfits = recommendations.outfit_combinations || recommendations.outfit_combos || [];

            let bestOutfit = outfits[0] || null;
            if (mission && outfits.length > 0) {
              const scored = outfits.map(o => {
                let s = 0;
                const txt = `${o.upper || ''} ${o.lower || ''} ${o.description || ''} ${o.name || ''} ${o.shirt || o.top || ''} ${o.pant || o.bottom || ''}`.toLowerCase();
                mission.boost.forEach(b => { if (txt.includes(b.replace('cat_', '').replace('_', ' '))) s += 30; });
                mission.colors.forEach(c => { if (txt.includes(c.replace('_', ' '))) s += 20; });
                mission.fabric.forEach(f => { if (txt.includes(f)) s += 10; });
                return { ...o, s };
              }).sort((a, b) => b.s - a.s);
              bestOutfit = scored[0];
            }

            const outfitToSave = bestOutfit ? {
              top: bestOutfit.shirt || bestOutfit.top || bestOutfit.dress || "Stylist Recommended Top",
              bottom: bestOutfit.pant || bestOutfit.bottom || "",
              shoes: bestOutfit.shoes || "",
              dupatta: bestOutfit.dupatta || "",
              occasion: bestOutfit.occasion || activeMission,
              vibe: bestOutfit.vibe || ""
            } : null;

            const lookData = {
              missionId: activeMission,
              subjectName: subjectName || "Myself",
              expertAdvice: expertAdvice,
              analysis: { skin_tone: analysis.skin_tone },
              gender: finalData.gender || (isFemale ? 'female' : 'male'),
              colors: missionColors.slice(0, 5),
              outfit: outfitToSave,
              score: Math.min(98, Math.max(55, Math.round((photo_quality?.score || 85) * 0.7 + (analysis.skin_tone.confidence === 'high' ? 10 : 5)))),
              timestamp: new Date().toISOString()
            };

            try {
              const ok = await saveToLookbook(auth.currentUser.uid, lookData);
              if (ok && btn) {
                btn.textContent = '✅ Saved to Lookbook';
                btn.style.background = 'rgba(168,85,247,0.15)';
                btn.style.borderColor = 'rgba(168,85,247,0.4)';
                btn.disabled = false;
                setTimeout(() => {
                  btn.textContent = '📖 Save to Lookbook';
                  btn.style.background = ''; btn.style.borderColor = '';
                }, 3000);
              } else if (btn) {
                btn.disabled = false;
              }
            } catch (err) {
              if (err.code === 'usage-limit-reached') {
                window.dispatchEvent(new CustomEvent('open_subscription_modal', { 
                  detail: { source: 'lookbook_limit' } 
                }));
              } else {
                console.error("Lookbook error:", err);
              }
              if (btn) {
                btn.textContent = '📖 Save to Lookbook';
                btn.disabled = false;
              }
            }
          }}
          id="save-lookbook-btn"
          className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-bold transition-all hover:scale-[1.02] ${isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
        >
          <span>📖</span> Save to Lookbook
        </button>

        <button
          onClick={async () => {
            const btn = document.getElementById('post-community-btn');
            if (btn) { btn.textContent = '⏳ Posting...'; btn.disabled = true; }

            const palette = [
              ...(recommendations.best_shirt_colors || recommendations.best_dress_colors || []),
            ].slice(0, 5);

            const ok = await publishToCommunityFeed(auth.currentUser.uid, {
              userName: auth.currentUser?.displayName || 'Elite User',
              mission: activeMission,
              palette,
              score: Math.min(98, Math.max(55, Math.round((photo_quality?.score || 85) * 0.7 + (analysis.skin_tone.confidence === 'high' ? 10 : 5)))),
              level: 'Premium Elite' // Fallback for now
            });

            if (ok && btn) {
              btn.textContent = '🚀 Posted to Feed!';
              btn.style.background = 'rgba(16,185,129,0.15)';
              btn.style.borderColor = 'rgba(16,185,129,0.4)';
              btn.style.color = '#10B981';
              btn.disabled = false;
              setTimeout(() => {
                btn.textContent = '🌍 Post to Community';
                btn.style.background = ''; btn.style.borderColor = ''; btn.style.color = '';
              }, 3000);
            }
          }}
          id="post-community-btn"
          className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-bold transition-all hover:scale-[1.02] ${isDark ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-700'
            }`}
        >
          <span>🌍</span> Post to Community
        </button>
      </div>

      {/* Style DNA Button — saves to BOTH localStorage AND Firestore */}
      <button
        onClick={async () => {
          const btn = document.getElementById('set-dna-btn');
          if (btn) { btn.textContent = '⏳ Saving...'; btn.disabled = true; }

          const dnaData = {
            skinTone: analysis.skin_tone.category,
            undertone: analysis.skin_tone.undertone,
            colorSeason: analysis.skin_tone.color_season,
            skinHex: analysis.skin_color?.hex || '#C68642',
            gender: finalData.gender || 'male',
            bestColors: [
              ...(recommendations.best_shirt_colors || recommendations.best_dress_colors || []),
            ].slice(0, 6),
            // Extra fields for StyleNavigator compatibility
            skin_tone: { category: analysis.skin_tone.category, undertone: analysis.skin_tone.undertone, color_season: analysis.skin_tone.color_season },
            updatedAt: new Date().toISOString(),
          };

          // 1. Save to localStorage (instant, for StyleNavigator fallback)
          localStorage.setItem('sg_last_analysis', JSON.stringify(dnaData));

          // 2. Save to Firestore (persistent, cross-device)
          try {
            if (auth.currentUser) {
              await savePrimaryProfile(auth.currentUser.uid, dnaData);
            }
          } catch (e) {
            console.error('[DNA] Firestore save failed:', e);
          }

          // 3. Notify StyleNavigator to reload
          window.dispatchEvent(new CustomEvent('sg_dna_set', { detail: dnaData }));

          // 4. Visual feedback
          if (btn) {
            btn.textContent = '✅ Style DNA Saved!';
            btn.style.background = 'rgba(16,185,129,0.15)';
            btn.style.borderColor = 'rgba(16,185,129,0.4)';
            btn.style.color = '#10B981';
            btn.disabled = false;
            setTimeout(() => {
              btn.textContent = '🧬 Set as My Style DNA';
              btn.style.background = '';
              btn.style.borderColor = '';
              btn.style.color = '';
            }, 3000);
          }
        }}
        id="set-dna-btn"
        className={`w-full py-3 rounded-2xl border text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${isDark
            ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
            : 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100'
          }`}
      >
        🧬 Set as My Style DNA
      </button>

      {/* Actions: Download / Share */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        {(() => {
          const allColors = [
            ...(recommendations.best_shirt_colors || recommendations.best_dress_colors || recommendations.seasonal_colors || []),
            ...(recommendations.best_pant_colors || []),
          ].slice(0, 7);
          if (allColors.length === 0) return null;
          return (
            <button
              onClick={() => downloadPalette(allColors, analysis.skin_tone.category)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all hover:scale-[1.02] ${isDark ? 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-purple-500/40' : 'bg-white border-gray-200 text-gray-600 hover:border-purple-400 shadow-sm'}`}
            >
              <span>🎨</span>
              <span>Download Palette</span>
            </button>
          );
        })()}

        <button
          onClick={async () => {
            // Always allow saving as user is now always authenticated
            await saveHistory({
              skinTone: analysis.skin_tone.category,
            });
            if (shareStatus === 'success') return;
            setShareStatus('loading');
            try {
              const paletteData = {
                skinHex: analysis.skin_color.hex,
                skinTone: analysis.skin_tone.category,
                undertone: analysis.skin_tone.undertone || '',
                colorSeason: analysis.skin_tone.color_season || '',
                gender: analysis?.gender || 'male',
                bestColors: [
                  ...(recommendations.best_shirt_colors || recommendations.best_dress_colors || recommendations.seasonal_colors || []),
                ].slice(0, 5)
              };
              await publishToCommunityFeed(auth.currentUser?.uid || 'anon', paletteData);
              setShareStatus('success');
            } catch {
              setShareStatus('error');
              setTimeout(() => setShareStatus(null), 3000);
            }
          }}
          disabled={shareStatus === 'loading' || shareStatus === 'success'}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] shadow-sm ${shareStatus === 'success'
            ? 'bg-green-500 text-white border-green-500'
            : shareStatus === 'error'
              ? 'bg-red-500 text-white border-red-500'
              : isDark
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent hover:from-purple-500 hover:to-pink-500'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent hover:from-purple-600 hover:to-pink-600'
            }`}
        >
          {shareStatus === 'loading' ? (
            <span className="animate-spin text-sm">↻</span>
          ) : shareStatus === 'success' ? (
            <span>✅ Shared!</span>
          ) : shareStatus === 'error' ? (
            <span>Error</span>
          ) : (
            <>
              <span>🌍</span>
              <span>Share to Community</span>
            </>
          )}
        </button>
      </div>

      {/* Tab bar — equal distribution, all 4 tabs including Shop */}
      <div className={`flex ${tabBarBg} rounded-2xl p-1 gap-0.5`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-[10px] font-bold transition-all min-w-0 ${activeTab === tab.id
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
              : inactiveTabCls
              }`}
          >
            <span className="text-sm">{tab.emoji}</span>
            <span className="truncate w-full text-center px-0.5">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content — swipe support with gesture direction detection */}
      <div
        className="tab-content"
        onTouchStart={(e) => {
          window._tabTouchStartX = e.touches[0].clientX;
          window._tabTouchStartY = e.touches[0].clientY;
          window._tabSwipeBlocked = false;
        }}
        onTouchMove={(e) => {
          // Detect if this is a horizontal scroll inside a child (e.g. color list)
          // If the event target or any ancestor has overflowX scrollable, block parent
          const dx = Math.abs(e.touches[0].clientX - window._tabTouchStartX);
          const dy = Math.abs(e.touches[0].clientY - window._tabTouchStartY);
          if (dx > dy) {
            // Primarily horizontal — check if a child is scrollable horizontally
            let el = e.target;
            while (el && el !== e.currentTarget) {
              const style = window.getComputedStyle(el);
              const overflowX = style.overflowX;
              if ((overflowX === 'auto' || overflowX === 'scroll') && el.scrollWidth > el.clientWidth) {
                window._tabSwipeBlocked = true;
                break;
              }
              el = el.parentElement;
            }
          }
        }}
        onTouchEnd={(e) => {
          if (window._tabSwipeBlocked) return;
          const diff = window._tabTouchStartX - e.changedTouches[0].clientX;
          const dy = Math.abs(e.changedTouches[0].clientY - window._tabTouchStartY);
          // Only swipe horizontally if mainly horizontal gesture
          if (Math.abs(diff) < dy * 0.8) return;
          const tabOrder = ['colors', 'outfits', 'accessories'];
          const idx = tabOrder.indexOf(activeTab);
          if (diff > 50 && idx < tabOrder.length - 1) setActiveTab(tabOrder[idx + 1]);
          if (diff < -50 && idx > 0) setActiveTab(tabOrder[idx - 1]);
        }}
      >
        {activeTab === 'colors' && (
          <ColorsTab
            recommendations={recommendations}
            isFemale={isFemale}
            isSeasonal={isSeasonal}
            effectiveGender={effectiveGender}
            shirtCategory={shirtCategory}
            pantCategory={pantCategory}
            isDark={isDark}
            onShop={(data, budget) => {
              const shopData = typeof data === 'string' ? { query: data } : data;
              setShopItem(shopData);
              setShopBudget(shopData.budget || budget || null);
            }}
          />
        )}
        {activeTab === 'outfits' && (
          <OutfitsTab
            recommendations={recommendations}
            isFemale={isFemale}
            isSeasonal={isSeasonal}
            seasonalGender={seasonalGender}
            styleTips={styleTips}
            occasionAdvice={occasionAdvice}
            ethnicWear={ethnicWear}
            sareeSuggestions={sareeSuggestions}
            isDark={isDark}
            onShop={(data, budget) => {
              const shopData = typeof data === 'string' ? { query: data } : data;
              setShopItem(shopData);
              setShopBudget(shopData.budget || budget || null);
            }}
            bodyTypeTips={bodyTypeTips}
            bodyType={bodyType}
            userOccasion={userOccasion}
            activeMission={activeMission}
          />
        )}
        {activeTab === 'accessories' && (
          <AccessoriesTab
            recommendations={recommendations}
            isFemale={isFemale}
            makeupSuggestions={makeupSuggestions}
            isDark={isDark}
            onShop={(data, budget) => {
              const shopData = typeof data === 'string' ? { query: data } : data;
              setShopItem(shopData);
              setShopBudget(shopData.budget || budget || null);
            }}
          />
        )}
        {/* Shop tab removed — shopping links removed from analysis */}
      </div>

      {/* Related Blog Posts */}
      {(() => {
        const skinTone = analysis?.skin_tone?.category;
        const blogs = [
          { slug: 'skin-tone-colors', title: 'Best Colors for Your Skin Tone', emoji: '🎨', relevantFor: ['fair', 'light', 'medium', 'olive', 'brown', 'dark'] },
          { slug: 'outfit-guide', title: 'How to Choose the Perfect Outfit', emoji: '👔', relevantFor: ['fair', 'light', 'medium', 'olive', 'brown', 'dark'] },
          { slug: 'ai-fashion', title: 'How AI is Changing Fashion', emoji: '🤖', relevantFor: ['fair', 'light', 'medium', 'olive', 'brown', 'dark'] },
          { slug: 'wardrobe-essentials', title: 'Wardrobe Essentials Every Indian Should Own', emoji: '👗', relevantFor: ['fair', 'light', 'medium', 'olive', 'brown', 'dark'] },
          { slug: 'accessorizing-guide', title: 'The Art of Accessorizing', emoji: '✨', relevantFor: ['fair', 'light', 'medium', 'olive', 'brown', 'dark'] },
        ];
        const relevant = blogs.filter(b => b.relevantFor.includes(skinTone)).slice(0, 3);
        if (!relevant.length) return null;
        return (
          <div className={`rounded-2xl p-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
            <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>📖 Read More</p>
            <div className="space-y-2">
              {relevant.map((blog) => (
                <a
                  key={blog.slug}
                  href={`/blog/${blog.slug}`}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all hover:border-purple-500/40 ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-gray-50 border-gray-100 hover:bg-purple-50'}`}
                >
                  <span className="text-xl">{blog.emoji}</span>
                  <p className={`text-sm font-semibold flex-1 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>{blog.title}</p>
                  <span className={`text-xs ${isDark ? 'text-purple-400' : 'text-purple-500'}`}>→</span>
                </a>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Bottom Ad Card — Consolidated to prevent console 400 errors */}
      <div className={`mt-8 rounded-3xl p-6 border overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-200 shadow-sm'}`}>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">StyleGuru AI Partner Content</p>
        <AdSense />
      </div>

      {/* New photo button */}
      <button
        onClick={onReset}
        className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-900/40"
      >
        📸 {t('analyzeNewPhoto')}
      </button>
      <ShopActionSheet
        isOpen={!!shopItem}
        onClose={() => { setShopItem(null); setShopBudget(null); }}
        item={shopItem}
        gender={isFemale ? 'female' : 'male'}
        budget={shopBudget}
      />
    </div>
  );
}

export default ResultsDisplay;
