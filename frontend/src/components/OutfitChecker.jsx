import { useState, useRef, useContext } from 'react';
import { checkOutfitCompatibility, saveWardrobeItem, auth, incrementUsage } from '../api/styleApi';
import { ThemeContext } from '../App';
import { useLanguage } from '../i18n/LanguageContext';
import { usePlan } from '../context/PlanContext';
import { compressImage, saveLocalWardrobeImage } from '../utils/indexedDB';
import PaywallModal from './PaywallModal';

// ── Outfit Shop Card — same style as analyze results ─────────
function OutfitShopCard({ color, isDark, gender = 'male' }) {
  const [budget, setBudget] = useState(null);
  const AMAZON_TAG = 'styleguruai-21';
  const colorDisplay = color.name.toLowerCase();

  const budgets = [
    { label: '₹500', max: 500 },
    { label: '₹1000', max: 1000 },
    { label: '₹2000', max: 2000 },
    { label: 'Any', max: null },
  ];

  // Generate shopping links with budget filtering
  const generateShoppingLinks = () => {
    const isFemale = gender === 'female';
    const colorSlug = color.name.toLowerCase().replace(/\s+/g, '-');
    const colorDisplay = color.name.toLowerCase().replace(/\s+/g, ' ');

    // Match categories as requested
    const product = isFemale ? 'top' : 'shirt';
    
    // Myntra dynamic URL
    const myntraUrl = `https://www.myntra.com/${colorSlug}-${product}`;
    
    const amzKw = `${colorDisplay} ${gender} ${product} trending 2025`;
    const fkKw = `${colorDisplay} ${gender} ${product}`;
    const meeKw = `${colorDisplay} ${gender} ${product}`;

    const budgetMax = budget?.max;
    const amzPrice = budgetMax ? `%2Cp_36%3A-${budgetMax * 100}` : '';
    const fkPrice = budgetMax ? `&p%5B%5D=facets.price_range.from%3D0&p%5B%5D=facets.price_range.to%3D${budgetMax}` : '';
    const myntraPrice = budgetMax ? `&p=price%5B0%5D%3D0%20TO%20${budgetMax}` : '';

    return {
      amazon: `https://www.amazon.in/s?k=${encodeURIComponent(amzKw)}&rh=${isFemale ? 'n%3A7534543031' : 'n%3A1968024031'}${amzPrice}&sort=review-rank&tag=${AMAZON_TAG}`,
      flipkart: `https://www.flipkart.com/search?q=${encodeURIComponent(fkKw)}&sort=review-rank${fkPrice}`,
      myntra: `${myntraUrl}${myntraUrl.includes('?') ? '&' : '?'}${myntraPrice.slice(1)}`,
      meesho: `https://meesho.com/search?q=${encodeURIComponent(meeKw)}`,
    };
  };

  const shopLinks = generateShoppingLinks();

  const links = [
    { name: 'Amazon', icon: '🛒', platform: 'amazon',
      bg: isDark ? 'bg-orange-500/20 hover:bg-orange-500/40 border-orange-500/30 text-orange-300' : 'bg-orange-50 hover:bg-orange-100 border-orange-300 text-orange-700 font-bold' },
    { name: 'Flipkart', icon: '🏪', platform: 'flipkart',
      bg: isDark ? 'bg-blue-500/20 hover:bg-blue-500/40 border-blue-500/30 text-blue-300' : 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700 font-bold' },
    { name: 'Myntra', icon: '👗', platform: 'myntra',
      bg: isDark ? 'bg-pink-500/20 hover:bg-pink-500/40 border-pink-500/30 text-pink-300' : 'bg-pink-50 hover:bg-pink-100 border-pink-300 text-pink-700 font-bold' },
    { name: 'Meesho', icon: '🛍️', platform: 'meesho',
      bg: isDark ? 'bg-purple-500/20 hover:bg-purple-500/40 border-purple-500/30 text-purple-300' : 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700 font-bold' },
  ];

  const cardCls = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-md';
  const nameCls = isDark ? 'text-white' : 'text-gray-900';
  const reasonCls = isDark ? 'text-white/40' : 'text-gray-500';

  return (
    <div className={`${cardCls} rounded-2xl p-3`}>
      {/* Color info */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl flex-shrink-0 shadow-lg border border-white/10" style={{ backgroundColor: color.hex }} />
        <div className="flex-1">
          <p className={`font-bold text-sm ${nameCls}`}>{color.name}</p>
          <p className={`text-xs ${reasonCls}`}>{color.reason}</p>
        </div>
      </div>

      {/* Budget filter */}
      <div className="flex gap-1.5 flex-wrap mb-2">
        {budgets.map((b) => (
          <button
            key={b.label}
            onClick={() => setBudget(b.label === 'Any' ? null : b)}
            className={`px-2 py-0.5 rounded-full text-xs font-bold border transition-all ${
              (b.label === 'Any' && !budget) || budget?.label === b.label
                ? isDark ? 'bg-purple-500/40 border-purple-400 text-purple-200' : 'bg-purple-600 border-purple-600 text-white shadow-sm'
                : isDark ? 'bg-white/5 border-white/10 text-white/40 hover:text-white/70' : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Shop links */}
      <div className="flex gap-1.5 flex-wrap">
        {links.map((link) => (
          <a key={link.name} href={shopLinks[link.platform]} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all hover:scale-105 ${link.bg}`}>
            <span>{link.icon}</span><span>{link.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function OutfitChecker() {
  const { theme } = useContext(ThemeContext);
  const { t, language } = useLanguage();
  const { isPro, usage, setUsage } = usePlan();
  const isDark = theme === 'dark';
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [outfitPreview, setOutfitPreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [outfitFile, setOutfitFile] = useState(null);
  const [gender, setGender] = useState('male'); // NEW: Gender selector
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [wardrobeSaved, setWardrobeSaved] = useState(false);
  const [wardrobeSaving, setWardrobeSaving] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const selfieRef = useRef(null);
  const outfitRef = useRef(null);

  const handleSelfie = (file) => {
    setSelfieFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setSelfiePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleOutfit = (file) => {
    setOutfitFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setOutfitPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleCheck = async () => {
    if (!selfieFile || !outfitFile) { setError(t('uploadBoth')); return; }
    // Plan gate
    if (!isPro && usage.outfit_checks_count >= 10) {
      setPaywallOpen(true);
      return;
    }
    console.log("[OutfitChecker] Starting outfit check...");
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await checkOutfitCompatibility(selfieFile, outfitFile, language);
      console.log("[OutfitChecker] Analysis successful!");
      setResult(res.data);
      // Increment usage for free users
      const uid = auth.currentUser?.uid;
      if (uid && !isPro) {
        incrementUsage(uid, 'outfit_checks_count').then(() => {
          setUsage(prev => ({ ...prev, outfit_checks_count: (prev.outfit_checks_count || 0) + 1 }));
        });
      }
    } catch (err) {
      console.error("[OutfitChecker] Analysis error:", err);
      if (err.code === 'ECONNABORTED') {
        setError('Analysis is taking too long. Server is busy, please try again later.');
      } else {
        const detail = err.response?.data?.detail;
        if (typeof detail === 'object') setError(detail.message || 'Analysis failed.');
        else setError(detail || 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelfiePreview(null); setOutfitPreview(null);
    setSelfieFile(null); setOutfitFile(null);
    setResult(null); setError(null);
    setWardrobeSaved(false); setWardrobeSaving(false);
  };

  const handleSaveToWardrobe = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setWardrobeSaving(true);
    try {
      const imageId = `outfit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      try {
        if (outfitFile) {
          const base64 = await compressImage(outfitFile, 400);
          await saveLocalWardrobeImage(imageId, base64);
        }
      } catch (e) {
        console.warn('Failed to save to IDB', e);
      }

      await saveWardrobeItem(uid, {
        source: 'outfit_checker',
        imageId: imageId,
        outfit_data: {
          colors: result.outfit_analysis?.color_name ? [{ name: result.outfit_analysis.color_name, hex: result.outfit_analysis.dominant_color_hex }] : [],
        },
        skin_tone: result.skin_analysis?.skin_tone || '',
        skin_hex: result.skin_analysis?.skin_color_hex || '#C68642',
        compatibility_score: score,
      });
      setWardrobeSaved(true);
    } catch {
      try {
        const queue = JSON.parse(localStorage.getItem('sg_wardrobe_queue') || '[]');
        queue.push({ source: 'outfit_checker', imageId: null, outfit_data: { colors: [] }, skin_tone: result.skin_analysis?.skin_tone || '', skin_hex: result.skin_analysis?.skin_color_hex || '#C68642', compatibility_score: score, saved_at: new Date().toISOString() });
        localStorage.setItem('sg_wardrobe_queue', JSON.stringify(queue));
        setWardrobeSaved(true); 
      } catch {}
    } finally {
      setWardrobeSaving(false);
    }
  };

  const compatibility = result?.compatibility;
  const score = compatibility?.compatibility_score ?? 0;

  const getScoreColor = (s) => s >= 80 ? 'text-green-500' : s >= 60 ? 'text-yellow-500' : s >= 40 ? 'text-orange-500' : 'text-red-500';
  const getScoreBg = (s) => s >= 80 ? 'from-green-500/20 to-emerald-500/20 border-green-500/30' : s >= 60 ? 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30' : s >= 40 ? 'from-orange-500/20 to-amber-500/20 border-orange-500/30' : 'from-red-500/20 to-rose-500/20 border-red-500/30';
  const getScoreEmoji = (s) => s >= 80 ? '🌟' : s >= 60 ? '✅' : s >= 40 ? '⚠️' : '❌';

  return (
    <div className="mt-4 space-y-6">

      {/* Hero */}
      <div className="text-center mb-6">
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 mb-4 border ${isDark ? 'bg-purple-500/20 border-purple-500/30' : 'bg-purple-50 border-purple-200'}`}>
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
          <span className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>AI Outfit Compatibility Checker</span>
        </div>
        <h2 className={`text-3xl md:text-4xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('outfitTitle')}
          <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent"> {t('outfitSubtitle')}</span>
        </h2>
        <p className={`text-base max-w-lg mx-auto ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
          {t('outfitDesc')}
        </p>
      </div>

      {!result ? (
        <>
          {/* NEW: Gender Selection */}
          <div className={`rounded-2xl p-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <p className={`text-sm font-bold mb-3 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>👥 I'm shopping for:</p>
            <div className="flex gap-3">
              <button
                onClick={() => setGender('male')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${
                  gender === 'male'
                    ? isDark ? 'bg-blue-500/30 border-blue-500/50 text-blue-300 shadow-lg shadow-blue-500/20' : 'bg-blue-100 border-blue-400 text-blue-700 shadow-sm'
                    : isDark ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                👔 Men's Clothes
              </button>
              <button
                onClick={() => setGender('female')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${
                  gender === 'female'
                    ? isDark ? 'bg-pink-500/30 border-pink-500/50 text-pink-300 shadow-lg shadow-pink-500/20' : 'bg-pink-100 border-pink-400 text-pink-700 shadow-sm'
                    : isDark ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                👗 Women's Clothes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Selfie Upload */}
            <div
              onClick={() => selfieRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 group
                ${isDark
                  ? 'border-blue-500/30 bg-blue-500/5 hover:border-blue-400/60 hover:bg-blue-500/10'
                  : 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 hover:border-blue-500 hover:from-blue-100 hover:to-indigo-100 shadow-sm hover:shadow-md'}`}
            >
              <input ref={selfieRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files?.[0] && handleSelfie(e.target.files[0])} className="hidden" />
              {selfiePreview ? (
                <div className="flex flex-col items-center">
                  <img src={selfiePreview} alt="Selfie" className="w-32 h-32 object-cover rounded-2xl border-2 border-blue-400 shadow-lg mb-3" />
                  <p className="text-blue-600 text-sm font-bold">✅ Selfie ready!</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-white/30' : 'text-gray-500'}`}>Click to change</p>
                </div>
              ) : (
                <>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm
                    ${isDark ? 'bg-blue-500/20' : 'bg-white border-2 border-blue-300 group-hover:border-blue-500'}`}>
                    <span className="text-3xl">🤳</span>
                  </div>
                  <p className={`font-black text-base mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('yourSelfie')}</p>
                  <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-white/40' : 'text-blue-700'}`}>{t('clearFacePhoto')}</p>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border
                    ${isDark ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' : 'bg-blue-600 border-blue-600 text-white shadow-sm'}`}>
                    📷 Tap to upload
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-white/25' : 'text-gray-400'}`}>JPG, PNG, WebP</p>
                </>
              )}
            </div>

            {/* Outfit Upload */}
            <div
              onClick={() => outfitRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 group
                ${isDark
                  ? 'border-pink-500/30 bg-pink-500/5 hover:border-pink-400/60 hover:bg-pink-500/10'
                  : 'border-pink-400 bg-gradient-to-br from-pink-50 to-rose-50 hover:border-pink-500 hover:from-pink-100 hover:to-rose-100 shadow-sm hover:shadow-md'}`}
            >
              <input ref={outfitRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files?.[0] && handleOutfit(e.target.files[0])} className="hidden" />
              {outfitPreview ? (
                <div className="flex flex-col items-center">
                  <img src={outfitPreview} alt="Outfit" className="w-32 h-32 object-cover rounded-2xl border-2 border-pink-400 shadow-lg mb-3" />
                  <p className="text-pink-600 text-sm font-bold">✅ Outfit ready!</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-white/30' : 'text-gray-500'}`}>Click to change</p>
                </div>
              ) : (
                <>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm
                    ${isDark ? 'bg-pink-500/20' : 'bg-white border-2 border-pink-300 group-hover:border-pink-500'}`}>
                    <span className="text-3xl">👗</span>
                  </div>
                  <p className={`font-black text-base mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('outfitPhoto')}</p>
                  <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-white/40' : 'text-pink-700'}`}>{t('outfitCheckDesc')}</p>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border
                    ${isDark ? 'bg-pink-500/20 border-pink-500/30 text-pink-300' : 'bg-pink-600 border-pink-600 text-white shadow-sm'}`}>
                    📸 Tap to upload
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-white/25' : 'text-gray-400'}`}>JPG, PNG, WebP</p>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className={`rounded-2xl p-4 border ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>⚠️ {error}</p>
            </div>
          )}

          <button
            onClick={handleCheck}
            disabled={loading || !selfieFile || !outfitFile}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                AI {t('aiChecking')}
              </span>
            ) : `🔍 ${t('checkCompatibility')}`}
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className={`rounded-2xl p-4 border ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-300 shadow-sm'}`}>
              <p className={`font-bold text-sm mb-2 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>🤳 Selfie Tips:</p>
              <ul className="space-y-1">
                {[t('clearFacePhotoTip'), t('goodLighting'), t('noSunglasses')].map((tip, i) => (
                  <li key={i} className={`text-xs flex items-center gap-2 ${isDark ? 'text-white/50' : 'text-gray-700'}`}>
                    <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>•</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`rounded-2xl p-4 border ${isDark ? 'bg-pink-500/10 border-pink-500/20' : 'bg-pink-50 border-pink-300 shadow-sm'}`}>
              <p className={`font-bold text-sm mb-2 ${isDark ? 'text-pink-300' : 'text-pink-800'}`}>👗 Outfit Tips:</p>
              <ul className="space-y-1">
                {[t('plainBackground'), t('fullOutfitVisible'), t('clearBrightPhoto')].map((tip, i) => (
                  <li key={i} className={`text-xs flex items-center gap-2 ${isDark ? 'text-white/50' : 'text-gray-700'}`}>
                    <span className={isDark ? 'text-pink-400' : 'text-pink-600'}>•</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className={`bg-gradient-to-br ${getScoreBg(score)} border rounded-3xl p-8 text-center`}>
            <div className="text-6xl mb-3">{getScoreEmoji(score)}</div>
            <div className={`text-7xl font-black mb-2 ${getScoreColor(score)}`}>{score}%</div>
            <p className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{compatibility?.verdict}</p>
            <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{compatibility?.message}</p>
          </div>

          {score >= 70 && (
            <div className="flex gap-2">
              {auth.currentUser ? (
                <button
                  onClick={handleSaveToWardrobe}
                  disabled={wardrobeSaved || wardrobeSaving}
                  className={`flex-1 py-3 rounded-2xl text-sm font-bold border transition-all ${
                    wardrobeSaved
                      ? isDark ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-green-50 border-green-300 text-green-600'
                      : isDark ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10' : 'bg-white border-gray-200 text-gray-700 hover:border-purple-400 shadow-sm'
                  } disabled:cursor-not-allowed`}
                >
                  {wardrobeSaved ? '✓ Saved to Wardrobe' : wardrobeSaving ? 'Saving...' : '👗 Save to Wardrobe'}
                </button>
              ) : (
                <p className={`flex-1 text-center text-xs py-3 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Login to save this outfit</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
              <p className={`text-xs uppercase tracking-widest mb-3 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{t('yourSkinTone')}</p>
              <div className="flex items-center gap-3">
                <img src={selfiePreview} alt="selfie" className="w-16 h-16 object-cover rounded-xl border border-white/20" />
                <div>
                  <p className={`font-bold capitalize ${isDark ? 'text-white' : 'text-gray-800'}`}>{result.skin_analysis?.skin_tone} skin</p>
                  <p className={`text-sm capitalize ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{result.skin_analysis?.undertone} undertone</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: result.skin_analysis?.skin_color_hex }} />
                    <span className={`text-xs font-mono ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{result.skin_analysis?.skin_color_hex}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
              <p className={`text-xs uppercase tracking-widest mb-3 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Outfit Color</p>
              <div className="flex items-center gap-3">
                <img src={outfitPreview} alt="outfit" className="w-16 h-16 object-cover rounded-xl border border-white/20" />
                <div>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{result.outfit_analysis?.color_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 rounded-lg border border-white/20" style={{ backgroundColor: result.outfit_analysis?.dominant_color_hex }} />
                    <span className={`text-xs font-mono ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{result.outfit_analysis?.dominant_color_hex}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {compatibility?.undertone_tip && (
            <div className={`rounded-2xl p-4 border ${isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
              <p className={`text-sm ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{compatibility.undertone_tip}</p>
            </div>
          )}

          {compatibility?.better_alternatives?.length > 0 && (
            <div className={`rounded-3xl p-5 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h3 className={`font-black text-base mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>💡 Better Alternatives — Shop Now</h3>
              
              {/* NEW: Gender Selector */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setGender('male')}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all border ${
                    gender === 'male'
                      ? isDark ? 'bg-blue-500/30 border-blue-500/50 text-blue-300' : 'bg-blue-100 border-blue-400 text-blue-700 shadow-sm'
                      : isDark ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10' : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  👔 Men's
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all border ${
                    gender === 'female'
                      ? isDark ? 'bg-pink-500/30 border-pink-500/50 text-pink-300' : 'bg-pink-100 border-pink-400 text-pink-700 shadow-sm'
                      : isDark ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10' : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  👗 Women's
                </button>
              </div>

              <div className="space-y-4">
                {compatibility.better_alternatives.slice(0, 3).map((color, i) => (
                  <OutfitShopCard key={i} color={color} isDark={isDark} gender={gender} />
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:scale-[1.02] text-base"
          >
            🔄 {t('checkAgain')}
          </button>
        </div>
      )}
      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        triggerMessage="10 checks used this month. Upgrade to Pro for unlimited."
      />
    </div>
  );
}

export default OutfitChecker;