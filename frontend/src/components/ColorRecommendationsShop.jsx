// ============================================================
// Color Recommendations Shop Component (Phase 1.4)
// Shows multiple recommended colors with products + outfit combos
// ============================================================
import { useState, useContext } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { ThemeContext } from '../App';
import ProductShowcase from './ProductShowcase';

function ColorRecommendationsShop({ recommendations, gender = 'male', isDark = false }) {
  const { t } = useLanguage();
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
      <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-100 border border-gray-200'}`}>
        <p className={isDark ? 'text-white/50' : 'text-gray-600'}>🔍 No color recommendations available</p>
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

        {/* Color Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {recommendedColors.map((color, idx) => (
            <button
              key={idx}
              onClick={() => setActiveColorTab(idx)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                activeColorTab === idx
                  ? isDark
                    ? 'bg-purple-500/40 border border-purple-400 text-purple-100'
                    : 'bg-purple-600 border border-purple-600 text-white shadow-md'
                  : isDark
                  ? 'border border-white/20 bg-white/5 text-white/70 hover:text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {color.hex && (
                <div
                  className="w-4 h-4 rounded-full border-2 border-current"
                  style={{ backgroundColor: color.hex }}
                />
              )}
              <span>{color.name}</span>
            </button>
          ))}
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
        <OutfitCombinations outfits={recommendations.outfit_combos} isDark={isDark} />
      )}
    </div>
  );
}

// ============================================================
// Outfit Combinations Sub-Component
// ============================================================
function OutfitCombinations({ outfits, isDark = false }) {
  const [expandedIdx, setExpandedIdx] = useState(0);

  const outfit = outfits[expandedIdx] || outfits[0];

  return (
    <div className={`rounded-xl border p-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200'}`}>
      <h4 className={`text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        👔 Outfit Combinations
      </h4>

      {/* Outfit Tabs */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        {outfits.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setExpandedIdx(idx)}
            className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap transition-all ${
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
          className={`p-3 rounded-lg border ${
            isDark
              ? 'bg-white/5 border-white/10 text-white/80'
              : 'bg-white border-purple-200 text-gray-700'
          }`}
        >
          <p className="text-sm">{outfit}</p>
        </div>
      )}
    </div>
  );
}

export default ColorRecommendationsShop;
