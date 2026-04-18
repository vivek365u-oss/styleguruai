import { useState, useEffect, useContext } from 'react';
import { getHistory, getSavedColors, deleteSavedColor, auth, db } from '../api/styleApi';
import { doc, deleteDoc } from 'firebase/firestore';
import { useAuthState } from '../hooks/useAuthState';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { usePlan } from '../context/PlanContext';
import { FashionIcons, IconRenderer } from './Icons';


// ── Skin preview lightbox modal ─────────────────────────────────
function ImageModal({ src, onClose }) {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div className="relative max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <img
          src={src}
          alt="Skin analysis"
          className="w-full max-h-[75vh] object-contain rounded-3xl shadow-2xl border border-white/20"
        />
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white text-gray-900 flex items-center justify-center font-black text-lg shadow-xl z-10 hover:bg-gray-100 active:scale-95 transition-all"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function HistoryPanel({ onShowResult }) {
  const { theme } = useContext(ThemeContext);
  const { t, language } = useLanguage();
  const { isPro } = usePlan();
  const historyLimit = isPro ? 100 : 10;
  const isDark = theme === 'dark';
  const { user } = useAuthState();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colorsLoading, setColorsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('analyses'); // 'analyses' | 'colors'
  const [savedColors, setSavedColors] = useState([]);
  const [deletingColorId, setDeletingColorId] = useState(null);
  const [deletingHistoryId, setDeletingHistoryId] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  // Tone color map
  const toneColors = {
    fair: '#F5DEB3', light: '#D2A679', medium: '#C68642',
    olive: '#A0724A', brown: '#7B4F2E', dark: '#4A2C0A',
  };

  // Initial load
  useEffect(() => {
    if (user) {
      fetchHistory();
      fetchColors();
    } else {
      setLoading(false);
    }
  }, [user?.uid, isPro]);

  // Re-fetch when switching tabs to ensure freshness
  useEffect(() => {
    if (activeTab === 'colors' && user) {
      fetchColors();
    }
  }, [activeTab, user?.uid]);

  const fetchHistory = async () => {
    try {
      const res = await getHistory(historyLimit);
      setHistory(res.data.history || []);
    } catch {
      setError(t('failedHistory'));
    } finally {
      setLoading(false);
    }
  };

  const fetchColors = async () => {
    if (!user) return;
    setColorsLoading(true);
    try {
      const colors = await getSavedColors(user.uid);
      setSavedColors(colors || []);
    } catch (err) {
      console.error('Failed to fetch saved colors:', err);
    } finally {
      setColorsLoading(false);
    }
  };

  const removeColor = async (colorId) => {
    if (!user) return;
    setDeletingColorId(colorId);
    setSavedColors(prev => prev.filter(c => c.id !== colorId));
    try {
      await deleteSavedColor(user.uid, colorId);
    } catch {
      fetchColors();
    } finally {
      setDeletingColorId(null);
    }
  };

  // ── Delete a history entry from Firestore ────────────────────
  const deleteHistoryEntry = async (entryId) => {
    if (!user || !entryId) return;
    setDeletingHistoryId(entryId);
    // Optimistic remove
    setHistory(prev => prev.filter(h => h.id !== entryId));
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'history', entryId));
    } catch (err) {
      console.error('[HistoryPanel] Delete failed:', err);
      fetchHistory(); // restore on failure
    } finally {
      setDeletingHistoryId(null);
    }
  };


  if (loading) {
    return (
      <div className="mt-8 text-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{t('loadingHistory')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`mt-8 rounded-2xl p-6 text-center border ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
        <p className={isDark ? 'text-red-300' : 'text-red-600'}>{error}</p>
      </div>
    );
  }

  return (
    <>
      <ImageModal src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

      <div className="mt-4">
        {/* Tab Switcher */}
        <div className={`flex rounded-2xl p-1 mb-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
          {[
            { id: 'analyses', label: t('analyses') || 'Analyses', icon: FashionIcons.Accuracy },
            { id: 'colors', label: t('savedColors') || 'Saved Colors', icon: FashionIcons.Analysis }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : isDark ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
            >
              <span className="w-4 h-4"><IconRenderer icon={tab.icon} /></span>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'analyses' ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={`font-black text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('yourHistory')}</h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Total {history.length} analyses</p>
              </div>
              {history.length > 0 && (
                <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl px-3 py-2">
                  <span className="text-purple-500 text-sm font-medium">{language === 'hi' ? `पिछले ${history.length} परिणाम` : `Last ${history.length} results`}</span>
                </div>
              )}
            </div>

            {history.length === 0 ? (
              <div className="mt-8 text-center py-10">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border p-5 ${isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                  <IconRenderer icon={FashionIcons.Analysis} />
                </div>
                <h3 className={`font-bold text-xl mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('noHistory')}</h3>
                <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{t('noHistoryDesc')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item, i) => {
                  const skinTone = item.skinTone || item.skin_tone;
                  const undertone = item.undertone;
                  const season = item.season || item.color_season;
                  const dateStr = item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                  const hasFullData = !!item.fullData;
                  const skinColor = item.skinHex || toneColors[skinTone] || '#C68642';
                  const isDeleting = deletingHistoryId === item.id;

                  return (
                    <div key={item.id || i} className={`rounded-2xl p-4 border transition-all ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'} ${isDeleting ? 'opacity-40 scale-95' : ''}`}>
                      <div className="flex items-center gap-4">
                        {/* Skin tone circle — tap to see enlarged */}
                        <button
                          onClick={() => setLightboxSrc(null)} // no selfie image stored, show placeholder
                          className="w-12 h-12 rounded-xl flex-shrink-0 border-2 border-white/20 shadow-lg transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                          style={{ backgroundColor: skinColor }}
                          title="Skin tone preview"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`font-bold capitalize text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{t(skinTone)} {language === 'hi' ? 'त्वचा' : 'skin'}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/20' : 'bg-purple-100 text-purple-700 border-purple-300'}`}>{t(undertone)}</span>
                            {season && (
                              <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${isDark ? 'bg-pink-500/20 text-pink-300 border-pink-500/20' : 'bg-pink-100 text-pink-700 border-pink-300'}`}>
                                <IconRenderer icon={FashionIcons.Star} className="w-3 h-3" /> {t(season)}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{dateStr}</p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {hasFullData && onShowResult && (
                            <button
                              onClick={() => onShowResult(item.fullData)}
                              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition"
                            >
                              View →
                            </button>
                          )}
                          {item.id && (
                            <button
                              onClick={() => deleteHistoryEntry(item.id)}
                              disabled={isDeleting}
                              className={`p-2 rounded-xl transition-all ${
                                isDark
                                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                                  : 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-200'
                              } ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                              title="Delete this analysis"
                            >
                              {isDeleting ? (
                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-black text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('savedColors')}</h2>
              <div className={`rounded-xl px-3 py-1.5 border ${isDark ? 'bg-pink-500/10 border-pink-500/20' : 'bg-pink-50 border-pink-200'}`}>
                <span className={`text-xs font-bold ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>{savedColors.length} saved</span>
              </div>
            </div>

            {colorsLoading ? (
              <div className="text-center py-20 flex flex-col items-center">
                 <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                 <p className="text-xs opacity-50">Syncing colors...</p>
              </div>
            ) : savedColors.length === 0 ? (
              <div className="text-center py-10 mt-4">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border p-5 ${isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                  <IconRenderer icon={FashionIcons.Analysis} />
                </div>
                <h3 className={`font-bold text-xl mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('noSavedColors')}</h3>
                <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{t('tapToSaveColor')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedColors.map(color => (
                  <div key={color.id} className={`rounded-2xl p-4 border flex items-center gap-4 ${isDark ? 'bg-white/5 border-white/10 shadow-lg' : 'bg-white border-gray-200 shadow-sm'}`}>
                    {/* Color swatch — tap to enlarge */}
                    <button
                      onClick={() => setLightboxSrc(null)}
                      className="w-12 h-12 rounded-xl border-2 border-white/20 shadow-inner flex-shrink-0 transition-transform hover:scale-110"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="flex-1">
                      <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{color.name || 'Custom Color'}</p>
                      <p className={`text-xs font-mono uppercase ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{color.hex}</p>
                      {color.category && <p className="text-[10px] opacity-40 uppercase tracking-widest">{color.category} • {color.gender || 'neutral'}</p>}
                    </div>
                    <button
                      onClick={() => removeColor(color.id)}
                      disabled={deletingColorId === color.id}
                      className={`p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                    >
                      {deletingColorId === color.id ? '...' : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default HistoryPanel;
