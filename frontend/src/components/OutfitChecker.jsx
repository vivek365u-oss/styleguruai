import { useState, useRef, useContext } from 'react';
import { checkOutfitCompatibility } from '../api/styleApi';
import { ThemeContext } from '../App';
import { useLanguage } from '../i18n/LanguageContext';

function OutfitChecker() {
  const { theme } = useContext(ThemeContext);
  const { t } = useLanguage();
  const isDark = theme === 'dark';
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [outfitPreview, setOutfitPreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [outfitFile, setOutfitFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await checkOutfitCompatibility(selfieFile, outfitFile);
      setResult(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'object') setError(detail.message || 'Analysis failed.');
      else setError(detail || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelfiePreview(null); setOutfitPreview(null);
    setSelfieFile(null); setOutfitFile(null);
    setResult(null); setError(null);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Selfie Upload */}
            <div
              onClick={() => selfieRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 ${isDark ? 'border-blue-500/30 bg-blue-500/5 hover:border-blue-400/50 hover:bg-blue-500/10' : 'border-blue-300 bg-blue-50 hover:border-blue-400 hover:bg-blue-100'}`}
            >
              <input ref={selfieRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files?.[0] && handleSelfie(e.target.files[0])} className="hidden" />
              {selfiePreview ? (
                <div className="flex flex-col items-center">
                  <img src={selfiePreview} alt="Selfie" className="w-32 h-32 object-cover rounded-2xl border-2 border-blue-500/30 shadow-lg mb-3" />
                  <p className="text-blue-500 text-sm font-medium">✅ Selfie ready!</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Click to change</p>
                </div>
              ) : (
                <>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <span className="text-3xl">🤳</span>
                  </div>
                  <p className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('yourSelfie')}</p>
                  <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{t('clearFacePhoto')}</p>
                  <p className={`text-xs mt-2 ${isDark ? 'text-white/25' : 'text-gray-400'}`}>JPG, PNG, WebP</p>
                </>
              )}
            </div>

            {/* Outfit Upload */}
            <div
              onClick={() => outfitRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 ${isDark ? 'border-pink-500/30 bg-pink-500/5 hover:border-pink-400/50 hover:bg-pink-500/10' : 'border-pink-300 bg-pink-50 hover:border-pink-400 hover:bg-pink-100'}`}
            >
              <input ref={outfitRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files?.[0] && handleOutfit(e.target.files[0])} className="hidden" />
              {outfitPreview ? (
                <div className="flex flex-col items-center">
                  <img src={outfitPreview} alt="Outfit" className="w-32 h-32 object-cover rounded-2xl border-2 border-pink-500/30 shadow-lg mb-3" />
                  <p className="text-pink-500 text-sm font-medium">✅ Outfit ready!</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Click to change</p>
                </div>
              ) : (
                <>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 ${isDark ? 'bg-pink-500/20' : 'bg-pink-100'}`}>
                    <span className="text-3xl">👗</span>
                  </div>
                  <p className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('outfitPhoto')}</p>
                  <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{t('outfitCheckDesc')}</p>
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
            <div className={`rounded-2xl p-4 border ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
              <p className={`font-bold text-sm mb-2 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>🤳 Selfie Tips:</p>
              <ul className="space-y-1">
                {[t('clearFacePhotoTip'), t('goodLighting'), t('noSunglasses')].map((tip, i) => (
                  <li key={i} className={`text-xs flex items-center gap-2 ${isDark ? 'text-white/50' : 'text-gray-600'}`}>
                    <span className="text-blue-400">•</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`rounded-2xl p-4 border ${isDark ? 'bg-pink-500/10 border-pink-500/20' : 'bg-pink-50 border-pink-200'}`}>
              <p className={`font-bold text-sm mb-2 ${isDark ? 'text-pink-300' : 'text-pink-600'}`}>👗 Outfit Tips:</p>
              <ul className="space-y-1">
                {[t('plainBackground'), t('fullOutfitVisible'), t('clearBrightPhoto')].map((tip, i) => (
                  <li key={i} className={`text-xs flex items-center gap-2 ${isDark ? 'text-white/50' : 'text-gray-600'}`}>
                    <span className="text-pink-400">•</span>{tip}
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
            <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h3 className={`font-black text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>💡 Better Alternatives</h3>
              <div className="space-y-3">
                {compatibility.better_alternatives.map((color, i) => (
                  <div key={i} className={`flex items-center gap-3 rounded-xl p-3 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="w-10 h-10 rounded-lg border border-white/20 flex-shrink-0" style={{ backgroundColor: color.hex }} />
                    <div>
                      <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{color.name}</p>
                      <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{color.reason}</p>
                    </div>
                  </div>
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
    </div>
  );
}

export default OutfitChecker;