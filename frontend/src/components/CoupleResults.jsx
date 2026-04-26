import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { saveHistory, auth } from '../api/styleApi';
import ShopActionSheet from './ShopActionSheet';

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

  const [shopItem, setShopItem] = useState(null);

  const handleShop = (query, gender) => {
    setShopItem({ query, gender });
  };

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

  const hColor1 = harmonized[0]?.name || 'White';
  const hColor2 = harmonized[1]?.name || 'Black';
  const hColor3 = harmonized[2]?.name || 'Neutral';

  const occasionConfigs = {
    wedding: {
      title: '💍 Wedding / Festive',
      outfits: [
        { 
          title: 'Tonal Harmony', 
          p1: `Deep jewel-tone ${hColor1} Lehenga / Anarkali / Gown`, 
          p2: `Matching ${hColor1} Sherwani or Kurta set`,
          accessories: 'P1: Heavy Kundan choker, Polki earrings. P2: Contrast pocket square, embellished Mojaris.',
          vibe: 'Royal & Highly Coordinated'
        },
        { 
          title: 'Classic Contrast', 
          p1: `${hColor2} ethnic wear with fine gold embroidery`, 
          p2: `Rich ${hColor3} ethnic wear`,
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
          p1: `${hColor1} fitted top + Light wash wide-leg denim`, 
          p2: `${hColor1} oversized tee + Light wash straight denim`,
          accessories: 'P1: Chunky white sneakers, silver hoops, mini backpack. P2: White sneakers, minimalist chain.',
          vibe: 'Relaxed & Trendy'
        },
        { 
          title: 'Color-Block Match', 
          p1: `${hColor2} crop top + Cargo pants`, 
          p2: `Matching ${hColor2} oversized graphic tee + Relaxed cargo pants`,
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
          p1: `Sleek black outfit with a bright ${hColor1} accent`, 
          p2: `${hColor1} colored outfit (matching Partner 1's accent)`,
          accessories: 'P1: Metallic clutch, statement rings, stiletto boots. P2: Leather jacket, silver chain, Chelsea boots.',
          vibe: 'Bold & Electrifying'
        },
        { 
          title: 'Glam & Neutral', 
          p1: `${hColor2} element dress/top`, 
          p2: `Dark neutral base with subtle ${hColor2} texture`,
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
          p1: `${hColor3} slip dress / elegant top`, 
          p2: `Complementary ${hColor3} shirt + Chinos`,
          accessories: 'P1: Delicate pendant, strappy heels, mini clutch. P2: Brown leather watch, suede loafers.',
          vibe: 'Sweet & Harmonious'
        },
        { 
          title: 'Evening Elegance', 
          p1: `Deep saturated ${hColor2} midi/maxi dress`, 
          p2: `Dark neutral blazer over crisp shirt with subtle ${hColor2} pocket square`,
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
          p1: `Flowy ${hColor1} floral maxi dress`, 
          p2: `Linen shirt (in ${hColor1}) + Tailored shorts`,
          accessories: 'P1: Wide-brim straw hat, oversized sunglasses, woven tote. P2: Aviators, canvas espadrilles.',
          vibe: 'Breezy & Refreshing'
        },
        { 
          title: 'Resort Whites', 
          p1: `All-white linen set with ${hColor2} accessories`, 
          p2: `White linen shirt + ${hColor2} shorts`,
          accessories: 'P1: Gold layered necklaces, slide sandals. P2: Leather slide sandals, beaded bracelet.',
          vibe: 'Clean & Luxurious'
        }
      ]
    }
  };

  const currentOccasion = occasionConfigs[activeOutfitTab] || occasionConfigs.casual;

  const p1Tone = partner1.analysis.skin_tone.undertone || 'neutral';
  const p2Tone = partner2.analysis.skin_tone.undertone || 'neutral';

  let chemistryScore = 95;
  let aestheticVibe = "Harmonious Classics";
  let vibeDesc = "Your skin tones balance each other out perfectly.";

  if (p1Tone === p2Tone) {
     chemistryScore = 98;
     if (p1Tone === 'warm') {
        aestheticVibe = "Golden Hour Luxury";
        vibeDesc = "Both of you have warm undertones. Earthy, rich, and golden palettes will make you both look incredibly radiant together.";
     } else if (p1Tone === 'cool') {
        aestheticVibe = "Icy Elegance";
        vibeDesc = "You share a cool undertone. Jewel tones, crisp whites, and silver accents will make you look like a power couple.";
     } else {
        aestheticVibe = "Sleek Modernists";
        vibeDesc = "With neutral undertones, you two can pull off almost any matching aesthetic with effortless style.";
     }
  } else if ((p1Tone === 'warm' && p2Tone === 'cool') || (p1Tone === 'cool' && p2Tone === 'warm')) {
     chemistryScore = 92;
     aestheticVibe = "Striking Fire & Ice";
     vibeDesc = "Opposites attract! The contrast between warm and cool tones means you look best when color-blocking or choosing one unifying neutral color.";
  } else {
     chemistryScore = 96;
     aestheticVibe = "Dynamic Duo";
     vibeDesc = "One of you leans neutral, giving you incredible flexibility to mix and match both warm earth tones and cool jewel tones.";
  }

  const getLightingGuide = () => {
     if (p1Tone === 'warm' || p2Tone === 'warm') {
        return { time: "Golden Hour (4 PM - 6 PM)", tip: "Natural sunlight will beautifully highlight your warm, glowing undertones. Avoid harsh white flashes." };
     } else if (p1Tone === 'cool' && p2Tone === 'cool') {
        return { time: "Blue Hour & Studio Lighting", tip: "Crisp white studio lights or the soft, cool light just after sunset will make your features pop." };
     }
     return { time: "Soft Overcast Light", tip: "Diffused, cloudy natural light provides the best balance for your mixed undertones." };
  };
  const lighting = getLightingGuide();

  const p1Avoid = partner1.recommendations.colors_to_avoid?.[0]?.name || 'Neon Colors';
  const p2Avoid = partner2.recommendations.colors_to_avoid?.[0]?.name || 'Muddy Browns';

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

      {/* Premium Feature: Avoid Mixing */}
      <div className={`rounded-3xl p-4 border flex items-center gap-4 shadow-sm ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
          <div className="text-2xl">⚠️</div>
          <div>
             <h3 className={`text-[11px] font-black uppercase tracking-wider ${isDark ? 'text-red-400' : 'text-red-600'}`}>Clash Warning</h3>
             <p className={`text-[11px] mt-1 leading-snug ${isDark ? 'text-red-100/70' : 'text-red-800/80'}`}>
                To maintain harmony in photos, try avoiding <strong className={isDark ? 'text-white' : 'text-black'}>{p1Avoid}</strong> when your partner wears <strong className={isDark ? 'text-white' : 'text-black'}>{p2Avoid}</strong>.
             </p>
          </div>
      </div>

      {/* Premium Feature: Fabric & Texture Synergy */}
      <div className={`rounded-3xl p-5 border shadow-sm ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
         <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🧵</span>
            <h3 className={`font-black text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Texture Synergy</h3>
         </div>
         <p className={`text-[11px] mb-4 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Elevate your matching outfits by pairing the right premium textures.</p>
         
         <div className="grid grid-cols-2 gap-3">
            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
               <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block mb-1">Daytime / Casual</span>
               <p className={`text-[12px] font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Linen + Cotton</p>
               <p className={`text-[10px] leading-snug ${isDark ? 'text-emerald-100/60' : 'text-emerald-800/80'}`}>Breathable and relaxed. Perfect for brunch or tropical vacations.</p>
            </div>
            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
               <span className="text-[9px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 block mb-1">Evening / Formal</span>
               <p className={`text-[12px] font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Silk + Velvet</p>
               <p className={`text-[10px] leading-snug ${isDark ? 'text-purple-100/60' : 'text-purple-800/80'}`}>Creates a rich, luxurious contrast that photographs beautifully.</p>
            </div>
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
            <div key={i} className={`rounded-3xl p-5 border relative overflow-hidden shadow-md transition-all hover:shadow-lg ${isDark ? 'bg-gradient-to-b from-white/5 to-black/40 border-white/10' : 'bg-gradient-to-b from-white to-rose-50/30 border-gray-200'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/20 to-transparent blur-3xl rounded-bl-[100px] pointer-events-none" />
              
              <div className="flex justify-between items-center mb-4 relative z-10">
                <p className={`font-black text-[15px] ${isDark ? 'text-transparent bg-clip-text bg-gradient-to-r from-rose-300 to-pink-400' : 'text-rose-600'}`}>{outfit.title}</p>
                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest shadow-sm ${isDark ? 'bg-purple-500/20 border-purple-500/30 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-700'}`}>
                  {outfit.vibe}
                </span>
              </div>
              
              <div className="flex flex-col gap-3 relative z-10 w-full">
                {/* Outfits block */}
                <div className={`grid grid-cols-2 gap-3 p-3.5 rounded-2xl border shadow-sm ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                  <div className="pr-3 border-r border-gray-200 dark:border-white/10 flex flex-col justify-between">
                    <div>
                      <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 mb-1.5 ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
                        {p1Label} <span className="opacity-40">OUTFIT</span>
                      </span>
                      <p className={`text-[13px] font-medium leading-relaxed ${isDark ? 'text-white/90' : 'text-gray-800'}`}>{outfit.p1}</p>
                    </div>
                  </div>
                  <div className="pl-1 flex flex-col justify-between">
                    <div>
                      <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 mb-1.5 ${isDark ? 'text-rose-400' : 'text-rose-500'}`}>
                        {p2Label} <span className="opacity-40">OUTFIT</span>
                      </span>
                      <p className={`text-[13px] font-medium leading-relaxed ${isDark ? 'text-white/90' : 'text-gray-800'}`}>{outfit.p2}</p>
                    </div>
                  </div>
                </div>

                {/* Accessories Block */}
                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                   <span className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                     💎 Deep Accessory Analysis
                   </span>
                   <p className={`text-[12px] leading-relaxed ${isDark ? 'text-amber-100/80' : 'text-amber-900/80'}`}>
                     {outfit.accessories.split('. P2:').map((part, idx) => {
                       if (idx === 0) return <span key={idx}><strong className={isDark ? 'text-amber-300' : 'text-amber-700'}>{p1Label}:</strong> {part.replace('P1:', '')}<br/></span>;
                       return <span key={idx} className="block mt-1.5"><strong className={isDark ? 'text-amber-300' : 'text-amber-700'}>{p2Label}:</strong> {part}</span>;
                     })}
                   </p>
                </div>

                {/* WOW Shopping Links */}
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                   <button 
                     onClick={() => handleShop(outfit.p1.split('+')[0].trim(), partner1.gender)}
                     className={`py-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-900 text-white hover:bg-gray-800'} shadow-md`}
                   >
                     🛍️ Shop {p1Label.replace(/[^a-zA-Z]/g, '')}
                   </button>
                   <button 
                     onClick={() => handleShop(outfit.p2.split('+')[0].trim(), partner2.gender)}
                     className={`py-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/30 hover:shadow-lg hover:shadow-rose-500/40`}
                   >
                     🛍️ Shop {p2Label.replace(/[^a-zA-Z]/g, '')}
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onReset} className="w-full mt-4 px-6 py-3 rounded-xl border border-rose-500/50 text-rose-500 font-bold hover:bg-rose-500/10 transition">
        Try Another Match
      </button>

      {/* Shopping Modal Integration */}
      <ShopActionSheet
        isOpen={!!shopItem}
        onClose={() => setShopItem(null)}
        item={shopItem?.query}
        gender={shopItem?.gender || 'male'}
      />

    </div>
  );
}
