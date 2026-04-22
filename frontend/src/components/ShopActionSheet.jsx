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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
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
            className="relative w-full max-w-[480px] overflow-hidden rounded-[2.5rem] border shadow-2xl"
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

            <div className="relative z-10 p-6 sm:p-10">
              {/* Header Segment */}
              <div className="mb-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 shadow-xl shadow-violet-500/30">
                  <span className="text-3xl animate-pulse">🛍️</span>
                </div>
                
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-violet-500" style={{ fontFamily: PJS }}>
                  Style Search Protocol
                </p>
                <h3 className="text-3xl font-black tracking-tight" style={{ fontFamily: PDI, color: C.text }}>
                  Smart Shop
                </h3>
                <div className="mt-3 inline-block px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20">
                  <p className="text-[11px] font-bold italic" style={{ fontFamily: PJS, color: isDark ? '#DDD' : '#444' }}>
                    "{item.length > 40 ? item.substring(0, 37) + '...' : item}"
                  </p>
                </div>
              </div>

              {/* Stores Grid - Compact & Responsive */}
              <div className="grid grid-cols-2 gap-3 mb-8 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                {allStores.map((store, idx) => (
                  <motion.button
                    key={store.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => {
                      window.open(buildShopUrl(item, store.id, gender, budget), '_blank');
                      onClose();
                    }}
                    className="group relative flex flex-col items-center justify-center rounded-3xl border p-4 transition-all hover:bg-white/[0.02]"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                      borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    }}
                  >
                    <div 
                      className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6"
                      style={{ background: store.bg }}
                    >
                      <span className="text-xl">{store.emoji}</span>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider opacity-80" style={{ fontFamily: PJS, color: C.text }}>
                      {store.name}
                    </span>

                    {/* Subtle Hover Border */}
                    <div 
                      className="absolute inset-0 rounded-3xl opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none"
                      style={{ border: `2px solid ${store.color}` }}
                    />
                  </motion.button>
                ))}
              </div>

              {/* Verified Badge */}
              <div className="flex items-center justify-center gap-3 mb-8 py-3 px-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px]">🛡️</div>
                <p className="text-[10px] font-bold leading-tight uppercase tracking-tight text-emerald-500/80" style={{ fontFamily: PJS }}>
                  Direct Official Store Links • Safe Verification Active
                </p>
              </div>

              {/* Close Action */}
              <button
                onClick={onClose}
                className="w-full rounded-2xl border py-4 text-xs font-black uppercase tracking-[0.2em] transition-all hover:bg-violet-500 hover:text-white hover:border-violet-500"
                style={{ 
                  fontFamily: PJS, 
                  color: isDark ? '#888' : '#666',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }}
              >
                Close Portal
              </button>
            </div>
          </motion.div>

          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: ${VIOLET}40; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${VIOLET}80; }
          `}</style>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ShopActionSheet;
