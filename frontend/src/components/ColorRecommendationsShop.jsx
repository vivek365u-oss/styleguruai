// ============================================================
// Color Recommendations Shop Component (Phase 1.4)
// Shows multiple recommended colors with products + outfit combos
// ============================================================
import { useState } from 'react';
import ProductShowcase from './ProductShowcase';

function ColorRecommendationsShop({ recommendations, gender = 'male', isDark = false }) {
  const [activeColorTab, setActiveColorTab] = useState(0);
  const [showOutfits, setShowOutfits] = useState(false);

  // Extract recommended colors based on gender
  const getRecommendedColors = () => {
    if (gender === 'female') {
      const colors = [
        ...( recommendations.best_dress_colors || []),
        ...(recommendations.best_top_colors || []),
        ...(recommendations.best_kurti_colors || []),
        ...(recommendations.best_lehenga_colors || []),
      ];
      return colors.slice(0, 5).filter(c => c && c.name);
    } else {
      const colors = [
        ...(recommendations.best_shirt_colors || []),
        ...(recommendations.best_pant_colors || []),
        ...(recommendations.accent_colors || []),
      ];
      return colors.slice(0, 5).filter(c => c && c.name);
    }
  };

  const recommendedColors = getRecommendedColors();

  if (recommendedColors.length === 0) {
    return (
      <div className="glass-card-premium p-10 rounded-[2.5rem] text-center space-y-4">
        <div className="w-16 h-16 bg-purple-500/10 rounded-3xl flex items-center justify-center mx-auto text-purple-500">
           <IconRenderer icon={FashionIcons.Analysis} />
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2">Style Discovery in Progress</h3>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
            We haven't matched exact products for this specific shade yet, but check out these trending fusion styles that work for all tones!
          </p>
        </div>
        <button className="text-sm font-black text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest">
           Explore Collection →
        </button>
      </div>
    );
  }

  const selectedColor = recommendedColors[activeColorTab];

  return (
    <div className="space-y-6">
      {/* Color Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ✨ Top Colors for You ({recommendedColors.length})
          </h3>
          <button
            onClick={() => setShowOutfits(!showOutfits)}
            className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${
              showOutfits
                ? isDark ? 'bg-purple-500/40 border border-purple-400 text-purple-200' : 'bg-purple-600 text-white'
                : isDark ? 'bg-white/10 border border-white/20 text-white/60 hover:text-white/80' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            👔 Outfits
          </button>
        </div>

        {/* Color Tabs - Responsive Horizontal Scroll with Nested Scrolling Support */}
        <div className="relative -mx-4 px-4">
          <div 
            className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide scroll-smooth snap-x snap-mandatory"
            id="colorTabsScroll"
            role="tablist"
            style={{
              WebkitOverflowScrolling: 'touch', // Smooth momentum scrolling on iOS
              scrollBehavior: 'smooth',
            }}
            onTouchMove={(e) => {
              // Allow child scroll to work independently on touch
              e.stopPropagation();
            }}
          >
            {/* Left spacing for edge items visibility */}
            <div className="flex-shrink-0 w-0" />
            
            {recommendedColors.map((color, idx) => (
              <button
                key={idx}
                role="tab"
                aria-selected={activeColorTab === idx}
                onClick={() => setActiveColorTab(idx)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all flex-shrink-0 snap-center ${
                  activeColorTab === idx
                    ? isDark
                      ? 'bg-purple-500/40 border border-purple-400 text-purple-100 shadow-lg'
                      : 'bg-purple-600 border border-purple-600 text-white shadow-md'
                    : isDark
                    ? 'border border-white/20 bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {color.hex && (
                  <div
                    className="w-4 h-4 rounded-full border-2 border-current flex-shrink-0"
                    style={{ backgroundColor: color.hex }}
                  />
                )}
                <span>{color.name}</span>
              </button>
            ))}
            
            {/* Right spacing for edge items visibility */}
            <div className="flex-shrink-0 w-0" />
          </div>
        </div>

        {/* Why this color? */}
        {selectedColor?.reason && (
          <div
            className={`text-xs p-2.5 rounded-lg border-l-4 ${
              isDark
                ? 'bg-white/5 border-purple-400/50 text-white/70'
                : 'bg-purple-50 border-purple-300 text-purple-700'
            }`}
          >
            💡 <span className="font-semibold">Why {selectedColor.name}?</span> {selectedColor.reason}
          </div>
        )}
      </div>

      {/* Products for Selected Color */}
      <div className="space-y-2">
        <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
          Shop {selectedColor.name}
        </h4>
        <ProductShowcase colorName={selectedColor.name} gender={gender} isDark={isDark} />
      </div>

      {/* Outfit Combinations */}
      {showOutfits && recommendations.outfit_combos && recommendations.outfit_combos.length > 0 && (
        <OutfitCombinations outfits={recommendations.outfit_combos} isDark={isDark} gender={gender} />
      )}
    </div>
  );
}

// ============================================================
// Outfit Combinations Sub-Component with Related Colors
// ============================================================
function OutfitCombinations({ outfits, isDark = false }) {
  const [expandedIdx, setExpandedIdx] = useState(0);

  const outfit = outfits[expandedIdx];

  // Format outfit display based on data structure
  const formatOutfitDisplay = (outfitData) => {
    if (typeof outfitData === 'string') {
      return outfitData;
    }
    if (typeof outfitData === 'object') {
      const parts = [];
      if (outfitData.top) parts.push(`👕 ${outfitData.top}`);
      if (outfitData.bottom) parts.push(`👖 ${outfitData.bottom}`);
      if (outfitData.dupatta && outfitData.dupatta !== '-') parts.push(`🧣 ${outfitData.dupatta}`);
      if (outfitData.shoes && outfitData.shoes !== '-') parts.push(`👞 ${outfitData.shoes}`);
      if (outfitData.occasion) parts.push(`📍 ${outfitData.occasion}`);
      return parts.join(' • ');
    }
    return String(outfitData);
  };

  return (
    <div className={`rounded-xl border p-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200'}`}>
      <h4 className={`text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        👔 Suggested Outfit Combinations
      </h4>

      {/* Outfit Tabs */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        {outfits.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setExpandedIdx(idx)}
            className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-all ${
              expandedIdx === idx
                ? isDark
                  ? 'bg-purple-500/40 text-purple-100'
                  : 'bg-purple-600 text-white'
                : isDark
                ? 'bg-white/10 text-white/60 hover:text-white/80'
                : 'bg-white text-gray-700 border border-purple-200 hover:bg-purple-50'
            }`}
          >
            Combo {idx + 1}
          </button>
        ))}
      </div>

      {/* Outfit Details */}
      {outfit && (
        <div
          className={`p-3 rounded-lg border space-y-2 ${
            isDark
              ? 'bg-white/5 border-white/10 text-white/80'
              : 'bg-white border-purple-200 text-gray-700'
          }`}
        >
          <p className="text-sm leading-relaxed">{formatOutfitDisplay(outfit)}</p>
          
          {/* Vibe/Occasion tip */}
          {outfit.vibe && (
            <div className={`text-xs italic pt-2 border-t ${isDark ? 'border-white/10 text-white/60' : 'border-purple-200 text-gray-600'}`}>
              ✨ Vibe: {outfit.vibe}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ColorRecommendationsShop;
