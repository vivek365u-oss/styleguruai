import React, { useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { buildShopUrl, COMMON_STORES, MALE_STORES, FEMALE_STORES } from '../utils/shoppingUrls';
import { getThemeColors } from '../utils/themeColors';

/**
 * ShopActionSheet - A high-end, DNA-styled shopping portal.
 * Uses React Portals for perfect window-level centering and focus.
 */
const ShopActionSheet = ({ isOpen, onClose, item, gender = 'male', budget = null }) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const C = getThemeColors(theme);

  // Combine stores based on gender
  const isFemale = gender.toLowerCase().includes('female');
  const genderStores = isFemale ? FEMALE_STORES : MALE_STORES;
  const allStores = [...COMMON_STORES, ...genderStores];

  // Stop background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.touchAction = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.touchAction = 'auto';
    };
  }, [isOpen]);

  const PJS = "'Plus Jakarta Sans', 'Inter', sans-serif";
  const PDI = "'Playfair Display', 'Georgia', serif";
  const VIOLET = "#8B5CF6";

  const displayLabel = item ? (typeof item === 'object' ? (item.query || 'Selected Style') : (item.length > 35 ? item.substring(0, 32) + '...' : item)) : 'Selected Style';

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6" style={{ pointerEvents: 'auto' }}>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-xl"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 25 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="relative w-full max-w-[460px] overflow-hidden rounded-[2.5rem] border shadow-[0_0_100px_rgba(139,92,246,0.25)] flex flex-col max-h-[90vh]"
            style={{
              background: isDark ? '#0C0E14' : '#FFFFFF',
              borderColor: isDark ? 'rgba(139,92,246,0.35)' : 'rgba(139,92,246,0.18)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Ambient Top Glow */}
            <div 
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full pointer-events-none blur-3xl opacity-30"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}
            />

            {/* Close Button (X) */}
            <button
              onClick={onClose}
              className={`absolute top-5 right-5 z-20 flex h-9 w-9 items-center justify-center rounded-full border transition-all active:scale-90 ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white' 
                  : 'bg-black/5 border-black/10 text-black/50 hover:bg-black/10 hover:text-black'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative z-10 p-6 sm:p-8 flex flex-col overflow-hidden">
              {/* Header Segment */}
              <div className="mb-5 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 shadow-xl shadow-violet-500/30">
                  <span className="text-2xl animate-pulse">🛍️</span>
                </div>
                
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400 mb-1" style={{ fontFamily: PJS }}>
                  Direct Store Purchase
                </p>
                <h3 className="text-2xl font-black tracking-tight" style={{ fontFamily: PDI, color: C.text }}>
                  Smart Shop
                </h3>

                <div className="mt-2.5 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 max-w-full">
                  <span className="text-[11px] font-extrabold truncate" style={{ fontFamily: PJS, color: isDark ? '#E2E8F0' : '#1E293B' }}>
                    "{displayLabel}"
                  </span>
                  <span className="text-[10px] opacity-60 font-semibold uppercase">
                    • {isFemale ? 'Women' : 'Men'}
                  </span>
                </div>
              </div>

              {/* Stores Grid - Compact & Responsive 10 Stores */}
              <div className="grid grid-cols-2 gap-2.5 mb-5 max-h-[340px] overflow-y-auto pr-1.5 custom-scrollbar">
                {allStores.map((store, idx) => (
                  <motion.button
                    key={store.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => {
                      if (!item) return;
                      const url = buildShopUrl(item, store.id, gender, budget);
                      if (url) window.open(url, '_blank');
                      onClose();
                    }}
                    className="group relative flex items-center gap-3 rounded-2xl border p-2.5 sm:p-3 transition-all hover:scale-[1.02] active:scale-95 text-left"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    }}
                  >
                    <div 
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md transition-transform group-hover:scale-105 overflow-hidden bg-white p-1.5"
                    >
                      {store.domain ? (
                        <img 
                          src={`https://www.google.com/s2/favicons?domain=${store.domain}&sz=128`} 
                          alt={store.name} 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${store.name}&background=${store.color.replace('#','')}&color=fff`;
                          }}
                        />
                      ) : (
                        <span className="text-lg">{store.emoji}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black uppercase tracking-wider truncate" style={{ fontFamily: PJS, color: C.text }}>
                        {store.name}
                      </p>
                      <p className="text-[9px] text-violet-400 font-semibold group-hover:underline">
                        Open Store ↗
                      </p>
                    </div>

                    {/* Subtle Hover Border */}
                    <div 
                      className="absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none"
                      style={{ border: `1.5px solid ${store.color || '#8B5CF6'}` }}
                    />
                  </motion.button>
                ))}
              </div>

              {/* Verified Badge */}
              <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-3">
                <span className="text-xs">🛡️</span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400" style={{ fontFamily: PJS }}>
                  100% Verified Official Store Links
                </p>
              </div>

              {/* Footer Info */}
              <p className="text-center text-[9px] font-bold uppercase tracking-[0.2em] opacity-40" style={{ fontFamily: PJS, color: C.text }}>
                Powered by StyleGuru AI Engine
              </p>

              <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: ${VIOLET}40; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${VIOLET}70; }
              `}</style>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default ShopActionSheet;
