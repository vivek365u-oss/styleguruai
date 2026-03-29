import React, { useContext } from 'react';
import { ThemeContext } from '../App';

function hexToRGB(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function colorDistance(hex1, hex2) {
  const c1 = hexToRGB(hex1);
  const c2 = hexToRGB(hex2);
  return Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2));
}

export default function CoupleResults({ data, uploadedImages, onReset }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const { partner1, partner2, occasion } = data;
  const p1Img = uploadedImages[0];
  const p2Img = uploadedImages[1];

  // 1. Calculate the harmonized color palette
  const p1Colors = [
    ...(partner1.recommendations.best_shirt_colors || []),
    ...(partner1.recommendations.best_dress_colors || []),
  ];
  const p2Colors = [
    ...(partner2.recommendations.best_shirt_colors || []),
    ...(partner2.recommendations.best_dress_colors || []),
  ];

  // Find 2 closely matching colors, and 2 complementary colors
  let harmonized = [];
  p1Colors.forEach(c1 => {
    p2Colors.forEach(c2 => {
      if (colorDistance(c1.hex, c2.hex) < 50) {
        if (!harmonized.some(h => h.name === c1.name)) {
          harmonized.push({ ...c1, matched: true });
        }
      }
    });
  });

  // If no strict matches, just take the best 2 from each to create a contrasting but cohesive palette
  if (harmonized.length < 4) {
    const needed = 4 - harmonized.length;
    for (let i = 0; i < Math.ceil(needed / 2) && i < p1Colors.length; i++) {
      if (!harmonized.some(h => h.name === p1Colors[i].name)) harmonized.push({ ...p1Colors[i], matched: false, owner: 'Partner 1' });
    }
    for (let i = 0; i < Math.ceil(needed / 2) && i < p2Colors.length; i++) {
      if (!harmonized.some(h => h.name === p2Colors[i].name)) harmonized.push({ ...p2Colors[i], matched: false, owner: 'Partner 2' });
    }
  }

  const p1Label = partner1.gender === 'female' ? '👩 Hers' : '👨 His';
  const p2Label = partner2.gender === 'female' ? '👩 Hers' : '👨 His';

  const occasionConfigs = {
    wedding: {
      title: '💍 Wedding / Festive',
      outfits: [
        { title: 'Tonal Harmony', p1: 'Deep jewel tone Lehenga/Suit', p2: 'Matching Sherwani or pocket square in the exact same hue' },
        { title: 'Classic Contrast', p1: 'Ivory/Gold ethnic wear', p2: 'Rich dark tone (Navy/Burgundy) ethnic wear' }
      ]
    },
    casual: {
      title: '😎 Casual Vibes',
      outfits: [
        { title: 'Streetwear Match', p1: 'Oversized graphic tee + Cargo', p2: 'Color-coordinated crop top + baggy jeans' },
        { title: 'Denim Duo', p1: 'White top + Light wash denim', p2: 'White top + Light wash denim' }
      ]
    },
    party: {
      title: '🎉 Party Night',
      outfits: [
        { title: 'Night Out Contrast', p1: 'Black outfit with bright accent', p2: 'Bright colored outfit (matching the accent)' },
        { title: 'Metallic Pop', p1: 'Sequin or metallic element', p2: 'Dark neutral base (Black/Navy)' }
      ]
    },
    date: {
      title: '❤️ Romantic Date',
      outfits: [
        { title: 'Soft Coordination', p1: 'Pastel or soft toned outfit', p2: 'Complementary soft tone (e.g. Sage + Rose)' },
        { title: 'Evening Elegance', p1: 'Deep saturated color', p2: 'Dark neutral (Black/Charcoal) with a subtle matching accessory' }
      ]
    },
    office: {
      title: '💼 Office / Formal',
      outfits: [
        { title: 'Power Couple', p1: 'Navy blazer + trousers', p2: 'Grey suit + subtle patterned tie/scarf' }
      ]
    }
  };

  const currentOccasion = occasionConfigs[occasion] || occasionConfigs.casual;

  return (
    <div className="space-y-6 pb-6 animate-fade-in relative z-10 bg-transparent">
      {/* Confetti effect */}
      <div className="fixed inset-0 pointer-events-none z-50 flex items-start justify-center pt-20">
        <div className="text-center scale-in">
          <p className="text-4xl mb-2">👩‍❤️‍👨</p>
          <p className="text-white font-black text-lg bg-rose-600/90 px-6 py-3 rounded-2xl shadow-2xl">
            Couple Match Found!
          </p>
        </div>
      </div>

      <div className={`flex items-center gap-2 flex-wrap rounded-xl px-3 py-2 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
        <span className={`text-xs font-semibold ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Styled for:</span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${isDark ? 'bg-rose-500/20 border-rose-500/30 text-rose-300' : 'bg-rose-100 border-rose-300 text-rose-700'}`}>
          {currentOccasion.title}
        </span>
      </div>

      {/* Side by Side Profiles */}
      <div className="grid grid-cols-2 gap-3">
        {/* Partner 1 */}
        <div className={`rounded-3xl overflow-hidden border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
          <img src={p1Img} alt="Partner 1" className="w-full h-32 object-cover" />
          <div className="p-3 text-center border-t-4" style={{ borderColor: partner1.analysis.skin_color.hex }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-1 block">Partner 1</span>
            <p className={`text-sm font-black capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{partner1.analysis.skin_tone.category}</p>
            <p className={`text-[10px] uppercase font-bold mt-0.5 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{partner1.analysis.skin_tone.color_season}</p>
          </div>
        </div>
        {/* Partner 2 */}
        <div className={`rounded-3xl overflow-hidden border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
          <img src={p2Img} alt="Partner 2" className="w-full h-32 object-cover" />
          <div className="p-3 text-center border-t-4" style={{ borderColor: partner2.analysis.skin_color.hex }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-1 block">Partner 2</span>
            <p className={`text-sm font-black capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{partner2.analysis.skin_tone.category}</p>
            <p className={`text-[10px] uppercase font-bold mt-0.5 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{partner2.analysis.skin_tone.color_season}</p>
          </div>
        </div>
      </div>

      {/* Harmonized Palette */}
      <div className={`rounded-3xl p-5 border ${isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-200 shadow-sm'}`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🎨</span>
          <div>
            <h3 className={`font-black text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Harmonized Palette</h3>
            <p className={`text-[10px] ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Colors that flatter both partners</p>
          </div>
        </div>

        <div className="space-y-3">
          {harmonized.slice(0, 4).map((color, i) => (
            <div key={i} className={`flex items-center gap-3 rounded-2xl p-2.5 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
              <div className="w-12 h-12 rounded-xl flex-shrink-0 shadow-inner border border-black/5" style={{ backgroundColor: color.hex }} />
              <div>
                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{color.name}</p>
                <div className="flex gap-2 mt-1">
                  {color.matched ? (
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'}`}>Perfect Match Both</span>
                  ) : (
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-700'}`}>Accent color for {color.owner}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Outfit Match Ideas */}
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>👗 Matching Outfit Ideas</p>
        <div className="space-y-3">
          {currentOccasion.outfits.map((outfit, i) => (
            <div key={i} className={`rounded-3xl p-4 border relative overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-500/10 to-transparent blur-2xl rounded-bl-[100px]" />
              <p className={`font-black text-sm mb-3 ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>{outfit.title}</p>
              
              <div className="flex flex-col gap-2 relative z-10">
                <div className={`flex items-start gap-2 p-2 rounded-xl ${isDark ? 'bg-black/20' : 'bg-gray-50'}`}>
                  <span className="text-xs mt-0.5">{p1Label.split(' ')[0]}</span>
                  <div>
                    <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Partner 1</span>
                    <p className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>{outfit.p1}</p>
                  </div>
                </div>
                <div className={`flex items-start gap-2 p-2 rounded-xl border border-dashed ${isDark ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-200'}`}>
                  <span className="text-xs mt-0.5">{p2Label.split(' ')[0]}</span>
                  <div>
                    <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-rose-400' : 'text-rose-500'}`}>Partner 2</span>
                    <p className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>{outfit.p2}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onReset} className="w-full mt-4 px-6 py-3 rounded-xl border border-rose-500/50 text-rose-500 font-bold hover:bg-rose-500/10 transition">
        Try Another Match
      </button>

    </div>
  );
}
