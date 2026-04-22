import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { buildShopUrl, COMMON_STORES, MALE_STORES, FEMALE_STORES } from '../utils/shoppingUrls';
import { getThemeColors } from '../utils/themeColors';

/**
 * ShopActionSheet - A premium bottom sheet for store selection.
 */
const ShopActionSheet = ({ isOpen, onClose, item, gender = 'male', budget = null }) => {
  const { theme } = useContext(ThemeContext);
  const C = getThemeColors(theme);
  const [isClosing, setIsClosing] = useState(false);

  // Combine stores based on gender
  const isFemale = gender.toLowerCase().includes('female');
  const genderStores = isFemale ? FEMALE_STORES : MALE_STORES;
  const allStores = [...COMMON_STORES, ...genderStores];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsClosing(false);
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  if (!isOpen && !isClosing) return null;

  const PJS = "'Plus Jakarta Sans', 'Inter', sans-serif";
  const PDI = "'Playfair Display', 'Georgia', serif";

  return (
    <div 
      className={`fixed inset-0 z-[1000] flex items-end justify-center sm:items-center p-0 sm:p-4 transition-all duration-300 ${
        isOpen && !isClosing ? 'bg-black/60 backdrop-blur-sm opacity-100' : 'bg-black/0 backdrop-blur-0 opacity-0 pointer-events-none'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`w-full max-w-md sm:rounded-[2rem] overflow-hidden transition-all duration-500 ease-out transform ${
          isOpen && !isClosing 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-full sm:translate-y-10 opacity-0 sm:scale-95'
        }`}
        style={{
          background: C.isDark ? '#0F1219' : '#FFFFFF',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.4)',
          border: `1px solid ${C.border}`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Pull Indicator for Mobile */}
        <div className="sm:hidden w-12 h-1.5 rounded-full bg-white/10 mx-auto mt-3 mb-1" />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white text-2xl mb-4 shadow-lg shadow-purple-500/20 animate-bounce-subtle">
              🛍️
            </div>
            <h3 style={{ fontFamily: PDI, color: C.text }} className="text-2xl font-bold mb-1">Select Your Store</h3>
            <p style={{ fontFamily: PJS, color: C.muted }} className="text-sm px-4">
              Best deals for "<span className="text-purple-500 font-semibold">{item}</span>"
            </p>
          </div>

          {/* Stores Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
            {allStores.map((store) => (
              <button
                key={store.id}
                onClick={() => {
                  window.open(buildShopUrl(item, store.id, gender, budget), '_blank');
                  handleClose();
                }}
                className="group relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.03] active:scale-95"
                style={{
                  background: C.glass2,
                  borderColor: C.border,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = store.color;
                  e.currentTarget.style.background = `${store.color}10`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.background = C.glass2;
                }}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-2 shadow-inner transition-transform group-hover:rotate-12"
                  style={{ background: store.bg }}
                >
                  {store.emoji}
                </div>
                <span className="text-xs font-bold text-center" style={{ fontFamily: PJS, color: C.text }}>{store.name}</span>
                
                {/* Visual hover effect line */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 rounded-full transition-all duration-300 group-hover:w-1/2" style={{ background: store.color }} />
              </button>
            ))}
          </div>

          {/* Footer Info */}
          <div className={`p-4 rounded-xl border mb-6 flex items-start gap-3 ${C.isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
            <span className="text-lg">🛡️</span>
            <p className="text-[10px] leading-relaxed" style={{ color: C.muted, fontFamily: PJS }}>
              StyleGuruAI provides direct links to official stores. We ensure you get the most accurate results based on your style analysis.
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="w-full py-4 rounded-2xl font-bold text-sm transition-all hover:bg-white/5"
            style={{ color: C.muted, fontFamily: PJS, border: `1px solid ${C.border}` }}
          >
            Go Back
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ShopActionSheet;
