import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { saveHistory, auth } from '../api/styleApi';

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

  const { partner1, partner2 } = data || {};
  const p1Img = uploadedImages?.[0] || '';
  const p2Img = uploadedImages?.[1] || '';

  // Guard against corrupted or stub history entries
  if (!partner1 || !partner2 || !partner1.recommendations || !partner2.recommendations) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center animate-fade-in relative z-10">
         <p className="text-4xl mb-4">💔</p>
         <h2 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Incomplete Match Data</h2>
         <p className={`text-sm mb-6 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>This match was saved in an older version or is incomplete. Please run a new couple analysis.</p>
         <button onClick={onReset} className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold shadow-lg">
           Run New Match
         </button>
      </div>
    );
  }

  // Bug C1 fix: auto-dismiss banner after 2.5 seconds
  const [showBanner, setShowBanner] = useState(true);
  const [activeOutfitTab, setActiveOutfitTab] = useState('casual'); // New internal tab state
  useEffect(() => {
    const timer = setTimeout(() => setShowBanner(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Removed duplicate saveHistory logic as AppShell already saves the full payload.

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
    // Bug C4 fix: track exactly how many we need, don't overfill
    let remaining = needed;
    for (let i = 0; i < p1Colors.length && remaining > 0; i++) {
      if (!harmonized.some(h => h.name === p1Colors[i].name)) {
        harmonized.push({ ...p1Colors[i], matched: false, owner: 'Partner 1' });
        remaining--;
      }
    }
    for (let i = 0; i < p2Colors.length && remaining > 0; i++) {
      if (!harmonized.some(h => h.name === p2Colors[i].name)) {
        harmonized.push({ ...p2Colors[i], matched: false, owner: 'Partner 2' });
        remaining--;
      }
    }
  }

  const p1Label = partner1.gender === 'female' ? '👩 Hers' : '👨 His';
  const p2Label = partner2.gender === 'female' ? '👩 Hers' : '👨 His';

  const occasionConfigs = {
    wedding: {
      title: '💍 Wedding / Festive',
      outfits: [
        { 
          title: 'Tonal Harmony', 
          p1: 'Deep jewel-tone Lehenga / Anarkali / Gown', 
          p2: 'Matching Sherwani or Kurta set in the exact same hue',
          accessories: 'P1: Heavy Kundan choker, Polki earrings. P2: Contrast pocket square, embellished Mojaris.',
          vibe: 'Royal & Highly Coordinated'
        },
        { 
          title: 'Classic Contrast', 
          p1: 'Ivory or Champagne Gold ethnic wear with fine embroidery', 
          p2: 'Rich dark tone (Navy/Burgundy) ethnic wear',
          accessories: 'P1: Pearl drops, gold potli bag. P2: Classic metallic watch, sleek formal shoes.',
          vibe: 'Elegant & Sophisticated'
        }
      ]
    },
    casual: {
      title: '😎 Streetwear / Casual',
      outfits: [
        { 
          title: 'Urban Denim Duo', 
          p1: 'White fitted top + Light wash wide-leg denim', 
          p2: 'White oversized tee + Light wash straight denim',
          accessories: 'P1: Chunky white sneakers, silver hoops, mini backpack. P2: White sneakers, minimalist chain.',
          vibe: 'Relaxed & Trendy'
        },
        { 
          title: 'Color-Block Match', 
          p1: 'Color-coded crop top + Cargo pants', 
          p2: 'Matching oversized graphic tee + Relaxed cargo pants',
          accessories: 'P1: Crossbody bag, bucket hat, slim sunglasses. P2: Beanie, retro sneakers.',
          vibe: 'Edgy & Modern'
        }
      ]
    },
    party: {
      title: '🎉 Party / Club',
      outfits: [
        { 
          title: 'Night Out Contrast', 
          p1: 'Sleek black outfit with a bright neon/metallic accent', 
          p2: 'Bright colored outfit (matching Partner 1\'s accent color)',
          accessories: 'P1: Metallic clutch, statement rings, stiletto boots. P2: Leather jacket, silver chain, Chelsea boots.',
          vibe: 'Bold & Electrifying'
        },
        { 
          title: 'Glam & Neutral', 
          p1: 'Sequin or metallic element dress/top', 
          p2: 'Dark neutral base (Black/Navy) with subtle texture',
          accessories: 'P1: Dainty silver jewelry, sling bag. P2: Matte black watch, textured belt.',
          vibe: 'Chic & Balanced'
        }
      ]
    },
    date: {
      title: '❤️ Romantic Date',
      outfits: [
        { 
          title: 'Soft Coordination', 
          p1: 'Pastel or soft-toned slip dress / elegant top', 
          p2: 'Complementary soft tone shirt (e.g., Sage + Rose) + Chinos',
          accessories: 'P1: Delicate pendant, strappy heels, mini clutch. P2: Brown leather watch, suede loafers.',
          vibe: 'Sweet & Harmonious'
        },
        { 
          title: 'Evening Elegance', 
          p1: 'Deep saturated color (Ruby/Emerald) midi/maxi dress', 
          p2: 'Dark neutral (Black/Charcoal) blazer over crisp shirt with subtle matching pocket square',
          accessories: 'P1: Diamond studs, stilettos. P2: Classic dress watch, Oxfords.',
          vibe: 'Luxurious & Sensual'
        }
      ]
    },
    vacation: {
      title: '🌴 Vacation / Resort',
      outfits: [
        { 
          title: 'Tropical Contrast', 
          p1: 'Flowy floral maxi dress', 
          p2: 'Linen shirt (in one of the floral colors) + Tailored shorts',
          accessories: 'P1: Wide-brim straw hat, oversized sunglasses, woven tote. P2: Aviators, canvas espadrilles.',
          vibe: 'Breezy & Refreshing'
        },
        { 
          title: 'Resort Whites', 
          p1: 'All-white linen set or crochet dress', 
          p2: 'White linen shirt + Khaki/Beige trousers',
          accessories: 'P1: Gold layered necklaces, slide sandals. P2: Leather slide sandals, beaded bracelet.',
          vibe: 'Clean & Luxurious'
        }
      ]
    }
  };

  const currentOccasion = occasionConfigs[activeOutfitTab] || occasionConfigs.casual;

  return (
    <div className="space-y-6 pb-6 animate-fade-in relative z-10 bg-transparent">
      {/* Bug C1 fix: Banner auto-dismisses after 2.5s — was permanently visible */}
      {showBanner && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-start justify-center pt-20 transition-opacity duration-500">
          <div className="text-center scale-in">
            <p className="text-4xl mb-2">👩‍❤️‍👨</p>
            <p className="text-white font-black text-lg bg-rose-600/90 px-6 py-3 rounded-2xl shadow-2xl">
              Couple Match Found!
            </p>
          </div>
        </div>
      )}

      {/* Removed static 'Styled for' block since we are adding dynamic tabs */}

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
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className={`text-xs font-semibold uppercase tracking-wide flex-shrink-0 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>👗 Matching Ideas</p>
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar w-full max-w-[280px]">
            {Object.keys(occasionConfigs).map(key => (
              <button
                key={key}
                onClick={() => setActiveOutfitTab(key)}
                className={`text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full border whitespace-nowrap transition-all ${activeOutfitTab === key
                    ? (isDark ? 'bg-rose-500/20 border-rose-500/30 text-rose-300' : 'bg-rose-100 border-rose-300 text-rose-700')
                    : (isDark ? 'bg-white/5 border-white/10 text-white/50 hover:text-white/80' : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-800')
                  }`}
              >
                {occasionConfigs[key].title.split(' ')[0]} {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {currentOccasion.outfits.map((outfit, i) => (
            <div key={i} className={`rounded-3xl p-4 border relative overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-500/10 to-transparent blur-2xl rounded-bl-[100px]" />
              
              <div className="flex justify-between items-start mb-3">
                <p className={`font-black text-sm ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>{outfit.title}</p>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${isDark ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-600'}`}>
                  {outfit.vibe}
                </span>
              </div>
              
              <div className="flex flex-col gap-2 relative z-10 w-full">
                {/* Outfits block */}
                <div className={`grid grid-cols-2 gap-2 p-2 rounded-xl mb-1 ${isDark ? 'bg-black/20' : 'bg-gray-50'}`}>
                  <div className="pr-2 border-r border-gray-200 dark:border-white/10">
                    <span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                      <span className="whitespace-nowrap">{p1Label}</span> (OUTFIT)
                    </span>
                    <p className={`text-xs mt-1 leading-snug ${isDark ? 'text-white/80' : 'text-gray-700'}`}>{outfit.p1}</p>
                  </div>
                  <div className="pl-1">
                    <span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${isDark ? 'text-rose-400' : 'text-rose-500'}`}>
                      <span className="whitespace-nowrap">{p2Label}</span> (OUTFIT)
                    </span>
                    <p className={`text-xs mt-1 leading-snug ${isDark ? 'text-white/80' : 'text-gray-700'}`}>{outfit.p2}</p>
                  </div>
                </div>

                {/* Accessories Block */}
                <div className={`p-3 rounded-xl border border-dashed ${isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                   <span className={`text-[10px] font-bold uppercase mb-1.5 flex items-center gap-1 ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                     💎 Deep Accessory Analysis
                   </span>
                   <p className={`text-xs leading-relaxed ${isDark ? 'text-amber-100/70' : 'text-amber-800/80'}`}>
                     {outfit.accessories.split('. P2:').map((part, idx) => {
                       if (idx === 0) return <span key={idx}><strong className="opacity-90">Partner 1:</strong> {part.replace('P1:', '')}<br/></span>;
                       return <span key={idx} className="block mt-1"><strong className="opacity-90">Partner 2:</strong> {part}</span>;
                     })}
                   </p>
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
