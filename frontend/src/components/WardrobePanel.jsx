import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  getWardrobe,
  deleteWardrobeItem,
  updateWardrobeItemStatus,
  loadUserPreferences,
  saveUserPreferences,
  auth
} from '../api/styleApi';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { usePlan } from '../context/PlanContext';
import { getLocalWardrobeImage, saveLocalWardrobeImage, deleteLocalWardrobeImage } from '../utils/indexedDB';
import {
  getCategoryLabel,
  getCategoryEmoji,
  getCategoryGroup,
  WARDROBE_SECTIONS
} from '../constants/fashionCategories';
import { FashionIcons, IconRenderer } from './Icons';
import { trackWardrobeInteraction } from '../utils/analytics';
import { buildMyntraUrl, buildMyntraSearchUrl } from '../utils/myntraUrl';
import AddWardrobeItemModal from './AddWardrobeItemModal';

// ── Enhanced Wardrobe Image Component ────────────────────────
function WardrobeImage({ imageId, fallbackColor, thumbnail, className = "w-12 h-12 rounded-xl" }) {
  const [src, setSrc] = useState(thumbnail || null);

  useEffect(() => {
    if (thumbnail) {
      setSrc(thumbnail);
      if (imageId) {
        saveLocalWardrobeImage(imageId, thumbnail).catch(() => {});
      }
      return;
    }
    if (!imageId) return;
    getLocalWardrobeImage(imageId).then(data => {
      if (data) setSrc(data);
    });
  }, [imageId, thumbnail]);

  if (src) {
    return (
      <img
        src={src}
        alt="Wardrobe item"
        className={`${className} object-cover shadow border border-white/20`}
      />
    );
  }

  const bgStyle = fallbackColor
    ? { background: `linear-gradient(135deg, ${fallbackColor}dd 0%, ${fallbackColor}88 100%)` }
    : { background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)' };

  return (
    <div
      className={`${className} flex items-center justify-center border border-white/20 shadow`}
      style={bgStyle}
    >
      <span className="w-1/2 h-1/2 opacity-70 flex items-center justify-center">
        <IconRenderer icon={FashionIcons.Dress} />
      </span>
    </div>
  );
}

// ── Skeleton Loader ──────────────────────────────────────────
function SkeletonCard({ isDark }) {
  return (
    <div className={`rounded-2xl p-4 border animate-pulse ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
        <div className="flex-1 space-y-2">
          <div className={`h-3 rounded-full w-3/4 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
          <div className={`h-3 rounded-full w-1/2 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
        </div>
      </div>
    </div>
  );
}

// ── Lookbook Grid Item Card ──────────────────────────────────
function WardrobeGridCard({
  item,
  onInspect,
  handleToggleLaundry,
  handleDelete,
  deletingId,
  gender,
  t,
  isDark
}) {
  const isLaundry = item.status === 'laundry' || item.status === 'dirty';
  const categoryLabel = item.category?.startsWith('cat_')
    ? getCategoryLabel(item.category)
    : (item.category ? (t(`cat_${item.category}`) || item.category.replace(/^cat_/, '').replace(/_/g, ' ')) : 'Clothing Piece');
  const categoryEmoji = getCategoryEmoji(item.category) || '👗';

  const handleMyntraShop = (e) => {
    e.stopPropagation();
    const url = buildMyntraUrl({
      color: item.color_name || '',
      catId: item.category,
      gender: item.gender || gender,
      itemType: item.category
    });
    window.open(url, '_blank');
  };

  return (
    <div
      onClick={() => onInspect(item)}
      className={`group relative rounded-3xl border transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col overflow-hidden ${
        isLaundry
          ? 'opacity-65 grayscale-[0.35] border-red-500/20 bg-red-500/5'
          : isDark
          ? 'border-white/10 bg-[#121826] hover:border-purple-500/40 hover:-translate-y-1'
          : 'border-slate-200 bg-white hover:border-purple-400 hover:-translate-y-1 shadow-sm'
      }`}
    >
      {/* Visual Image Container */}
      <div className="relative w-full aspect-[4/3] sm:aspect-square overflow-hidden bg-black/10">
        <WardrobeImage
          imageId={item.imageId}
          fallbackColor={item.hex || item.skin_hex}
          thumbnail={item.thumbnail}
          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1 pointer-events-none">
          {/* Category Chip */}
          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-tight bg-black/60 backdrop-blur-md text-white border border-white/20 shadow flex items-center gap-1.5">
            <span>{categoryEmoji}</span>
            <span className="truncate max-w-[90px]">{categoryLabel}</span>
          </span>

          {/* Quick 1-Tap Laundry Status Chip */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleLaundry(item);
            }}
            className={`pointer-events-auto px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-lg transition-all active:scale-90 flex items-center gap-1 backdrop-blur-md ${
              isLaundry
                ? 'bg-red-500 text-white border border-red-400 shadow-red-500/30'
                : 'bg-emerald-600/90 hover:bg-emerald-600 text-white border border-emerald-400/30'
            }`}
            title={isLaundry ? 'In Laundry - Tap to mark Clean' : 'Clean & Ready - Tap to send to Laundry'}
          >
            <span>{isLaundry ? '🧺 Laundry' : '✨ Ready'}</span>
          </button>
        </div>

        {/* Bottom Bar: Dominant Color Swatch + Harmony Score */}
        <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between gap-1 pointer-events-none">
          {item.hex && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-white shadow">
              <div
                className="w-3 h-3 rounded-full border border-white/60 shadow-sm"
                style={{ backgroundColor: item.hex }}
              />
              <span className="text-[9px] font-bold truncate max-w-[80px]">
                {item.color_name || 'Color'}
              </span>
            </div>
          )}

          {item.compatibility_score !== undefined && (
            <div className="px-2 py-0.5 rounded-lg bg-emerald-500/90 backdrop-blur-md text-white text-[9px] font-black flex items-center gap-1 shadow">
              <span>★</span> {item.compatibility_score}%
            </div>
          )}
        </div>
      </div>

      {/* Card Content Details */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h4 className="font-black text-xs sm:text-sm tracking-tight truncate">
              {item.color_name ? `${item.color_name} ` : ''}{categoryLabel}
            </h4>
          </div>

          {/* Smart Attribute Pills */}
          <div className="flex flex-wrap gap-1 mb-2">
            {item.fit && (
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                {t(item.fit) || item.fit.replace('fit_', '')}
              </span>
            )}
            {item.fabric && (
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {t(item.fabric) || item.fabric.replace('fabric_', '')}
              </span>
            )}
            {item.tags?.slice(0, 2).map((tg, idx) => (
              <span key={idx} className="text-[8px] font-black uppercase opacity-45 px-1 py-0.5">
                #{t(tg) || tg.replace('tag_', '')}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="pt-2.5 mt-1 border-t border-[var(--border-primary)] flex items-center justify-between gap-2">
          {/* Myntra Match Button */}
          <button
            type="button"
            onClick={handleMyntraShop}
            className="flex-1 py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-tight bg-gradient-to-r from-purple-600/15 to-pink-600/15 hover:from-purple-600/25 hover:to-pink-600/25 text-purple-600 dark:text-purple-300 border border-purple-500/20 transition-all flex items-center justify-center gap-1 active:scale-95"
            title="Find matching pieces on Myntra"
          >
            <span>🛍️</span> Shop Match
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item);
            }}
            disabled={deletingId === item.id}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-all active:scale-90 disabled:opacity-40"
            title="Remove from wardrobe"
          >
            {deletingId === item.id ? (
              <div className="w-3 h-3 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
            ) : (
              <span className="text-xs">🗑️</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail List Item Row ─────────────────────────────────────
function WardrobeItemRow({
  item,
  expandedId,
  setExpandedId,
  deletingId,
  handleDelete,
  handleToggleLaundry,
  gender,
  t,
  formatDate,
  isDark
}) {
  const isLaundry = item.status === 'laundry' || item.status === 'dirty';
  const categoryLabel = item.category?.startsWith('cat_')
    ? getCategoryLabel(item.category)
    : (item.category ? (t(`cat_${item.category}`) || item.category.replace(/^cat_/, '').replace(/_/g, ' ')) : (item.outfit_data?.shirt || item.outfit_data?.top || 'Clothing Piece'));
  const categoryEmoji = getCategoryEmoji(item.category) || '👗';

  const handleMyntraShop = (e) => {
    e.stopPropagation();
    const url = buildMyntraUrl({
      color: item.color_name || '',
      catId: item.category,
      gender: item.gender || gender,
      itemType: item.category
    });
    window.open(url, '_blank');
  };

  return (
    <div
      className={`rounded-[2rem] border transition-all duration-300 hover:shadow-lg ${
        isLaundry
          ? 'opacity-60 grayscale-[0.35] border-red-500/20 bg-red-500/5'
          : 'border-[var(--border-primary)] bg-[var(--card-bg)] hover:border-purple-500/30'
      }`}
    >
      <div
        className="flex items-center gap-4 p-4 sm:p-5 cursor-pointer"
        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
      >
        <div className="relative">
          <WardrobeImage
            imageId={item.imageId}
            fallbackColor={item.hex || item.skin_hex}
            thumbnail={item.thumbnail}
            className="w-14 h-14 rounded-2xl"
          />
          {item.hex && (
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[var(--bg-primary)] shadow-sm"
              style={{ backgroundColor: item.hex }}
              title={item.color_name}
            />
          )}
          {isLaundry && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full shadow-lg scale-75 animate-pulse">
              🧺
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-black text-sm capitalize tracking-tight flex items-center gap-2">
              <span className="text-base">{categoryEmoji}</span>
              <span>{categoryLabel}</span>
              {isLaundry ? (
                <span className="text-[8px] px-2 py-0.5 rounded-md bg-red-500/20 text-red-500 font-black uppercase">
                  In Laundry
                </span>
              ) : (
                <span className="text-[8px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black uppercase">
                  Available
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {item.color_name && (
              <span className="text-[10px] font-bold opacity-60">
                {item.color_name}
              </span>
            )}
            {item.fit && (
              <span className="text-[9px] font-black uppercase opacity-40">
                • {t(item.fit) || item.fit.replace('fit_', '')}
              </span>
            )}
            {item.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 2).map((tag, idx) => (
                  <span key={idx} className="text-[8px] font-black uppercase opacity-40">
                    #{t(tag) || tag.replace('tag_', '')}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-right flex items-center gap-3">
          {item.compatibility_score !== undefined && (
            <span className="hidden sm:inline-flex px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black">
              ★ {item.compatibility_score}%
            </span>
          )}
          <div>
            <p className="text-[10px] font-bold opacity-30">{formatDate(item.saved_at)}</p>
            <span className="text-[10px] mt-1 block opacity-30 text-right">
              {expandedId === item.id ? '▲' : '▼'}
            </span>
          </div>
        </div>
      </div>

      {expandedId === item.id && (
        <div className="px-5 pb-5 border-t border-[var(--border-primary)] animate-fade-in">
          <div className="space-y-4 pt-4">
            {/* Laundry Toggle */}
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                isLaundry ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{isLaundry ? '🧺' : '✨'}</span>
                <div>
                  <p
                    className={`text-[10px] font-black uppercase tracking-tight ${
                      isLaundry ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {isLaundry ? 'Currently in Laundry' : 'Fresh & Ready to Wear'}
                  </p>
                  {item.last_worn_date && (
                    <p className="text-[9px] opacity-50 italic">Last worn: {item.last_worn_date}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleLaundry(item);
                }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 shadow-md ${
                  isLaundry ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'
                }`}
              >
                {isLaundry ? 'Mark as Clean' : 'Send to Laundry'}
              </button>
            </div>

            {/* Smart Attributes */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-2">
                Smart Attributes & DNA
              </p>
              <div className="flex flex-wrap gap-2">
                {item.fit && (
                  <span className="px-2.5 py-1 rounded-xl text-[9px] font-black border border-purple-500/20 bg-purple-500/5 text-purple-600 dark:text-purple-400">
                    Fit: {t(item.fit) || item.fit.replace('fit_', '')}
                  </span>
                )}
                {item.fabric && (
                  <span className="px-2.5 py-1 rounded-xl text-[9px] font-black border border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400">
                    Fabric: {t(item.fabric) || item.fabric.replace('fabric_', '')}
                  </span>
                )}
                {item.pattern && (
                  <span className="px-2.5 py-1 rounded-xl text-[9px] font-black border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400">
                    Pattern: {t(item.pattern) || item.pattern.replace('pattern_', '')}
                  </span>
                )}
                {item.mood && (
                  <span className="px-2.5 py-1 rounded-xl text-[9px] font-black border border-pink-500/20 bg-pink-500/5 text-pink-600 dark:text-pink-400">
                    Vibe: {t(item.mood) || item.mood.replace('mood_', '')}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--border-primary)] gap-2">
              <button
                type="button"
                onClick={handleMyntraShop}
                className="py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider bg-purple-600/10 hover:bg-purple-600/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 transition-all flex items-center gap-1.5"
              >
                <span>🛍️</span> Shop Matching on Myntra
              </button>

              <button
                type="button"
                onClick={() => handleDelete(item)}
                disabled={deletingId === item.id}
                className="py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 disabled:opacity-50 active:scale-95 transition-all flex items-center gap-1.5"
              >
                {deletingId === item.id ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <span>🗑️</span>
                    <span>{t('removeFromWardrobe') || 'Remove Item'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Quick Inspection Dialog ──────────────────────────────────
function ItemInspectModal({ item, onClose, handleToggleLaundry, handleDelete, gender, t, isDark }) {
  if (!item) return null;
  const isLaundry = item.status === 'laundry' || item.status === 'dirty';
  const categoryLabel = item.category?.startsWith('cat_')
    ? getCategoryLabel(item.category)
    : (item.category ? (t(`cat_${item.category}`) || item.category.replace(/^cat_/, '').replace(/_/g, ' ')) : 'Clothing Piece');
  const categoryEmoji = getCategoryEmoji(item.category) || '👗';

  const handleMyntraShop = () => {
    const url = buildMyntraUrl({
      color: item.color_name || '',
      catId: item.category,
      gender: item.gender || gender,
      itemType: item.category
    });
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${
          isDark ? 'bg-[#0F172A] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header Image */}
        <div className="relative w-full aspect-video sm:aspect-[4/3] bg-black/30">
          <WardrobeImage
            imageId={item.imageId}
            fallbackColor={item.hex || item.skin_hex}
            thumbnail={item.thumbnail}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md"
          >
            ✕
          </button>
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md text-white text-xs font-black flex items-center gap-1.5 border border-white/20">
              <span>{categoryEmoji}</span>
              <span>{categoryLabel}</span>
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-lg">
                {item.color_name ? `${item.color_name} ` : ''}{categoryLabel}
              </h3>
              <p className="text-xs opacity-50">
                Added on {new Date(item.saved_at || Date.now()).toLocaleDateString()}
              </p>
            </div>
            {item.compatibility_score !== undefined && (
              <div className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-500 font-black text-xs">
                ★ {item.compatibility_score}% Match
              </div>
            )}
          </div>

          {/* Laundry status banner */}
          <div className={`p-3 rounded-2xl border flex items-center justify-between ${isLaundry ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{isLaundry ? '🧺' : '✨'}</span>
              <div>
                <p className={`text-xs font-black uppercase ${isLaundry ? 'text-red-500' : 'text-emerald-500'}`}>
                  {isLaundry ? 'In Laundry' : 'Fresh & Clean'}
                </p>
                {item.last_worn_date && (
                  <p className="text-[10px] opacity-40">Last worn: {item.last_worn_date}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => handleToggleLaundry(item)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase shadow ${isLaundry ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'}`}
            >
              {isLaundry ? 'Clean' : 'Laundry'}
            </button>
          </div>

          {/* Smart Details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[9px] font-black uppercase opacity-40 block">Fit Type</span>
              <span className="font-bold">{t(item.fit) || item.fit?.replace('fit_', '') || 'Regular'}</span>
            </div>
            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[9px] font-black uppercase opacity-40 block">Fabric</span>
              <span className="font-bold">{t(item.fabric) || item.fabric?.replace('fabric_', '') || 'Cotton'}</span>
            </div>
            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[9px] font-black uppercase opacity-40 block">Pattern</span>
              <span className="font-bold">{t(item.pattern) || item.pattern?.replace('pattern_', '') || 'Solid'}</span>
            </div>
            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[9px] font-black uppercase opacity-40 block">Color Tone</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {item.hex && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.hex }} />}
                <span className="font-bold">{item.color_name || 'Standard'}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleMyntraShop}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-black uppercase shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span>🛍️</span> Shop Matching on Myntra
            </button>
            <button
              onClick={() => {
                handleDelete(item);
                onClose();
              }}
              className="py-3 px-3 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 text-xs font-black uppercase hover:bg-red-500/20 transition-all"
              title="Delete item"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Master WardrobePanel Component ───────────────────────────
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

  // Filter & Search Controls
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'available', 'laundry'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [inspectedItem, setInspectedItem] = useState(null);

  // Direct Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialCategory, setAddModalInitialCategory] = useState('');

  // Laundry and Weather Preferences
  const [laundryCycle, setLaundryCycle] = useState(3);
  const [weatherFilterEnabled, setWeatherFilterEnabled] = useState(false);
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    import('../utils/weatherService')
      .then(m => m.getLocalWeather())
      .then(data => setWeatherData(data))
      .catch(() => {});
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    fetchWardrobe();
    trackWardrobeInteraction('view', items.length);

    // Listen to external wardrobe additions (e.g. from OutfitChecker or ColorScanner)
    const handleWardrobeUpdate = () => {
      fetchWardrobe();
    };
    window.addEventListener('sg_wardrobe_updated', handleWardrobeUpdate);
    return () => window.removeEventListener('sg_wardrobe_updated', handleWardrobeUpdate);
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
      if (data.length >= wardrobeLimit) setCapWarning(true);
      else setCapWarning(false);
    } catch {
      setError(t('somethingWrong') || 'Could not load your wardrobe');
    } finally {
      setLoading(false);
    }
  };

  // ── Smart Weather Filter ──
  let weatherFiltered = items;
  if (weatherFilterEnabled && weatherData) {
    weatherFiltered = items.filter(item => {
      if (weatherData.temp > 28) {
        if (item.fabric === 'fabric_wool' || item.tags?.includes('tag_winter')) return false;
      }
      if (weatherData.temp < 15) {
        if (item.fabric === 'fabric_linen' || item.tags?.includes('tag_summer')) return false;
      }
      return true;
    });
  }

  // ── Status Filter (All / Fresh / Laundry) ──
  const statusFiltered = useMemo(() => {
    if (statusFilter === 'available') {
      return weatherFiltered.filter(i => i.status !== 'laundry' && i.status !== 'dirty');
    }
    if (statusFilter === 'laundry') {
      return weatherFiltered.filter(i => i.status === 'laundry' || i.status === 'dirty');
    }
    return weatherFiltered;
  }, [weatherFiltered, statusFilter]);

  // ── Search & Section Filter ──
  const finalFilteredItems = useMemo(() => {
    return statusFiltered.filter(item => {
      // Category group match
      if (filter !== 'all' && getCategoryGroup(item.category) !== filter) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const catLabel = (item.category ? getCategoryLabel(item.category) : '').toLowerCase();
        const color = (item.color_name || '').toLowerCase();
        const fabric = (item.fabric || '').toLowerCase();
        const fit = (item.fit || '').toLowerCase();
        const tags = (item.tags || []).join(' ').toLowerCase();

        return (
          catLabel.includes(query) ||
          color.includes(query) ||
          fabric.includes(query) ||
          fit.includes(query) ||
          tags.includes(query)
        );
      }

      return true;
    });
  }, [statusFiltered, filter, searchQuery]);

  const handleDelete = async (item) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setDeletingId(item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
    try {
      await deleteWardrobeItem(uid, item.id);
      if (item.imageId) await deleteLocalWardrobeImage(item.imageId);
      trackWardrobeInteraction('remove', items.length);
      showToast(t('outfitRemoved') || 'Item removed from wardrobe');
    } catch {
      fetchWardrobe();
      showToast(t('deleteFailed') || 'Failed to remove item');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const handleToggleLaundry = async (item) => {
    const isCurrentlyLaundry = item.status === 'laundry' || item.status === 'dirty';
    const newStatus = isCurrentlyLaundry ? 'available' : 'laundry';
    const today = new Date().toLocaleDateString('en-CA');

    // Optimistic Update
    setItems(prev =>
      prev.map(i =>
        i.id === item.id
          ? { ...i, status: newStatus, last_worn_date: isCurrentlyLaundry ? i.last_worn_date : today }
          : i
      )
    );

    try {
      await updateWardrobeItemStatus(auth.currentUser.uid, item.id, {
        status: newStatus,
        last_worn_date: isCurrentlyLaundry ? item.last_worn_date || '' : today
      });
      showToast(isCurrentlyLaundry ? '✨ Item is now clean and available!' : '🧺 Sent to laundry basket');
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
    } catch {
      showToast('Failed to save cycle preference');
    }
  };

  const handleOpenAddModal = (presetCategory = '') => {
    setAddModalInitialCategory(presetCategory);
    setIsAddModalOpen(true);
  };

  const handleItemAddedSuccessfully = (newItem) => {
    setItems(prev => [newItem, ...prev]);
    showToast('✨ Added to your Smart Wardrobe!');
  };

  // Not logged in empty state
  if (!auth.currentUser) {
    return (
      <div className="mt-8 text-center pt-10">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-[var(--border-primary)] bg-[var(--bg-accent)] p-5 opacity-30">
          <IconRenderer icon={FashionIcons.Wardrobe} />
        </div>
        <h3 className="font-bold text-xl mb-2">{t('myWardrobe') || 'My Wardrobe'}</h3>
        <p className="text-sm opacity-50">{t('wardrobeLimitNote') || 'Log in to sync your wardrobe across all devices.'}</p>
      </div>
    );
  }

  // Loading Skeleton
  if (loading) {
    return (
      <div className="mt-4 space-y-3">
        <h2 className="font-black text-2xl mb-4 flex items-center gap-2">
          <span className="w-6 h-6"><IconRenderer icon={FashionIcons.Wardrobe} /></span>
          {t('myWardrobe') || 'My Smart Wardrobe'}
        </h2>
        {[1, 2, 3].map(i => (
          <SkeletonCard key={i} isDark={isDark} />
        ))}
      </div>
    );
  }

  const laundryCount = items.filter(i => i.status === 'laundry' || i.status === 'dirty').length;
  const cleanCount = items.length - laundryCount;

  return (
    <div className="mt-2 pb-10">
      {/* ── Top Header Strip ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-[var(--border-primary)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <span className="w-5 h-5"><IconRenderer icon={FashionIcons.Wardrobe} /></span>
            </div>
            <h2 className="font-black text-2xl tracking-tight">
              {t('myWardrobe') || 'Smart Wardrobe'}
            </h2>
          </div>
          <p className="text-xs opacity-50 mt-1 font-medium">
            Your personalized, intelligent digital closet with zero friction
          </p>
        </div>

        {/* ── PROMINENT DIRECT "+ ADD CLOTHES" BUTTON ── */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="group relative px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="text-sm font-black transition-transform group-hover:rotate-90">＋</span>
            <span>Add Clothes</span>
          </button>
        </div>
      </div>

      {/* ── Stats Ribbon & Quick Utilities ────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        {/* Total Closet Count */}
        <div className={`p-3 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
          <div>
            <span className="text-[9px] font-black uppercase opacity-45 block">Capacity</span>
            <span className="text-base font-black text-purple-600 dark:text-purple-400">
              {items.length} <span className="text-xs opacity-40 font-bold">/ {wardrobeLimit}</span>
            </span>
          </div>
          <span className="text-xl">🧥</span>
        </div>

        {/* Clean & Ready */}
        <div className={`p-3 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
          <div>
            <span className="text-[9px] font-black uppercase opacity-45 block">Ready to Wear</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {cleanCount} <span className="text-xs opacity-40 font-bold">pieces</span>
            </span>
          </div>
          <span className="text-xl">✨</span>
        </div>

        {/* In Laundry */}
        <div className={`p-3 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
          <div>
            <span className="text-[9px] font-black uppercase opacity-45 block">In Laundry</span>
            <span className={`text-base font-black ${laundryCount > 0 ? 'text-red-500' : 'opacity-40'}`}>
              {laundryCount} <span className="text-xs opacity-40 font-bold">pieces</span>
            </span>
          </div>
          <span className="text-xl">🧺</span>
        </div>

        {/* Cycle & Weather Toggle */}
        <div className={`p-3 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase opacity-45">Cycle</span>
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
          <button
            type="button"
            onClick={() => setWeatherFilterEnabled(!weatherFilterEnabled)}
            className={`mt-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${
              weatherFilterEnabled
                ? weatherData?.temp > 28
                  ? 'bg-orange-500/20 text-orange-500'
                  : weatherData?.temp < 15
                  ? 'bg-blue-500/20 text-blue-500'
                  : 'bg-emerald-500/20 text-emerald-500'
                : 'bg-slate-200/50 dark:bg-white/5 opacity-60 hover:opacity-100'
            }`}
          >
            {weatherFilterEnabled
              ? `🌤️ ${Math.round(weatherData?.temp || 0)}°C ON`
              : '🌦️ Weather Filter'}
          </button>
        </div>
      </div>

      {capWarning && (
        <div className="rounded-2xl p-4 mb-4 border border-yellow-500/20 bg-yellow-500/5 flex items-center gap-3">
          <span className="w-5 h-5 flex-shrink-0 text-yellow-500">
            <IconRenderer icon={FashionIcons.Bulb} />
          </span>
          <p className="text-[11px] font-medium text-yellow-700 dark:text-yellow-400">
            {t('wardrobeFull', { current: items.length, limit: wardrobeLimit }) ||
              `Wardrobe full (${items.length}/${wardrobeLimit}). Upgrade to Pro for 50 items!`}
          </p>
        </div>
      )}

      {/* ── Search, Laundry Filter & View Mode Controls ───────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clothes by color, fabric, tag, fit..."
            className={`w-full pl-9 pr-8 py-2.5 rounded-2xl text-xs font-medium border transition-all ${
              isDark
                ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-purple-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-500'
            }`}
          />
          <span className="absolute left-3 top-3 text-xs opacity-40">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs opacity-40 hover:opacity-100"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Status Quick Filter Tabs */}
          <div className="flex bg-[var(--bg-accent)] p-0.5 rounded-xl border border-[var(--border-primary)]">
            {[
              { id: 'all', label: 'All', count: weatherFiltered.length },
              { id: 'available', label: '✨ Ready', count: cleanCount },
              { id: 'laundry', label: '🧺 Laundry', count: laundryCount }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-purple-600 text-white shadow'
                    : 'opacity-50 hover:opacity-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Grid vs List */}
          <div className="flex bg-[var(--bg-accent)] p-0.5 rounded-xl border border-[var(--border-primary)]">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid' ? 'bg-purple-600 text-white shadow' : 'opacity-40 hover:opacity-100'
              }`}
              title="Lookbook Grid View"
            >
              🔲
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list' ? 'bg-purple-600 text-white shadow' : 'opacity-40 hover:opacity-100'
              }`}
              title="Detail List View"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* ── Category Filter Scroll Ribbon ─────────────────────── */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => {
            setFilter('all');
            trackWardrobeInteraction('filter', items.length);
          }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-tight transition-all border whitespace-nowrap shadow-sm ${
            filter === 'all'
              ? 'bg-purple-600 border-purple-600 text-white shadow-purple-500/30'
              : 'bg-[var(--bg-accent)] border-[var(--border-primary)] opacity-60 hover:opacity-100 hover:scale-105 active:scale-95'
          }`}
        >
          <span className="w-3 h-3"><IconRenderer icon={FashionIcons.Wardrobe} /></span>
          All
        </button>

        {Object.entries(WARDROBE_SECTIONS)
          .filter(([key]) => key !== 'OTHER')
          .sort(([, a], [, b]) => a.order - b.order)
          .map(([sectionKey, section]) => {
            const count = statusFiltered.filter(i => getCategoryGroup(i.category) === sectionKey).length;
            return (
              <button
                key={sectionKey}
                onClick={() => {
                  setFilter(sectionKey);
                  trackWardrobeInteraction('filter', items.length);
                }}
                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-tight transition-all border whitespace-nowrap shadow-sm ${
                  filter === sectionKey
                    ? 'bg-purple-600 border-purple-600 text-white shadow-purple-500/30'
                    : 'bg-[var(--bg-accent)] border-[var(--border-primary)] opacity-60 hover:opacity-100 hover:scale-105 active:scale-95'
                }`}
              >
                <span className="text-sm leading-none">{section.emoji}</span>
                {section.label.split(' ')[0]}
                <span
                  className={`ml-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    count > 0
                      ? filter === sectionKey
                        ? 'bg-white/20 text-white'
                        : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                      : filter === sectionKey
                      ? 'bg-white/10 text-white/50'
                      : 'bg-gray-200/60 dark:bg-white/5 text-gray-400 dark:text-white/20'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
      </div>

      {/* ── WARDROBE CONTENT AREA ────────────────────────────── */}
      {items.length === 0 ? (
        /* ── Full Empty State with Direct Add CTA ── */
        <div className="mt-6 text-center py-14 px-4 rounded-3xl border border-dashed border-[var(--border-primary)] bg-[var(--card-bg)]">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-3xl shadow-inner">
            👗
          </div>
          <h3 className="font-black text-xl mb-2 tracking-tight">Your Smart Wardrobe is Empty</h3>
          <p className="text-xs opacity-50 max-w-sm mx-auto mb-6 leading-relaxed">
            Add your favorite clothes directly to unlock AI-powered look combinations, laundry tracking, and styling harmony.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>＋</span>
              <span>Add Your First Clothing Piece</span>
            </button>

            {onShowResult && (
              <button
                type="button"
                onClick={() => onShowResult(null)}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-[var(--border-primary)] hover:bg-[var(--bg-accent)] text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <span>📸</span>
                <span>Scan Outfit with Camera</span>
              </button>
            )}
          </div>
        </div>
      ) : finalFilteredItems.length === 0 ? (
        /* ── Filter / Search Empty State ── */
        <div className="text-center py-14 px-4 rounded-3xl border border-dashed border-[var(--border-primary)] bg-[var(--card-bg)]">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--border-primary)] bg-[var(--bg-accent)] text-2xl">
            {filter !== 'all' ? WARDROBE_SECTIONS[filter]?.emoji || '👗' : '🔍'}
          </div>
          <p className="text-sm font-black mb-1">
            {searchQuery
              ? `No items matching "${searchQuery}"`
              : filter !== 'all'
              ? `No ${WARDROBE_SECTIONS[filter]?.label || 'items'} in your closet yet`
              : 'No items match your active filters'}
          </p>
          <p className="text-xs opacity-50 mb-6">
            {searchQuery ? 'Try another keyword or clear search' : 'Add one now or shop matching trends!'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2.5 rounded-xl border border-[var(--border-primary)] text-xs font-bold"
              >
                Clear Search
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenAddModal(filter !== 'all' ? `cat_${filter.toLowerCase()}` : '')}
                  className="px-5 py-2.5 rounded-2xl bg-purple-600 text-white text-xs font-black uppercase tracking-wider shadow hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span>＋</span> Add to this category
                </button>

                {filter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      const meta = WARDROBE_SECTIONS[filter];
                      const lower = (meta?.label || '').toLowerCase();
                      let itemType = 'shirt';
                      if (lower.includes('bottom') || lower.includes('pant')) itemType = 'pant';
                      else if (lower.includes('dress')) itemType = 'dress';
                      else if (lower.includes('ethnic')) itemType = 'kurti';
                      else if (lower.includes('top') || lower.includes('shirt')) itemType = 'top';
                      else if (lower.includes('foot') || lower.includes('shoe')) itemType = 'shoe';
                      const url = buildMyntraSearchUrl(meta?.label || filter, gender, itemType);
                      window.open(url, '_blank');
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-black uppercase tracking-wider shadow hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <span>🛍️</span> Shop on Myntra
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── LOOKBOOK GRID VIEW ── */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {finalFilteredItems.map(item => (
            <WardrobeGridCard
              key={item.id}
              item={item}
              onInspect={setInspectedItem}
              handleToggleLaundry={handleToggleLaundry}
              handleDelete={handleDelete}
              deletingId={deletingId}
              gender={gender}
              t={t}
              isDark={isDark}
            />
          ))}
        </div>
      ) : (
        /* ── EDITORIAL LIST VIEW ── */
        <div className="space-y-3">
          {finalFilteredItems.map(item => (
            <WardrobeItemRow
              key={item.id}
              item={item}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              deletingId={deletingId}
              handleDelete={handleDelete}
              handleToggleLaundry={handleToggleLaundry}
              gender={gender}
              t={t}
              formatDate={formatDate}
              isDark={isDark}
            />
          ))}
        </div>
      )}

      {/* ── Direct Add Item Modal ────────────────────────────── */}
      <AddWardrobeItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onItemAdded={handleItemAddedSuccessfully}
        defaultGender={gender}
        initialCategory={addModalInitialCategory}
      />

      {/* ── Quick Item Inspector Modal ───────────────────────── */}
      {inspectedItem && (
        <ItemInspectModal
          item={inspectedItem}
          onClose={() => setInspectedItem(null)}
          handleToggleLaundry={handleToggleLaundry}
          handleDelete={handleDelete}
          gender={gender}
          t={t}
          isDark={isDark}
        />
      )}

      {/* ── Global Toast ─────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 backdrop-blur-md text-white text-xs font-black px-5 py-3 rounded-full shadow-2xl border border-white/10 animate-fade-in flex items-center gap-2">
          {toast}
        </div>
      )}
    </div>
  );
}

export default WardrobePanel;
