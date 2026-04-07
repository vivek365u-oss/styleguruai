import { useState, useEffect, useContext } from 'react';
import { getWardrobe, deleteWardrobeItem, getWardrobeCount } from '../api/styleApi';
import { auth } from '../api/styleApi';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { usePlan } from '../context/PlanContext';
import { getLocalWardrobeImage, deleteLocalWardrobeImage } from '../utils/indexedDB';

// ── Helpers ──────────────────────────────────────────────────
function WardrobeImage({ imageId, fallbackColor }) {
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

// ── Main Component ──────────────────────────────────────────
function WardrobePanel({ onShowResult, gender = 'male' }) {
  const { theme } = useContext(ThemeContext);
  const { t, language } = useLanguage();
  const { isPro } = usePlan();
  const wardrobeLimit = isPro ? 50 : 10;
  const isDark = theme === 'dark';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [capWarning, setCapWarning] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('all');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!auth.currentUser) { setLoading(false); return; }
    fetchWardrobe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wardrobeLimit]);

  const fetchWardrobe = async () => {
    try {
      const data = await getWardrobe(auth.currentUser.uid);
      setItems(data);
      const count = await getWardrobeCount(auth.currentUser.uid);
      if (count >= wardrobeLimit) setCapWarning(true);
    } catch {
      setError(t('somethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    const cat = (item.category || '').toLowerCase();
    const data = item.outfit_data || {};

    if (filter === 'shirts') return cat === 'shirts' || !!data.shirt;
    if (filter === 'tshirts') return cat === 'tshirts' || !!data.tshirt;
    if (filter === 'tops') return cat === 'tops' || !!data.top;
    if (filter === 'kurti') return cat === 'kurti' || !!data.kurti;
    if (filter === 'pants') return cat === 'pants' || !!data.pant;
    if (filter === 'bottoms') return cat === 'bottoms' || !!data.bottom;
    if (filter === 'ethnic') return cat === 'ethnic' || !!data.ethnic;
    if (filter === 'saree') return cat === 'saree' || !!data.saree;
    if (filter === 'suits') return cat === 'suits' || !!data.suite;
    if (filter === 'dresses') return cat === 'dresses' || !!data.dress;
    if (filter === 'formal') return cat === 'formal';
    if (filter === 'shoes') return cat === 'shoes' || !!data.shoes;
    if (filter === 'jewelry') return cat === 'jewelry' || !!data.jewelry;
    if (filter === 'makeup') return cat === 'makeup';

    return true;
  });

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
      fetchWardrobe();
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
      <div className="mt-8 text-center pt-10">
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

  return (
    <div className="mt-4 pb-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className={`font-black text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>👗 {t('myWardrobe')}</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{items.length} {t('outfits')}</p>
        </div>
        <div className={`rounded-xl px-3 py-2 border ${isDark ? 'bg-purple-500/20 border-purple-500/30' : 'bg-purple-50 border-purple-200'}`}>
          <span className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>{items.length}/{wardrobeLimit}</span>
        </div>
      </div>

      {/* Closet Filters - Gender Aware */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'all', label: t('cat_all'), icon: '🌈' },
          ...(gender === 'female' ? [
            { id: 'tops', label: t('cat_tops'), icon: '👚' },
            { id: 'kurti', label: t('cat_kurti'), icon: '👗' },
            { id: 'saree', label: t('cat_saree'), icon: '🥻' },
            { id: 'suits', label: t('cat_suits'), icon: '👘' },
            { id: 'dresses', label: t('cat_dresses'), icon: '💃' },
            { id: 'bottoms', label: t('cat_bottoms'), icon: '👖' },
            { id: 'jewelry', label: t('cat_jewelry'), icon: '✨' },
          ] : [
            { id: 'shirts', label: t('cat_shirts'), icon: '👕' },
            { id: 'tshirts', label: t('cat_tshirts'), icon: '👕' },
            { id: 'pants', label: t('cat_pants'), icon: '👖' },
            { id: 'ethnic', label: t('cat_ethnic'), icon: '🧥' },
            { id: 'formal', label: t('cat_formal'), icon: '👔' },
            { id: 'shoes', label: t('cat_shoes'), icon: '👟' },
          ])
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-tight transition-all border whitespace-nowrap ${
              filter === f.id
                ? 'bg-purple-500 border-purple-500 text-white shadow-lg'
                : isDark ? 'bg-white/5 border-white/10 text-white/50 hover:text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-purple-300'
            }`}
          >
            <span>{f.icon}</span>
            {f.label}
          </button>
        ))}
      </div>

      {capWarning && (
        <div className={`rounded-2xl p-3 mb-4 border flex items-center gap-3 ${isDark ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200'}`}>
          <span className="text-xl">⚠️</span>
          <p className={`text-xs ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>{t('wardrobeFull', { current: items.length, limit: wardrobeLimit })}</p>
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-8 text-center py-10">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
            <span className="text-4xl">👗</span>
          </div>
          <h3 className={`font-bold text-xl mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('noOutfitsSaved')}</h3>
          <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{t('analyzeToSave')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => (
            <div key={item.id} className={`rounded-[2rem] border overflow-hidden transition-all duration-300 ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}>
              <div
                className="flex items-center gap-4 p-5 cursor-pointer"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="relative">
                    <WardrobeImage imageId={item.imageId} fallbackColor={item.hex || item.skin_hex} />
                    {item.hex && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: item.hex }} />
                    )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`font-black text-sm capitalize tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {item.category ? t(`cat_${item.category}`) : (item.outfit_data?.shirt || item.outfit_data?.top || 'Style Item')}
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border border-dashed ${
                      item.source === 'outfit_checker'
                        ? isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'
                        : isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-600 border-purple-200'
                    }`}>
                      {item.source === 'outfit_checker' ? 'CHECK' : 'SCAN'}
                    </span>
                  </div>
                  
                  {/* Tags Preview */}
                  {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                          {item.tags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="text-[8px] font-black uppercase opacity-40">#{t(tag)}</span>
                          ))}
                          {item.tags.length > 2 && <span className="text-[8px] font-black opacity-40">+{item.tags.length - 2}</span>}
                      </div>
                  )}
                </div>
                
                <div className="text-right">
                    <p className={`text-[10px] font-bold ${isDark ? 'text-white/20' : 'text-slate-300'}`}>{formatDate(item.saved_at)}</p>
                    <span className={`text-[10px] mt-1 block ${isDark ? 'text-white/30' : 'text-slate-400'}`}>{expandedId === item.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {expandedId === item.id && (
                <div className={`px-5 pb-5 border-t animate-fade-in ${isDark ? 'border-white/5' : 'border-slate-50'}`}>
                    <div className="space-y-4 pt-4">
                        <p className={`text-[9px] font-black uppercase tracking-widest opacity-40 ${isDark ? 'text-white' : 'text-slate-900'}`}>Smart Attributes</p>
                        <div className="flex flex-wrap gap-2">
                           {item.fit && <span className={`px-2 py-1 rounded-lg text-[9px] font-bold border ${isDark ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-purple-50 border-purple-100 text-purple-600'}`}>{t(item.fit)}</span>}
                           {item.fabric && <span className={`px-2 py-1 rounded-lg text-[9px] font-bold border ${isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>{t(item.fabric)}</span>}
                           {item.pattern && <span className={`px-2 py-1 rounded-lg text-[9px] font-bold border ${isDark ? 'bg-pink-500/10 border-pink-500/20 text-pink-300' : 'bg-pink-50 border-pink-100 text-pink-600'}`}>{t(item.pattern)}</span>}
                           {item.mood && <span className={`px-2 py-1 rounded-lg text-[9px] font-bold border ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>{t(item.mood)}</span>}
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                           <div className="flex items-center gap-2">
                              {item.hex && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.hex }} />}
                              <p className={`text-[10px] font-black uppercase tracking-tighter ${isDark ? 'text-white/60' : 'text-slate-500'}`}>{item.color_name || 'Item Color'}</p>
                           </div>
                           {item.compatibility_score !== undefined && (
                              <p className={`text-[10px] font-black ${isDark ? 'text-green-400' : 'text-green-600'}`}>🎯 {item.compatibility_score}%</p>
                           )}
                        </div>

                        <button
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.id}
                          className={`mt-4 w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                            isDark
                              ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                              : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                          } disabled:opacity-50 active:scale-95`}
                        >
                          {deletingId === item.id ? t('deleting') : `🗑️ ${t('removeFromWardrobe')}`}
                        </button>
                    </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-white/10">
          {toast}
        </div>
      )}
    </div>
  );
}

export default WardrobePanel;
