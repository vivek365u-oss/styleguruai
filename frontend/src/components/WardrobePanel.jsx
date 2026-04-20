import { useState, useEffect, useContext } from 'react';
import { getWardrobe, deleteWardrobeItem, updateWardrobeItemStatus, loadUserPreferences, saveUserPreferences } from '../api/styleApi';
import { auth } from '../api/styleApi';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { usePlan } from '../context/PlanContext';
import { getLocalWardrobeImage, deleteLocalWardrobeImage } from '../utils/indexedDB';
import {
  getFiltersByGender,
  getCategoryLabel,
  getCategoryEmoji,
  getCategoryGroup,
  WARDROBE_SECTIONS,
} from '../constants/fashionCategories';
import { FashionIcons, IconRenderer } from './Icons';
import { trackWardrobeInteraction } from '../utils/analytics';
import { buildMyntraUrl } from '../utils/myntraUrl';

// getCategoryGroup is now imported from fashionCategories — 100% accurate lookup
// No keyword matching needed here anymore.


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
      <span className="w-6 h-6"><IconRenderer icon={FashionIcons.Dress} /></span>
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

// ── WardrobeItem: single item card ───────────────────────────
function WardrobeItem({ item, expandedId, setExpandedId, deletingId, handleDelete, handleToggleLaundry, t, formatDate, isDark }) {
  const isLaundry = item.status === 'laundry' || item.status === 'dirty';
  
  return (
    <div className={`rounded-[2rem] border transition-all duration-300 hover:shadow-lg ${
      isLaundry ? 'opacity-50 grayscale-[0.5] border-red-500/20 bg-red-500/5' : 'border-[var(--border-primary)] bg-[var(--card-bg)] hover:border-purple-500/30'
    }`}>
      <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
        <div className="relative">
          <WardrobeImage imageId={item.imageId} fallbackColor={item.hex || item.skin_hex} />
          {item.hex && <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[var(--bg-primary)] shadow-sm" style={{ backgroundColor: item.hex }} />}
          {isLaundry && <div className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full shadow-lg scale-75 animate-pulse">🧼</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-black text-sm capitalize tracking-tight flex items-center gap-2">
              {item.category?.startsWith('cat_') ? getCategoryLabel(item.category) : (item.category ? (t(`cat_${item.category}`) || item.category.replace(/^cat_/, '').replace(/_/g, ' ')) : (item.outfit_data?.shirt || item.outfit_data?.top || 'Style Item'))}
              {isLaundry && <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-500 font-black uppercase">Laundry</span>}
            </span>
          </div>
          {item.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.tags.slice(0, 2).map((tag, idx) => <span key={idx} className="text-[8px] font-black uppercase opacity-40">#{t(tag)}</span>)}
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold opacity-20">{formatDate(item.saved_at)}</p>
          <span className="text-[10px] mt-1 block opacity-30">{expandedId === item.id ? '▲' : '▼'}</span>
        </div>
      </div>

      {expandedId === item.id && (
        <div className="px-5 pb-5 border-t border-[var(--border-primary)] animate-fade-in">
          <div className="space-y-4 pt-4">
             {/* Laundry Toggle (Phase 4) */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between ${isLaundry ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
               <div className="flex items-center gap-3">
                  <span className="text-lg">{isLaundry ? '🧺' : '✨'}</span>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-tight ${isLaundry ? 'text-red-500' : 'text-green-600'}`}>{isLaundry ? 'Currently in Laundry' : 'Fresh & Available'}</p>
                    {item.last_worn_date && <p className="text-[8px] opacity-40 italic">Last worn: {item.last_worn_date}</p>}
                  </div>
               </div>
               <button 
                  onClick={(e) => { e.stopPropagation(); handleToggleLaundry(item); }}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all active:scale-95 ${
                    isLaundry ? 'bg-green-500 text-white shadow-lg' : 'bg-red-500 text-white shadow-lg'
                  }`}
               >
                  {isLaundry ? 'Mark as Clean' : 'Send to Laundry'}
               </button>
            </div>

            <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Smart Attributes</p>
            <div className="flex flex-wrap gap-2">
              {item.fit && <span className="px-2 py-1 rounded-lg text-[9px] font-black border border-purple-500/20 bg-purple-500/5 text-purple-600 dark:text-purple-400">{t(item.fit)}</span>}
              {item.fabric && <span className="px-2 py-1 rounded-lg text-[9px] font-black border border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400">{t(item.fabric)}</span>}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-primary)]">
              <div className="flex items-center gap-2">
                {item.hex && <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.hex }} />}
                <p className="text-[10px] font-black uppercase tracking-tighter opacity-60">{item.color_name || 'Item Color'}</p>
              </div>
              {item.compatibility_score !== undefined && (
                <p className="text-[10px] font-black flex items-center gap-1 text-green-600 dark:text-green-400">
                  <IconRenderer icon={FashionIcons.Accuracy} className="w-3 h-3" /> {item.compatibility_score}%
                </p>
              )}
            </div>
            <button onClick={() => handleDelete(item)} disabled={deletingId === item.id} className="mt-2 w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 disabled:opacity-50 active:scale-95 transition-all">
              {deletingId === item.id ? t('deleting') : (
                <span className="flex items-center justify-center gap-2">
                  <IconRenderer icon={FashionIcons.Wardrobe} className="w-3 h-3" /> {t('removeFromWardrobe')}
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [laundryCycle, setLaundryCycle] = useState(3);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!auth.currentUser) { setLoading(false); return; }
    fetchWardrobe();
    // Track wardrobe view on mount
    trackWardrobeInteraction('view', items.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wardrobeLimit]);

  const fetchWardrobe = async () => {
    try {
      const [data, prefs] = await Promise.all([
         getWardrobe(auth.currentUser.uid),
         loadUserPreferences(auth.currentUser.uid)
      ]);
      setItems(data);
      if (prefs?.laundry_cycle) setLaundryCycle(prefs.laundry_cycle);
      // Use data.length directly — avoids a second full Firestore read
      if (data.length >= wardrobeLimit) setCapWarning(true);
    } catch {
      setError(t('somethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  // ── Exact filter using centralized CATEGORY_GROUP_MAP (no keyword guessing) ──
  // getCategoryGroup('cat_crop_top') → 'TOPS', getCategoryGroup('cat_lehenga') → 'ETHNIC', etc.
  const filteredItems = filter === 'all'
    ? items
    : items.filter(item => getCategoryGroup(item.category) === filter);



  const handleDelete = async (item) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setDeletingId(item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
    try {
      await deleteWardrobeItem(uid, item.id);
      if (item.imageId) await deleteLocalWardrobeImage(item.imageId);
      trackWardrobeInteraction('remove', items.length);
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

  const handleToggleLaundry = async (item) => {
    const isCurrentlyLaundry = item.status === 'laundry' || item.status === 'dirty';
    const newStatus = isCurrentlyLaundry ? 'available' : 'laundry';
    const today = new Date().toLocaleDateString('en-CA');
    
    // Optimistic Update
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus, last_worn_date: isCurrentlyLaundry ? i.last_worn_date : today } : i));
    
    try {
      await updateWardrobeItemStatus(auth.currentUser.uid, item.id, { 
        status: newStatus,
        last_worn_date: isCurrentlyLaundry ? item.last_worn_date || '' : today
      });
      showToast(isCurrentlyLaundry ? 'Item is now clean!' : 'Item sent to laundry');
    } catch {
      showToast('Status update failed');
      fetchWardrobe();
    }
  };

  const handleUpdateCycle = async (days) => {
      setLaundryCycle(days);
      try {
          await saveUserPreferences(auth.currentUser.uid, { laundry_cycle: days });
          showToast(`Laundry cycle set to ${days} days`);
      } catch { showToast('Failed to save cycle preference'); }
  };

  if (!auth.currentUser) {
    return (
      <div className="mt-8 text-center pt-10">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-[var(--border-primary)] bg-[var(--bg-accent)] p-5 opacity-30">
          <IconRenderer icon={FashionIcons.Wardrobe} />
        </div>
        <h3 className="font-bold text-xl mb-2">{t('myWardrobe')}</h3>
        <p className="text-sm opacity-50">{t('wardrobeLimitNote')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-4 space-y-3">
        <h2 className="font-black text-2xl mb-4 flex items-center gap-2">
           <span className="w-6 h-6"><IconRenderer icon={FashionIcons.Wardrobe} /></span> {t('myWardrobe')}
        </h2>
        {[1, 2, 3].map(i => <SkeletonCard key={i} isDark={isDark} />)}
      </div>
    );
  }

  return (
    <div className="mt-4 pb-4">
      {/* Wardrobe Header with Laundry Settings (Phase 4) */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex-1">
          <h2 className="font-black text-2xl flex items-center gap-2">
             <span className="w-6 h-6"><IconRenderer icon={FashionIcons.Wardrobe} /></span> {t('myWardrobe')}
          </h2>
          <div className="flex items-center gap-3 mt-1">
             <p className="text-sm opacity-50">{items.length} {t('outfits')}</p>
             <div className="w-1 h-1 rounded-full bg-[var(--border-primary)]" />
             <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-black uppercase tracking-tighter">Cycle:</span>
                <select 
                  value={laundryCycle}
                  onChange={(e) => handleUpdateCycle(parseInt(e.target.value))}
                  className="bg-transparent border-none text-[10px] font-black text-purple-500 cursor-pointer focus:ring-0 p-0"
                >
                   <option value={1}>1 Day</option>
                   <option value={3}>3 Days</option>
                   <option value={5}>5 Days</option>
                   <option value={7}>7 Days</option>
                </select>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className={`p-2 rounded-xl text-[10px] font-black flex items-center gap-2 ${items.filter(i => i.status === 'laundry').length > 0 ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500 opacity-40'}`}>
              <span>🧺</span> {items.filter(i => i.status === 'laundry').length}
           </div>
           <div className="rounded-xl px-3 py-2 border border-purple-500/30 bg-purple-500/10 shadow-sm shadow-purple-500/5">
            <span className="text-sm font-black text-purple-600 dark:text-purple-400">{items.length}/{wardrobeLimit}</span>
           </div>
        </div>
      </div>

      {/* Closet Filters - Gender Aware */}
      {/* Filter tabs are derived from WARDROBE_SECTIONS to stay in sync */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {/* All tab */}
        <button
          onClick={() => { setFilter('all'); trackWardrobeInteraction('filter', items.length); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-tight transition-all border whitespace-nowrap shadow-sm ${
            filter === 'all'
              ? 'bg-purple-600 border-purple-600 text-white shadow-purple-500/30'
              : 'bg-[var(--bg-accent)] border-[var(--border-primary)] opacity-60 hover:opacity-100 hover:scale-105 active:scale-95'
          }`}
        >
          <span className="w-3 h-3"><IconRenderer icon={FashionIcons.Wardrobe} /></span>
          All
        </button>
        {/* All category tabs — ALWAYS show all sections (not just ones with items) */}
        {/* User can browse empty categories and shop to fill them */}
        {Object.entries(WARDROBE_SECTIONS)
          .filter(([key]) => key !== 'OTHER')
          .sort(([, a], [, b]) => a.order - b.order)
          .map(([sectionKey, section]) => {
            const count = items.filter(i => getCategoryGroup(i.category) === sectionKey).length;
            return (
              <button
                key={sectionKey}
                onClick={() => { setFilter(sectionKey); trackWardrobeInteraction('filter', items.length); }}
                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-tight transition-all border whitespace-nowrap shadow-sm ${
                  filter === sectionKey
                    ? 'bg-purple-600 border-purple-600 text-white shadow-purple-500/30'
                    : 'bg-[var(--bg-accent)] border-[var(--border-primary)] opacity-60 hover:opacity-100 hover:scale-105 active:scale-95'
                }`}
              >
                <span className="text-sm leading-none">{section.emoji}</span>
                {section.label.split(' ')[0]}
                {/* Item count badge */}
                <span className={`ml-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                  count > 0
                    ? filter === sectionKey ? 'bg-white/20 text-white' : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                    : filter === sectionKey ? 'bg-white/10 text-white/50' : 'bg-gray-200/60 dark:bg-white/5 text-gray-400 dark:text-white/20'
                }`}>{count}</span>
              </button>
            );
          })}
      </div>

      {capWarning && (
        <div className="rounded-2xl p-4 mb-4 border border-yellow-500/20 bg-yellow-500/5 flex items-center gap-3">
          <span className="w-5 h-5 flex-shrink-0 text-yellow-500"><IconRenderer icon={FashionIcons.Bulb} /></span>
          <p className="text-[11px] font-medium text-yellow-700 dark:text-yellow-400">{t('wardrobeFull', { current: items.length, limit: wardrobeLimit })}</p>
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-8 text-center py-10">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-[var(--border-primary)] bg-[var(--bg-accent)] p-5 opacity-30">
            <IconRenderer icon={FashionIcons.Wardrobe} />
          </div>
          <h3 className="font-bold text-xl mb-2">{t('noOutfitsSaved')}</h3>
          <p className="text-sm opacity-50">{t('analyzeToSave')}</p>
        </div>
      ) : filter !== 'all' ? (
        // ── SINGLE SECTION FILTER VIEW ─────────────────────────
        (() => {
          // Use getCategoryGroup for exact matching — no keyword guessing
          const sectionItems = items.filter(i => getCategoryGroup(i.category) === filter);
          const sectionMeta = WARDROBE_SECTIONS[filter] || { label: filter, emoji: '👗' };
          return sectionItems.length === 0 ? (
            // ── EMPTY SECTION — Show shop CTA to fill this category ──
            <div className="text-center py-14">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 border ${
                isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
              }`}>
                <span className="text-4xl">{sectionMeta.emoji}</span>
              </div>
              <p className={`text-sm font-black mb-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                {sectionMeta.label}
              </p>
              <p className={`text-xs mb-5 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                No items saved here yet. Shop to fill this section!
              </p>
              {/* Shop CTA — opens Myntra search for this category */}
              <button
                onClick={() => {
                  // Map section label to Myntra category-path URL
                  const lower = sectionMeta.label.toLowerCase();
                  let itemType = 'shirt';
                  if (lower.includes('bottom') || lower.includes('pant')) itemType = 'pant';
                  else if (lower.includes('dress')) itemType = 'dress';
                  else if (lower.includes('ethnic')) itemType = 'kurti';
                  else if (lower.includes('top') || lower.includes('shirt')) itemType = 'top';
                  else if (lower.includes('foot') || lower.includes('shoe')) itemType = 'shoe';
                  const url = buildMyntraSearchUrl(sectionMeta.label, gender, itemType);
                  window.open(url, '_blank');
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[11px] font-black uppercase tracking-wider shadow-lg hover:scale-[1.03] active:scale-95 transition-all"
              >
                <span>🛍️</span> Shop {sectionMeta.label.split(' ')[0]} on Myntra
              </button>
            </div>
          ) : (
            <div>
              {/* Section header */}
              <div className="flex items-center gap-2 mb-4 px-1">
                <span className="text-xl">{sectionMeta.emoji}</span>
                <p className={`text-[12px] font-black uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{sectionMeta.label}</p>
                <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                <span className={`text-[10px] font-bold ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{sectionItems.length} items</span>
              </div>
              <div className="space-y-3">
                {sectionItems.map(item => <WardrobeItem key={item.id} item={item} expandedId={expandedId} setExpandedId={setExpandedId} deletingId={deletingId} handleDelete={handleDelete} t={t} formatDate={formatDate} isDark={isDark} />)}
              </div>
            </div>
          );
        })()
      ) : (
        // ── ALL: Precisely grouped by WARDROBE_SECTIONS ─────────────────────────
        // getCategoryGroup() maps each cat_id → section key (100% accurate, no guessing)
        <div className="space-y-6">
          {(() => {
            // Build section → items map
            const grouped = {};
            items.forEach(item => {
              const grp = getCategoryGroup(item.category);
              if (!grouped[grp]) grouped[grp] = [];
              grouped[grp].push(item);
            });

            // Sort sections by WARDROBE_SECTIONS order, only show non-empty ones
            const sections = Object.entries(WARDROBE_SECTIONS)
              .filter(([key]) => grouped[key]?.length > 0)
              .sort(([, a], [, b]) => a.order - b.order)
              .map(([key, meta]) => ({ key, ...meta, items: grouped[key] }));

            // Also show any 'OTHER' items at the bottom
            if (grouped['OTHER']?.length > 0) {
              sections.push({ key: 'OTHER', ...WARDROBE_SECTIONS.OTHER, items: grouped['OTHER'] });
            }

            if (sections.length === 0) return (
              <div className="text-center py-16 opacity-50"><p className="text-sm">No items saved yet.</p></div>
            );

            return sections.map(section => (
              <div key={section.key}>
                {/* Section Header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="text-xl leading-none">{section.emoji}</span>
                  <p className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                    {section.label}
                  </p>
                  <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                  <span className={`text-[10px] font-bold ${isDark ? 'text-white/20' : 'text-gray-400'}`}>
                    {section.items.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {section.items.map(item => (
                    <WardrobeItem
                      key={item.id}
                      item={item}
                      expandedId={expandedId}
                      setExpandedId={setExpandedId}
                      deletingId={deletingId}
                      handleDelete={handleDelete}
                      handleToggleLaundry={handleToggleLaundry}
                      t={t}
                      formatDate={formatDate}
                      isDark={isDark}
                    />
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 backdrop-blur-md text-white text-xs font-black px-5 py-3 rounded-full shadow-2xl border border-white/10 animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}

export default WardrobePanel;
