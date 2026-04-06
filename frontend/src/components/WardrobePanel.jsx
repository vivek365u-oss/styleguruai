import { useState, useEffect, useContext, useRef } from 'react';
import { getWardrobe, deleteWardrobeItem, getWardrobeCount, getSavedColors, deleteSavedColor, deleteAllSavedColors } from '../api/styleApi';
import { auth } from '../api/styleApi';
import { ThemeContext } from '../App';
import { useLanguage } from '../i18n/LanguageContext';
import { usePlan } from '../context/PlanContext';
import { getLocalWardrobeImage, deleteLocalWardrobeImage } from '../utils/indexedDB';
import HistoryPanel from './HistoryPanel';

// ── Saved Colors Tab ─────────────────────────────────────────
function SavedColorsTab({ isDark, user, onViewHistory }) {
  const { t } = useLanguage();
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    getSavedColors(auth.currentUser.uid)
      .then(data => { setSaved(data); setLoading(false); })
      .catch(err => {
        console.error('Failed to load saved colors:', err);
        setError(t('somethingWrong'));
        setLoading(false);
      });
  }, [user]);

  const remove = async (colorId) => {
    if (!auth.currentUser) return;
    setDeletingId(colorId);
    setSaved(prev => prev.filter(c => c.id !== colorId));
    try {
      await deleteSavedColor(auth.currentUser.uid, colorId);
    } catch {
      getSavedColors(auth.currentUser.uid).then(setSaved);
    } finally {
      setDeletingId(null);
    }
  };

  const clearAll = async () => {
    if (!auth.currentUser) return;
    if (!window.confirm(t('confirmClearAllColors') || 'Are you sure you want to delete all saved colors?')) return;
    setSaved([]);
    try {
      await deleteAllSavedColors(auth.currentUser.uid);
    } catch {
      getSavedColors(auth.currentUser.uid).then(setSaved);
    }
  };

  const cardCls = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm';
  const nameCls = isDark ? 'text-white' : 'text-gray-800';
  const hexCls = isDark ? 'text-white/30' : 'text-gray-400';

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className={`${cardCls} rounded-2xl p-4 animate-pulse`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
              <div className="flex-1 space-y-2">
                <div className={`h-3 rounded-full w-3/4 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                <div className={`h-3 rounded-full w-1/2 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-2xl p-4 border text-center ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
        <p className={isDark ? 'text-red-300 text-sm' : 'text-red-600 text-sm'}>{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-10 mt-8">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
          <span className="text-4xl">🔐</span>
        </div>
        <p className={`font-bold text-xl mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('loginRequired')}</p>
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{t('loginToSaveColors')}</p>
      </div>
    );
  }

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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className={`font-black text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>🎨 {t('savedColors')}</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{saved.length} {t('colors')}</p>
        </div>
        <button
          onClick={onViewHistory}
          className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
            isDark
              ? 'bg-indigo-500/20 hover:bg-indigo-500/30 border-indigo-500/30 text-indigo-300 hover:text-indigo-200'
              : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-300 text-indigo-600 hover:text-indigo-700'
          }`}
        >
          📋 {t('viewHistory')}
        </button>
      </div>
      {saved.map((color) => (
        <div key={color.id} className={`${cardCls} rounded-2xl p-4 flex items-center gap-4`}>
          <div className="w-12 h-12 rounded-xl flex-shrink-0 shadow-lg border border-white/10" style={{ backgroundColor: color.hex }} />
          <div className="flex-1 min-w-0">
            <p className={`${nameCls} font-bold text-sm`}>{color.name || 'Color'}</p>
            <p className={`${hexCls} text-xs font-mono`}>{color.hex}</p>
          </div>
          <button
            onClick={() => remove(color.id)}
            disabled={deletingId === color.id}
            className="text-red-400/60 hover:text-red-400 text-2xl transition-colors px-2 disabled:opacity-50"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={clearAll}
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

  // Sub-tab state & swipe support
  const [activeSubTab, setActiveSubTab] = useState('saved'); // 'saved' | 'colors' | 'history'
  const wardrobeSwipeRef = useRef({ startX: 0, startY: 0 });
  const subTabOrder = ['saved', 'colors', 'history'];

  const handleWardrobeSwipe = (endX, endY) => {
    const diff = wardrobeSwipeRef.current.startX - endX;
    const dy = Math.abs(endY - wardrobeSwipeRef.current.startY);
    if (Math.abs(diff) < dy * 0.8 || Math.abs(diff) < 50) return;
    const idx = subTabOrder.indexOf(activeSubTab);
    if (diff > 0 && idx < subTabOrder.length - 1) setActiveSubTab(subTabOrder[idx + 1]);
    if (diff < 0 && idx > 0) setActiveSubTab(subTabOrder[idx - 1]);
  };

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
    setItems(prev => prev.filter(i => i.id !== item.id));
    try {
      await deleteWardrobeItem(uid, item.id);
      if (item.imageId) await deleteLocalWardrobeImage(item.imageId);
      showToast(t('outfitRemoved'));
    } catch {
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
      {/* Sub-Tab Nav — equal distribution, no overflow scroll needed */}
      <div className="mb-6">
        <div
          className={`flex rounded-2xl p-1 gap-1 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}
          role="tablist"
        >
          {[
            { id: 'saved',   label: t('outfits'), icon: '👗' },
            { id: 'colors',  label: t('colors'),  icon: '🎨' },
            { id: 'history', label: t('history'), icon: '📋' },
          ].map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeSubTab === tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : isDark ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Swipeable tab content */}
      <div
        onTouchStart={(e) => {
          wardrobeSwipeRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY };
        }}
        onTouchEnd={(e) => handleWardrobeSwipe(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
      >
        {activeSubTab === 'history' ? (
          <HistoryPanel onShowResult={onShowResult} />
        ) : activeSubTab === 'colors' ? (
          <SavedColorsTab isDark={isDark} user={user} onViewHistory={() => setActiveSubTab('history')} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className={`font-black text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>👗 {t('myWardrobe')}</h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{items.length} {t('outfits')}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setActiveSubTab('history')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                    isDark
                      ? 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 text-blue-300 hover:text-blue-200'
                      : 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-600 hover:text-blue-700'
                  }`}
                >
                  📋 {t('history')}
                </button>
                <div className={`rounded-xl px-3 py-2 border ${isDark ? 'bg-purple-500/20 border-purple-500/30' : 'bg-purple-50 border-purple-200'}`}>
                  <span className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>{items.length}/{wardrobeLimit}</span>
                </div>
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
                      <span className={`text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{expandedId === item.id ? '▲' : '▼'}</span>
                    </div>

                    {expandedId === item.id && (
                      <div className={`px-4 pb-4 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                        <div className="pt-3 space-y-2">
                          {item.outfit_data?.shirt && (<div className="flex items-center gap-2"><span className="text-sm">👕</span><p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-700'}`}>{item.outfit_data.shirt}</p></div>)}
                          {item.outfit_data?.dress && (<div className="flex items-center gap-2"><span className="text-sm">👗</span><p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-700'}`}>{item.outfit_data.dress}</p></div>)}
                          {item.outfit_data?.pant && (<div className="flex items-center gap-2"><span className="text-sm">👖</span><p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-700'}`}>{item.outfit_data.pant}</p></div>)}
                          {item.outfit_data?.shoes && (<div className="flex items-center gap-2"><span className="text-sm">👟</span><p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-700'}`}>{item.outfit_data.shoes}</p></div>)}
                          {item.outfit_data?.occasion && (<div className="flex items-center gap-2"><span className="text-sm">📅</span><p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{item.outfit_data.occasion}</p></div>)}
                          {item.compatibility_score !== undefined && (<div className="flex items-center gap-2"><span className="text-sm">🎯</span><p className={`text-xs font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{item.compatibility_score}% compatible</p></div>)}
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
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-white/10">
          {toast}
        </div>
      )}
    </div>
  );
}

export default WardrobePanel;
