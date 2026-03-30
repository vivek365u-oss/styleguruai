import { useState, useEffect, useContext } from 'react';
import { getWardrobe, deleteWardrobeItem, getWardrobeCount } from '../api/styleApi';
import { auth } from '../api/styleApi';
import { ThemeContext } from '../App';
import { useLanguage } from '../i18n/LanguageContext';
import { usePlan } from '../context/PlanContext';
import { getLocalWardrobeImage, deleteLocalWardrobeImage } from '../utils/indexedDB';
import HistoryPanel from './HistoryPanel';

// ── Saved Colors Tab ─────────────────────────────────────────
function SavedColorsTab({ isDark }) {
  const { t } = useLanguage();
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sg_saved_colors') || '[]'); } catch { return []; }
  });

  const remove = (hex) => {
    const updated = saved.filter(c => c.hex !== hex);
    localStorage.setItem('sg_saved_colors', JSON.stringify(updated));
    setSaved(updated);
  };

  const cardCls = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm';
  const nameCls = isDark ? 'text-white' : 'text-gray-800';
  const hexCls = isDark ? 'text-white/30' : 'text-gray-400';

  if (saved.length === 0) {
    return (
      <div className="text-center py-10 mt-8">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
          <span className="text-4xl">🤍</span>
        </div>
        <p className={`font-bold text-xl mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('noSavedColors')}</p>
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{t('tapToSaveColor')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className={`font-black text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>🎨 {t('savedColors')}</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{saved.length} {t('colors')}</p>
        </div>
      </div>
      {saved.map((color, i) => (
        <div key={i} className={`${cardCls} rounded-2xl p-4 flex items-center gap-4`}>
          <div className="w-12 h-12 rounded-xl flex-shrink-0 shadow-lg border border-white/10" style={{ backgroundColor: color.hex }} />
          <div className="flex-1 min-w-0">
            <p className={`${nameCls} font-bold text-sm`}>{color.name}</p>
            <p className={`${hexCls} text-xs font-mono`}>{color.hex}</p>
          </div>
          <button onClick={() => remove(color.hex)} className="text-red-400/60 hover:text-red-400 text-2xl transition-colors px-2">✕</button>
        </div>
      ))}
      <button
        onClick={() => { localStorage.removeItem('sg_saved_colors'); setSaved([]); }}
        className={`mt-4 w-full py-3 text-xs font-semibold rounded-xl border transition ${isDark ? 'border-white/10 text-white/30 hover:text-red-400 hover:border-red-500/30' : 'border-gray-200 text-gray-400 hover:text-red-500'}`}
      >
        {t('clearAllColors')}
      </button>
    </div>
  );
}

function WardrobeImage({ imageId, fallbackColor, isDark }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (!imageId) return;
    getLocalWardrobeImage(imageId).then(data => {
      if (data) setSrc(data);
    });
  }, [imageId]);

  if (src) {
    return <img src={src} alt="Wardrobe item" className="w-12 h-12 object-cover rounded-xl shadow border border-white/20" />;
  }
  return (
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/20 shadow"
      style={{ backgroundColor: fallbackColor || '#C68642' }}
    >
      <span className="text-xl">👗</span>
    </div>
  );
}

function SkeletonCard({ isDark }) {
  return (
    <div className={`rounded-2xl p-4 border animate-pulse ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
        <div className="flex-1 space-y-2">
          <div className={`h-3 rounded-full w-3/4 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
          <div className={`h-3 rounded-full w-1/2 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
        </div>
      </div>
    </div>
  );
}

function WardrobePanel({ user, onShowResult }) {
  const { theme } = useContext(ThemeContext);
  const { t, language } = useLanguage();
  const { isPro } = usePlan();
  const wardrobeLimit = isPro ? 50 : 10;
  const isDark = theme === 'dark';
  const [activeSubTab, setActiveSubTab] = useState('saved'); // 'saved' or 'history'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [capWarning, setCapWarning] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!auth.currentUser) { setLoading(false); return; }
    const timeout = setTimeout(() => {
      if (loading) { setError(t('somethingWrong')); setLoading(false); }
    }, 3000);

    getWardrobe(auth.currentUser.uid)
      .then(data => {
        clearTimeout(timeout);
        setItems(data);
        setLoading(false);
      })
      .catch(() => {
        clearTimeout(timeout);
        setError(t('somethingWrong'));
        setLoading(false);
      });

    getWardrobeCount(auth.currentUser.uid).then(count => {
      if (count >= wardrobeLimit) setCapWarning(true);
    });

    return () => clearTimeout(timeout);
  }, []);

  const handleDelete = async (item) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setDeletingId(item.id);
    // Optimistic removal
    setItems(prev => prev.filter(i => i.id !== item.id));
    try {
      await deleteWardrobeItem(uid, item.id);
      if (item.imageId) {
        await deleteLocalWardrobeImage(item.imageId);
      }
      showToast(t('outfitRemoved'));
    } catch {
      // Restore on failure
      setItems(prev => [item, ...prev].sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at)));
      showToast(t('deleteFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return ''; }
  };

  if (!auth.currentUser) {
    return (
      <div className="mt-8 text-center">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
          <span className="text-4xl">👗</span>
        </div>
        <h3 className={`font-bold text-xl mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('myWardrobe')}</h3>
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{t('wardrobeLimitNote')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-4 space-y-3">
        <h2 className={`font-black text-2xl mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>👗 {t('myWardrobe')}</h2>
        {[1, 2, 3].map(i => <SkeletonCard key={i} isDark={isDark} />)}
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
    <div className="mt-4 pb-4">
      {/* Sub-Tabs Nav */}
      <div className={`flex rounded-full mb-6 p-1 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
        <button
          onClick={() => setActiveSubTab('saved')}
          className={`flex-1 py-1.5 text-xs sm:text-sm sm:py-2 font-bold rounded-full transition-all ${activeSubTab === 'saved' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
        >
          👗 {t('outfits')}
        </button>
        <button
          onClick={() => setActiveSubTab('colors')}
          className={`flex-1 py-1.5 text-xs sm:text-sm sm:py-2 font-bold rounded-full transition-all ${activeSubTab === 'colors' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
        >
          🎨 {t('colors')}
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 py-1.5 text-xs sm:text-sm sm:py-2 font-bold rounded-full transition-all ${activeSubTab === 'history' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
        >
          📋 {t('history')}
        </button>
      </div>

      {activeSubTab === 'history' ? (
        <HistoryPanel onShowResult={onShowResult} />
      ) : activeSubTab === 'colors' ? (
        <SavedColorsTab isDark={isDark} />
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`font-black text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>👗 {t('myWardrobe')}</h2>
              <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{items.length} {t('outfits')}</p>
            </div>
            <div className={`rounded-xl px-3 py-2 border ${isDark ? 'bg-purple-500/20 border-purple-500/30' : 'bg-purple-50 border-purple-200'}`}>
              <span className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>{items.length}/{wardrobeLimit}</span>
            </div>
          </div>

      {capWarning && (
        <div className={`rounded-2xl p-3 mb-4 border flex items-center gap-3 ${isDark ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200'}`}>
          <span className="text-xl">⚠️</span>
          <p className={`text-xs ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>{t('wardrobeFull', { current: items.length, limit: wardrobeLimit })}</p>
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-8 text-center">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
            <span className="text-4xl">👗</span>
          </div>
          <h3 className={`font-bold text-xl mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('noOutfitsSaved')}</h3>
          <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{t('analyzeToSave')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
              {/* Card header */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <WardrobeImage imageId={item.imageId} fallbackColor={item.skin_hex} isDark={isDark} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`font-bold text-sm capitalize ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {item.outfit_data?.shirt || item.outfit_data?.dress || 'Outfit'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.source === 'outfit_checker'
                        ? isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/20' : 'bg-blue-100 text-blue-700 border-blue-300'
                        : isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/20' : 'bg-purple-100 text-purple-700 border-purple-300'
                    }`}>
                      {item.source === 'outfit_checker' ? t('checked') : t('analyzed')}
                    </span>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{formatDate(item.saved_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{expandedId === item.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded detail */}
              {expandedId === item.id && (
                <div className={`px-4 pb-4 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                  <div className="pt-3 space-y-2">
                    {item.outfit_data?.shirt && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">👕</span>
                        <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-700'}`}>{item.outfit_data.shirt}</p>
                      </div>
                    )}
                    {item.outfit_data?.dress && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">👗</span>
                        <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-700'}`}>{item.outfit_data.dress}</p>
                      </div>
                    )}
                    {item.outfit_data?.pant && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">👖</span>
                        <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-700'}`}>{item.outfit_data.pant}</p>
                      </div>
                    )}
                    {item.outfit_data?.shoes && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">👟</span>
                        <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-700'}`}>{item.outfit_data.shoes}</p>
                      </div>
                    )}
                    {item.outfit_data?.occasion && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📅</span>
                        <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{item.outfit_data.occasion}</p>
                      </div>
                    )}
                    {item.compatibility_score !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🎯</span>
                        <p className={`text-xs font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{item.compatibility_score}% compatible</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                    className={`mt-3 w-full py-2 rounded-xl text-xs font-bold border transition-all ${
                      isDark
                        ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                        : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                    } disabled:opacity-50`}
                  >
                    {deletingId === item.id ? t('deleting') : t('removeFromWardrobe')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-white/10">
          {toast}
        </div>
      )}
        </>
      )}
    </div>
  );
}

export default WardrobePanel;
