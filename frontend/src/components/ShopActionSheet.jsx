import React, { useContext, useEffect } from 'react';
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[420px] overflow-hidden rounded-[2.5rem] border shadow-2xl"
            style={{
              background: isDark ? '#0A0C10' : '#FFFFFF',
              borderColor: isDark ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.1)',
              boxShadow: isDark ? '0 0 50px rgba(139,92,246,0.15)' : '0 20px 60px rgba(0,0,0,0.1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Tech Grid Background (DNA Style) */}
            <div 
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ 
                backgroundImage: `radial-gradient(${VIOLET} 1px, transparent 1px)`, 
                backgroundSize: '20px 20px' 
              }} 
            />

            {/* Close Button (X) */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative z-10 p-8 sm:p-10">
              {/* Header Segment */}
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 shadow-xl shadow-violet-500/30">
                  <span className="text-2xl animate-pulse">🛍️</span>
                </div>
                
                <p className="mb-1 text-[9px] font-black uppercase tracking-[0.3em] text-violet-500" style={{ fontFamily: PJS }}>
                  Style Search Protocol
                </p>
                <h3 className="text-2xl font-black tracking-tight" style={{ fontFamily: PDI, color: C.text }}>
                  Smart Shop
                </h3>
                <div className="mt-2 inline-block px-3 py-1 rounded-full bg-violet-500/5 border border-violet-500/10">
                  <p className="text-[10px] font-bold italic" style={{ fontFamily: PJS, color: isDark ? '#AAA' : '#666' }}>
                    "{item ? (item.length > 35 ? item.substring(0, 32) + '...' : item) : 'Loading...'}"
                  </p>
                </div>
              </div>

              {/* Stores Grid - Compact & Scrollable */}
              <div className="grid grid-cols-2 gap-2.5 mb-6 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {allStores.map((store, idx) => (
                  <motion.button
                    key={store.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => {
                      if (!item) return;
                      window.open(buildShopUrl(item, store.id, gender, budget), '_blank');
                      onClose();
                    }}
                    className="group relative flex flex-col items-center justify-center rounded-[1.5rem] border p-3.5 transition-all hover:bg-white/[0.02]"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                      borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    }}
                  >
                    <div 
                      className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6"
                      style={{ background: store.bg }}
                    >
                      <span className="text-lg">{store.emoji}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-60" style={{ fontFamily: PJS, color: C.text }}>
                      {store.name}
                    </span>

                    {/* Subtle Hover Border */}
                    <div 
                      className="absolute inset-0 rounded-[1.5rem] opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none"
                      style={{ border: `2px solid ${store.color}50` }}
                    />
                  </motion.button>
                ))}
              </div>

              {/* Verified Badge */}
              <div className="flex items-center justify-center gap-2 mb-6 py-2.5 px-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[8px]">🛡️</div>
                <p className="text-[9px] font-black uppercase tracking-tight text-emerald-500/70" style={{ fontFamily: PJS }}>
                  Verified Official Store Links
                </p>
              </div>

              {/* Footer Info */}
              <p className="text-center text-[8px] font-bold uppercase tracking-widest opacity-20" style={{ fontFamily: PJS, color: C.text }}>
                Powered by StyleGuru AI Engine
              </p>
            </div>
          </motion.div>

          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 3px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: ${VIOLET}30; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${VIOLET}60; }
          `}</style>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ShopActionSheet;
