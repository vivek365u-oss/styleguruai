import { useState, useRef, useContext } from 'react';
import { checkOutfitCompatibility, saveWardrobeItem, auth, consumeUserLimit, getWardrobe } from '../api/styleApi';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { usePlan } from '../context/PlanContext';
import { useAnalysisProgress } from '../hooks/useAnalysisProgress';
import { LoadingScreenWithProgress } from './LoadingScreenWithProgress';
import { compressImage, saveLocalWardrobeImage, getLocalWardrobeImage } from '../utils/indexedDB';
import { getCategoriesByGender, getCategoryIcon, ALL_CATEGORIES, getCategoryGroup, getCategorySectionMeta } from '../constants/fashionCategories';
import { buildMyntraUrl } from '../utils/myntraUrl';
import ShopActionSheet from './ShopActionSheet';
// PaywallModal import removed

// ── Outfit Shop Card — same style as analyze results ─────────
function OutfitShopCard({ color, isDark, gender = 'male', onShop }) {
  const [budget, setBudget] = useState(null);

  const budgets = [
    { label: '₹500', max: 500 },
    { label: '₹1000', max: 1000 },
    { label: '₹2000', max: 2000 },
    { label: 'Any', max: null },
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
      <div className="flex gap-1.5 flex-wrap mb-3">
        {budgets.map((b) => (
          <button
            key={b.label}
            onClick={() => setBudget(b.label === 'Any' ? null : b)}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
              (b.label === 'Any' && !budget) || budget?.label === b.label
                ? isDark ? 'bg-purple-500/40 border-purple-400 text-purple-200' : 'bg-purple-600 border-purple-600 text-white shadow-sm'
                : isDark ? 'bg-white/5 border-white/10 text-white/40 hover:text-white/70' : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Shop Action */}
      <button 
        onClick={() => onShop(`${color.name} ${gender === 'female' ? 'top' : 'shirt'}`, budget?.max)}
        className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-violet-500/20 active:scale-95 transition-all border border-violet-400/30 hover:bg-violet-500"
      >
        Shop Direct →
      </button>
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
  const [showProgress, setShowProgress] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showWardrobePicker, setShowWardrobePicker] = useState(false);
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [loadingWardrobe, setLoadingWardrobe] = useState(false);
  const [shopItem, setShopItem] = useState(null);
  const [shopBudget, setShopBudget] = useState(null);
  const { progress, startProgress, completeProgress, reset: resetProgress } = useAnalysisProgress();

  const dataURLtoFile = (dataurl, filename) => {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){ u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, {type:mime});
  };

  const openWardrobePicker = async () => {
    if (!auth.currentUser) { setError('Login to access your Smart Closet.'); return; }
    setShowWardrobePicker(true);
    setLoadingWardrobe(true);
    try {
      const items = await getWardrobe(auth.currentUser.uid);
      setWardrobeItems(items);
    } catch (err) { console.error(err); }
    setLoadingWardrobe(false);
  };

  const generateSolidColorFile = (hex) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = hex || '#888888';
      ctx.fillRect(0, 0, 400, 400);
      canvas.toBlob((blob) => {
        resolve(new File([blob], "wardrobe_color.jpg", { type: "image/jpeg" }));
      }, 'image/jpeg');
    });
  };

  const selectWardrobeItem = async (item) => {
    let file;
    let preview;
    
    if (item.imageId) {
      const base64 = await getLocalWardrobeImage(item.imageId);
      if (!base64) { setError("Could not load image from local storage."); return; }
      file = dataURLtoFile(base64, 'wardrobe_item.jpg');
      preview = base64;
    } else if (item.hex) {
      // Support items without images (wishlist/scanned)
      file = await generateSolidColorFile(item.hex);
      preview = item.hex;
    } else {
      setError("This item has no image or color data.");
      return;
    }

    setOutfitFile(file);
    setOutfitPreview(preview);
    setShowWardrobePicker(false);
    setError(null);
  };

  const isMobile = window.matchMedia('(pointer: coarse)').matches;
  const selfieRef = useRef(null);
  const outfitRef = useRef(null);
  const selfieCamRef = useRef(null);
  const outfitCamRef = useRef(null);

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

  const handleCheck = async (skipLimit = false) => {
    if (!selfieFile || !outfitFile) { setError(t('uploadBoth')); return; }

    // LIMIT CHECK
    if (!skipLimit) {
        const limitCheck = await consumeUserLimit('outfit_check');
        if (!limitCheck.success && limitCheck.requires_ad) {
            window.dispatchEvent(new CustomEvent('open_subscription_modal', {
                detail: {
                    onSuccess: (byAd = false) => {
                        handleCheck(byAd);
                    }
                }
            }));
            setError("You've reached your free Ad-Free limits! Please Upgrade to Pro.");
            return;
        }
    }

    console.log("[OutfitChecker] Starting outfit check with progress...");
    setLoading(true); setError(null); setResult(null);
    setShowProgress(true);
    startProgress(); // Start fake progressive loading
    try {
      const res = await checkOutfitCompatibility(selfieFile, outfitFile, language, gender, 'top');
      console.log("[OutfitChecker] Analysis successful!");
      completeProgress(); // Complete progress animation
      
      // Wait for animation to finish, then show results
        setTimeout(() => {
          const payload = res.data?.data ? res.data.data : res.data;
          setResult(payload);
          setShowProgress(false);
          // Persist score for home page intelligence
          if (payload?.compatibility?.compatibility_score !== undefined) {
             localStorage.setItem('sg_last_fit_score', payload.compatibility.compatibility_score.toString());
             localStorage.setItem('sg_last_fit_date', new Date().toISOString());
             window.dispatchEvent(new CustomEvent('sg_score_updated'));
          }
        }, 800); 
    } catch (err) {
      console.error("[OutfitChecker] Analysis error:", err);
      setShowProgress(false);
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
    setShowProgress(false);
    resetProgress();
  };

  const [selectedCat, setSelectedCat] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedFit, setSelectedFit] = useState('fit_regular');
  const [selectedFabric, setSelectedFabric] = useState('fabric_cotton');
  const [selectedPattern, setSelectedPattern] = useState('pattern_solid');
  const [selectedMood, setSelectedMood] = useState('mood_minimal');

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  // Helper component for thumbnails
  function WardrobeThumbnail({ imageId }) {
    const [src, setSrc] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      import('../utils/indexedDB').then(({ getLocalWardrobeImage }) => {
        getLocalWardrobeImage(imageId).then(data => {
          setSrc(data);
          setLoading(false);
        });
      });
    }, [imageId]);
    
    if (loading) return <div className="w-full h-24 bg-purple-500/10 animate-pulse rounded-lg mb-2" />;
    
    return src ? (
      <img src={src} className="w-full h-24 object-cover rounded-lg mb-2 shadow-sm border border-white/10" alt="item" />
    ) : (
      <div className="w-full h-24 bg-gray-200 rounded-lg mb-2 flex items-center justify-center text-[8px] opacity-30">ERR</div>
    );
  };

  const handleSaveToWardrobe = async (cat) => {
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
        category: cat,
        tags: selectedTags,
        fit: selectedFit,
        fabric: selectedFabric,
        pattern: selectedPattern,
        mood: selectedMood,
        gender: result.gender || gender || 'male',
        imageId: imageId,
        hex: result.outfit_analysis?.dominant_color_hex || '#888888',
        color_name: result.outfit_analysis?.color_name || 'Detected Color',
        outfit_data: {
          colors: result.outfit_analysis?.color_name ? [{ name: result.outfit_analysis.color_name, hex: result.outfit_analysis.dominant_color_hex }] : [],
        },
        skin_tone: result.skin_analysis?.skin_tone || '',
        skin_hex: result.skin_analysis?.skin_color_hex || '#C68642',
        compatibility_score: score,
      });
      setWardrobeSaved(true);
      setShowCategoryPicker(false);
      // Trigger global update for Navigator
      window.dispatchEvent(new CustomEvent('sg_wardrobe_updated'));
    } catch {
      try {
        const queue = JSON.parse(localStorage.getItem('sg_wardrobe_queue') || '[]');
        queue.push({ 
          source: 'outfit_checker', 
          category: cat, 
          imageId: null, 
          hex: result.outfit_analysis?.dominant_color_hex || '#888888',
          color_name: result.outfit_analysis?.color_name || 'Detected Color',
          fit: selectedFit,
          fabric: selectedFabric,
          pattern: selectedPattern,
          mood: selectedMood,
          outfit_data: { colors: [] }, 
          skin_tone: result.skin_analysis?.skin_tone || '', 
          skin_hex: result.skin_analysis?.skin_color_hex || '#C68642', 
          compatibility_score: score, 
          saved_at: new Date().toISOString() 
        });
        localStorage.setItem('sg_wardrobe_queue', JSON.stringify(queue));
        setWardrobeSaved(true); 
      } catch {
        // ignore IDB error
      }
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
      {showProgress && <LoadingScreenWithProgress progress={progress} isDark={isDark} />}

      {!showProgress && (
        <>
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
              className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 group
                ${isDark
                  ? 'border-blue-500/30 bg-blue-500/5 hover:border-blue-400/60 hover:bg-blue-500/10'
                  : 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 hover:border-blue-500 hover:from-blue-100 hover:to-indigo-100 shadow-sm hover:shadow-md'}`}
            >
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
                  <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-white/40' : 'text-blue-700'}`}>{t('clearFacePhoto')}</p>
                  <div className="flex gap-2 justify-center px-4 w-full">
                    <button
                      onClick={(e) => { e.stopPropagation(); selfieRef.current?.click(); }}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all h-11
                        ${isDark ? 'bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30' : 'bg-blue-600 border-blue-600 text-white shadow-sm hover:bg-blue-700'}`}
                    >
                      🖼️ {isMobile ? 'Gallery' : 'Upload'}
                    </button>
                    {isMobile && (
                      <button
                        onClick={(e) => { e.stopPropagation(); selfieCamRef.current?.click(); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all h-11
                          ${isDark ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10' : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm'}`}
                      >
                        📷 Camera
                      </button>
                    )}
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-white/25' : 'text-gray-400'}`}>JPG, PNG, WebP</p>
                </>
              )}
            </div>

            {/* Outfit Upload */}
            <div
              className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 group
                ${isDark
                  ? 'border-pink-500/30 bg-pink-500/5 hover:border-pink-400/60 hover:bg-pink-500/10'
                  : 'border-pink-400 bg-gradient-to-br from-pink-50 to-rose-50 hover:border-pink-500 hover:from-pink-100 hover:to-rose-100 shadow-sm hover:shadow-md'}`}
            >
              {outfitPreview ? (
                <div className="flex flex-col items-center">
                  {typeof outfitPreview === 'string' && outfitPreview.startsWith('#') ? (
                    <div className="w-32 h-32 rounded-2xl border-2 border-pink-400 shadow-lg mb-3 flex items-center justify-center text-white font-black text-[10px] uppercase" style={{ backgroundColor: outfitPreview }}>
                      Color Mode
                    </div>
                  ) : (
                    <img src={outfitPreview} alt="Outfit" className="w-32 h-32 object-cover rounded-2xl border-2 border-pink-400 shadow-lg mb-3" />
                  )}
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
                  <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-white/40' : 'text-pink-700'}`}>{t('outfitCheckDesc')}</p>
                  <div className="flex gap-2 justify-center px-4 w-full">
                    <button
                      onClick={(e) => { e.stopPropagation(); outfitRef.current?.click(); }}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all h-11
                        ${isDark ? 'bg-pink-500/20 border-pink-500/30 text-pink-300 hover:bg-pink-500/30' : 'bg-pink-600 border-pink-600 text-white shadow-sm hover:bg-pink-700'}`}
                    >
                      🖼️ {isMobile ? 'Gallery' : 'Upload'}
                    </button>
                    {isMobile && (
                      <button
                        onClick={(e) => { e.stopPropagation(); outfitCamRef.current?.click(); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all h-11
                          ${isDark ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10' : 'bg-white border-pink-200 text-pink-700 hover:bg-pink-50 shadow-sm'}`}
                      >
                        📸 Camera
                      </button>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); openWardrobePicker(); }}
                    className={`w-3/4 mx-auto mt-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all h-9 ${
                      isDark ? 'bg-pink-500/10 border-pink-500/20 text-pink-300 hover:bg-pink-500/20' : 'bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-100'
                    }`}
                  >
                    🚪 Choose from Closet
                  </button>
                  <p className={`text-[10px] mt-2 ${isDark ? 'text-white/25' : 'text-gray-400'}`}>JPG, PNG, WebP</p>
                </>
              )}
            </div>
          </div>

          <div className="hidden">
            <input ref={selfieRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleSelfie(e.target.files[0])} />
            <input ref={selfieCamRef} type="file" accept="image/*" capture="user" onChange={(e) => e.target.files?.[0] && handleSelfie(e.target.files[0])} />
            <input ref={outfitRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleOutfit(e.target.files[0])} />
            <input ref={outfitCamRef} type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files?.[0] && handleOutfit(e.target.files[0])} />
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

          {score >= 20 && (
            <div className="flex gap-2">
              {auth.currentUser ? (
                <div className="flex-1 space-y-3">
                  {(!wardrobeSaved && !showCategoryPicker) && (
                    <button
                      onClick={() => setShowCategoryPicker(true)}
                      className={`w-full py-4 rounded-2xl text-sm font-black border transition-all ${
                        isDark ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10' : 'bg-white border-gray-200 text-gray-700 hover:border-purple-400 shadow-lg shadow-purple-900/5'
                      }`}
                    >
                      👗 {t('addToWardrobe') || 'Add to Smart Closet'}
                    </button>
                  )}

                  {showCategoryPicker && !wardrobeSaved && (
                    <div className={`p-5 rounded-[2rem] border ${isDark ? 'bg-white/5 border-white/10 shadow-2xl' : 'bg-white border-purple-100 shadow-xl shadow-purple-900/10'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                          {!selectedCat ? t('chooseCategory') : t('chooseVibe')}
                        </p>
                        <button onClick={() => { setShowCategoryPicker(false); setSelectedCat(''); setSelectedTags([]); }} className="text-red-400 text-xs">✕</button>
                      </div>

                      {!selectedCat ? (
                        <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                          {/* Group categories perfectly matching Wardrobe Tabs (Male + Female combined) */}
                          {(() => {
                            const groupsMap = {};
                            
                            // Iterate all categories in the app
                            getCategoriesByGender(result?.gender || gender || 'male').forEach(cat => {
                              const sectionKey = getCategoryGroup(cat.id);
                              if (sectionKey === 'UNISEX' || sectionKey === 'OTHER') return;
                              
                              if (!groupsMap[sectionKey]) {
                                groupsMap[sectionKey] = {
                                  ...getCategorySectionMeta(cat.id),
                                  items: []
                                };
                              }
                              
                              // Avoid duplicate generic labels (e.g. "Jeans", "Shorts" exist in both male/female)
                              if (!groupsMap[sectionKey].items.find(i => i.label === cat.label)) {
                                groupsMap[sectionKey].items.push(cat);
                              }
                            });

                            // Sort sections by their official Wardrobe order (1 to 10)
                            const grouped = Object.values(groupsMap).sort((a, b) => a.order - b.order);

                            return (
                              <>
                                {grouped.map(group => (
                                  <div key={group.label}>
                                    <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                                      {group.emoji} {group.label}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                      {group.items.map(cat => (
                                        <button
                                          key={cat.id}
                                          onClick={() => setSelectedCat(cat.id)}
                                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border transition-all hover:scale-[1.02] active:scale-95 ${
                                            isDark
                                              ? 'bg-white/8 border-white/10 text-white/70 hover:bg-purple-500/20 hover:border-purple-500/30 hover:text-white'
                                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-purple-400 hover:bg-purple-50'
                                          }`}
                                        >
                                          <span className="text-base leading-none">{cat.emoji || group.emoji}</span>
                                          <span>{cat.label}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </>
                            );
                          })()}
                        </div>

                      ) : (
                        <div className="space-y-6">
                           {/* STEP: Vibe & Occasion */}
                           <div className="space-y-3">
                              <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Choose Vibes</p>
                              <div className="flex flex-wrap gap-2">
                                {['tag_campus', 'tag_office', 'tag_party', 'tag_weekend', 'tag_traditional', 'tag_gym'].map(tag => (
                                  <button
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                                      selectedTags.includes(tag)
                                        ? 'bg-purple-600 border-transparent text-white shadow-lg'
                                        : isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-slate-50 border-slate-200 text-slate-500'
                                    }`}
                                  >
                                    {t(tag)}
                                  </button>
                                ))}
                              </div>
                           </div>

                           {/* STEP: Physical Details (Fit, Fabric, Pattern) */}
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-3">
                                 <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Fit Type</p>
                                 <select 
                                    value={selectedFit} 
                                    onChange={(e) => setSelectedFit(e.target.value)}
                                    className={`w-full p-3 rounded-xl text-[10px] font-bold border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                                  >
                                    {['fit_slim', 'fit_regular', 'fit_relaxed', 'fit_oversized'].map(f => <option key={f} value={f}>{t(f)}</option>)}
                                 </select>
                              </div>
                              <div className="space-y-3">
                                 <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Fabric</p>
                                 <select 
                                    value={selectedFabric} 
                                    onChange={(e) => setSelectedFabric(e.target.value)}
                                    className={`w-full p-3 rounded-xl text-[10px] font-bold border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                                  >
                                    {['fabric_cotton', 'fabric_denim', 'fabric_linen', 'fabric_silk', 'fabric_wool'].map(f => <option key={f} value={f}>{t(f)}</option>)}
                                 </select>
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-3">
                                 <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Pattern</p>
                                 <select 
                                    value={selectedPattern} 
                                    onChange={(e) => setSelectedPattern(e.target.value)}
                                    className={`w-full p-3 rounded-xl text-[10px] font-bold border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                                  >
                                    {['pattern_solid', 'pattern_striped', 'pattern_checked', 'pattern_printed'].map(f => <option key={f} value={f}>{t(f)}</option>)}
                                 </select>
                              </div>
                              <div className="space-y-3">
                                 <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Style Mood</p>
                                 <select 
                                    value={selectedMood} 
                                    onChange={(e) => setSelectedMood(e.target.value)}
                                    className={`w-full p-3 rounded-xl text-[10px] font-bold border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                                  >
                                    {['mood_comfort', 'mood_confidence', 'mood_minimal', 'mood_attention'].map(f => <option key={f} value={f}>{t(f)}</option>)}
                                 </select>
                              </div>
                           </div>

                           <button
                             onClick={() => handleSaveToWardrobe(selectedCat)}
                             disabled={wardrobeSaving}
                             className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white font-black text-xs shadow-lg shadow-purple-900/40 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                           >
                             {wardrobeSaving ? '⌛ SYNCING DEEP METADATA...' : 'SAVE TO SMART CLOSET 🚀'}
                           </button>
                        </div>
                      )}
                    </div>
                  )}

                  {wardrobeSaved && (
                    <div className={`w-full py-4 rounded-2xl text-sm font-black border text-center ${
                      isDark ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-green-50 border-green-300 text-green-600'
                    }`}>
                      ✅ {t('syncedToWardrobe') || 'Saved to Wardrobe'}
                    </div>
                  )}
                </div>
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
                  <OutfitShopCard 
                    key={i} 
                    color={color} 
                    isDark={isDark} 
                    gender={gender} 
                    onShop={(q, b) => { setShopItem(q); setShopBudget(b); }}
                  />
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
        </>
      )}

      {/* Wardrobe Picker Overlay */}
      {showWardrobePicker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl overflow-hidden flex flex-col max-h-[85vh] ${isDark ? 'bg-gray-900 border border-white/10' : 'bg-white shadow-2xl'}`}>
            <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              <div>
                <h3 className={`font-black text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Smart Closet</h3>
                <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Select an item to check</p>
              </div>
              <button onClick={() => setShowWardrobePicker(false)} className={`w-8 h-8 flex items-center justify-center rounded-full ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'}`}>✕</button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {loadingWardrobe ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>
              ) : wardrobeItems.length === 0 ? (
                <div className="text-center py-10">
                  <span className="text-4xl mb-2 block">👗</span>
                  <p className={`font-bold ${isDark ? 'text-white/70' : 'text-gray-600'}`}>Your closet is empty</p>
                </div>
              ) : (
                  <div className="grid grid-cols-2 gap-3 pb-4">
                    {wardrobeItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => selectWardrobeItem(item)}
                        className={`text-left rounded-xl p-3 border transition-all hover:scale-[1.02] active:scale-95 ${isDark ? 'bg-white/5 border-white/10 hover:border-purple-400/50' : 'bg-gray-50 border-gray-200 hover:border-purple-400'}`}
                      >
                        {item.imageId ? (
                          <WardrobeThumbnail imageId={item.imageId} />
                        ) : (
                          <div className="w-full h-24 rounded-lg mb-2 shadow-inner border border-white/10 flex items-center justify-center" style={{ backgroundColor: item.hex }}>
                             <span className="text-white text-[8px] font-black opacity-30 uppercase tracking-tighter">Color Mode</span>
                          </div>
                        )}
                        <p className={`text-xs font-black truncate mb-0.5 ${isDark ? 'text-white' : 'text-gray-800'}`}>{item.color_name || 'Clothing Item'}</p>
                        <div className="flex items-center justify-between">
                          <p className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-gray-500'}`}>{item.category || 'Item'}</p>
                          <span className="text-[9px]">
                            {item.source === 'smart_shop' ? '🛒' : item.source === 'color_scanner' ? '🎨' : '👗'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PaywallModal removed */}
      <ShopActionSheet 
        isOpen={!!shopItem}
        onClose={() => { setShopItem(null); setShopBudget(null); }}
        item={shopItem}
        gender={gender}
        budget={shopBudget}
      />
    </div>
  );
}

export default OutfitChecker;
