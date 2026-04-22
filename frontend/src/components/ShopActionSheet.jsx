import React, { useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { buildShopUrl, COMMON_STORES, MALE_STORES, FEMALE_STORES } from '../utils/shoppingUrls';
import { getThemeColors } from '../utils/themeColors';

/**
 * ShopActionSheet - A high-end, DNA-styled shopping portal.
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

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 md:p-8" style={{ pointerEvents: 'auto' }}>
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
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="relative w-full max-w-[440px] overflow-hidden rounded-[2.5rem] border shadow-[0_0_100px_rgba(139,92,246,0.2)]"
            style={{
              background: isDark ? '#0A0C10' : '#FFFFFF',
              borderColor: isDark ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Tech Grid Background (DNA Style) */}
            <div 
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{ 
                backgroundImage: `radial-gradient(${VIOLET} 1px, transparent 1px)`, 
                backgroundSize: '24px 24px' 
              }} 
            />

            {/* Close Button (X) */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white transition-all active:scale-90"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative z-10 p-8 sm:p-10">
              {/* Header Segment */}
              <div className="mb-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 shadow-2xl shadow-violet-500/40">
                  <span className="text-3xl animate-pulse">🛍️</span>
                </div>
                
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.4em] text-violet-500" style={{ fontFamily: PJS }}>
                  Style Search Protocol
                </p>
                <h3 className="text-3xl font-black tracking-tight" style={{ fontFamily: PDI, color: C.text }}>
                  Smart Shop
                </h3>
                <div className="mt-3 inline-block px-4 py-1.5 rounded-full bg-violet-500/5 border border-violet-500/10">
                  <p className="text-[11px] font-bold italic" style={{ fontFamily: PJS, color: isDark ? '#CCC' : '#555' }}>
                    "{item ? (item.length > 35 ? item.substring(0, 32) + '...' : item) : 'Loading style...'}"
                  </p>
                </div>
              </div>

              {/* Stores Grid - Compact & Scrollable */}
              <div className="grid grid-cols-2 gap-3 mb-8 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                {allStores.map((store, idx) => (
                  <motion.button
                    key={store.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => {
                      if (!item) return;
                      window.open(buildShopUrl(item, store.id, gender, budget), '_blank');
                      onClose();
                    }}
                    className="group relative flex flex-col items-center justify-center rounded-[1.75rem] border p-4 transition-all hover:bg-white/[0.03] active:scale-95"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                      borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                    }}
                  >
                    <div 
                      className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl shadow-xl transition-transform group-hover:scale-110 group-hover:rotate-6"
                      style={{ background: store.bg }}
                    >
                      <span className="text-xl">{store.emoji}</span>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest opacity-80" style={{ fontFamily: PJS, color: C.text }}>
                      {store.name}
                    </span>

                    {/* Subtle Hover Border */}
                    <div 
                      className="absolute inset-0 rounded-[1.75rem] opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none"
                      style={{ border: `2px solid ${store.color}60` }}
                    />
                  </motion.button>
                ))}
              </div>

              {/* Verified Badge */}
              <div className="flex items-center justify-center gap-2.5 mb-8 py-3 px-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] shadow-lg shadow-emerald-500/30">🛡️</div>
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500/80" style={{ fontFamily: PJS }}>
                  Verified Official Store Links
                </p>
              </div>

              {/* Footer Info */}
              <p className="text-center text-[9px] font-bold uppercase tracking-[0.2em] opacity-30" style={{ fontFamily: PJS, color: C.text }}>
                Powered by StyleGuru AI Engine
              </p>
            </div>
          </motion.div>

          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: ${VIOLET}40; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${VIOLET}70; }
          `}</style>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default ShopActionSheet;
