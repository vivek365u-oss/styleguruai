// ============================================================
// StyleGuru — Outfit of the Day (OOTD)
// Daily outfit suggestion based on skin tone + gender
// ============================================================
import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../App';
import { auth, saveWardrobeItem } from '../api/styleApi';

// Deterministic daily rotation using date hash
function getDayIndex(poolSize) {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  return seed % poolSize;
}

// Outfit pools per skin tone × gender
const OUTFITS = {
  male: {
    fair:    [
      { shirt: 'Navy Blue Polo', shirtHex: '#1e3a5f', pant: 'Beige Chinos', pantHex: '#d2b48c', shoes: 'White Sneakers', occasion: 'Casual', tip: 'Navy + beige is a timeless combo for fair skin' },
      { shirt: 'Dusty Rose Tee', shirtHex: '#c4767a', pant: 'Dark Grey Jeans', pantHex: '#3d3d3d', shoes: 'Brown Loafers', occasion: 'Date', tip: 'Soft pink tones complement your fair complexion beautifully' },
      { shirt: 'Forest Green Shirt', shirtHex: '#2d5a27', pant: 'Navy Trousers', pantHex: '#1b2838', shoes: 'Tan Boots', occasion: 'Office', tip: 'Deep green adds depth without overwhelming light skin' },
      { shirt: 'Lavender Oversized', shirtHex: '#b4a7d6', pant: 'White Jeans', pantHex: '#f5f5f5', shoes: 'Grey Sneakers', occasion: 'Weekend', tip: 'Pastels on fair skin look effortlessly stylish' },
      { shirt: 'Burgundy Henley', shirtHex: '#722f37', pant: 'Black Slim Fit', pantHex: '#1a1a1a', shoes: 'Oxford Brown', occasion: 'Party', tip: 'Burgundy creates a sophisticated, rich contrast' },
    ],
    light:   [
      { shirt: 'Teal Polo', shirtHex: '#008080', pant: 'Khaki Chinos', pantHex: '#c3b091', shoes: 'White Canvas', occasion: 'Casual', tip: 'Teal brings out the warm undertones beautifully' },
      { shirt: 'Coral Oversized', shirtHex: '#ff6f61', pant: 'Dark Wash Jeans', pantHex: '#2b3a67', shoes: 'White Sneakers', occasion: 'Weekend', tip: 'Coral adds a vibrant pop to your natural warmth' },
      { shirt: 'Olive Shirt', shirtHex: '#708238', pant: 'Brown Joggers', pantHex: '#6b4423', shoes: 'Tan Boots', occasion: 'Outdoor', tip: 'Earth tones create a harmonious natural palette' },
      { shirt: 'Steel Blue Tee', shirtHex: '#4682b4', pant: 'Grey Chinos', pantHex: '#808080', shoes: 'Navy Loafers', occasion: 'Office', tip: 'Steel blue is versatile and flattering for light skin' },
      { shirt: 'Terracotta Kurta', shirtHex: '#cc5533', pant: 'White Pyjama', pantHex: '#faf0e6', shoes: 'Kolhapuri', occasion: 'Festive', tip: 'Terracotta + white is a classic festive combination' },
    ],
    medium:  [
      { shirt: 'Royal Blue Tee', shirtHex: '#4169e1', pant: 'Charcoal Slim', pantHex: '#36454f', shoes: 'White Sneakers', occasion: 'Casual', tip: 'Royal blue is your power color — makes medium skin glow' },
      { shirt: 'Burnt Orange Shirt', shirtHex: '#cc5500', pant: 'Dark Navy Jeans', pantHex: '#1b2838', shoes: 'Brown Chelsea', occasion: 'Date', tip: 'Warm oranges harmonize perfectly with wheat tones' },
      { shirt: 'Pine Green Polo', shirtHex: '#01796f', pant: 'Beige Joggers', pantHex: '#d2b48c', shoes: 'Tan Sneakers', occasion: 'Weekend', tip: 'Deep greens create an earthy, sophisticated look' },
      { shirt: 'Maroon Kurta', shirtHex: '#800000', pant: 'Gold Churidar', pantHex: '#c5a35c', shoes: 'Mojari', occasion: 'Wedding', tip: 'Maroon + gold is peak Indian wedding elegance' },
      { shirt: 'Mustard Oversized', shirtHex: '#e8a317', pant: 'Black Cargo', pantHex: '#1a1a1a', shoes: 'White High-tops', occasion: 'Streetwear', tip: 'Mustard on medium skin = instant standout' },
    ],
    olive:   [
      { shirt: 'Cobalt Blue Polo', shirtHex: '#0047ab', pant: 'Tan Chinos', pantHex: '#d2b48c', shoes: 'Brown Loafers', occasion: 'Office', tip: 'Cobalt creates a striking contrast with olive skin' },
      { shirt: 'Emerald Shirt', shirtHex: '#046307', pant: 'Black Trousers', pantHex: '#1a1a1a', shoes: 'Oxford Tan', occasion: 'Formal', tip: 'Emerald + olive skin = naturally harmonious' },
      { shirt: 'Rust Orange Tee', shirtHex: '#b7410e', pant: 'Navy Joggers', pantHex: '#1b2838', shoes: 'White Sneakers', occasion: 'Casual', tip: 'Warm rust tones bring out the golden undertones' },
      { shirt: 'Ivory Kurta', shirtHex: '#fffff0', pant: 'Navy Churidar', pantHex: '#1b2838', shoes: 'Kolhapuri', occasion: 'Festive', tip: 'Ivory on  olive skin creates an elegant contrast' },
      { shirt: 'Wine Henley', shirtHex: '#722f37', pant: 'Grey Slim Fit', pantHex: '#808080', shoes: 'Dark Brown Boots', occasion: 'Party', tip: 'Wine shades complement olive undertones beautifully' },
    ],
    brown:   [
      { shirt: 'Bright White Tee', shirtHex: '#ffffff', pant: 'Black Jeans', pantHex: '#1a1a1a', shoes: 'White Sneakers', occasion: 'Casual', tip: 'High contrast white + black is unbeatable on dark skin' },
      { shirt: 'Golden Yellow Polo', shirtHex: '#ffd700', pant: 'Navy Chinos', pantHex: '#1b2838', shoes: 'Brown Loafers', occasion: 'Weekend', tip: 'Bright yellows pop beautifully against brown skin' },
      { shirt: 'Hot Pink Shirt', shirtHex: '#ff69b4', pant: 'Dark Denim', pantHex: '#2b3a67', shoes: 'White Canvas', occasion: 'Party', tip: 'Bold colors are your superpower — do not hold back' },
      { shirt: 'Powder Blue Kurta', shirtHex: '#b0c4de', pant: 'White Pyjama', pantHex: '#faf0e6', shoes: 'Mojari', occasion: 'Festive', tip: 'Light blue on brown skin = regal elegance' },
      { shirt: 'Electric Purple Tee', shirtHex: '#BF40BF', pant: 'Black Cargo', pantHex: '#1a1a1a', shoes: 'Black Sneakers', occasion: 'Streetwear', tip: 'Purple makes dark skin absolutely shine' },
    ],
    dark:    [
      { shirt: 'Crisp White Shirt', shirtHex: '#ffffff', pant: 'Charcoal Trousers', pantHex: '#36454f', shoes: 'Brown Oxford', occasion: 'Office', tip: 'White is THE power color for dark skin — maximum contrast' },
      { shirt: 'Lemon Yellow Tee', shirtHex: '#fff44f', pant: 'Navy Joggers', pantHex: '#1b2838', shoes: 'White Sneakers', occasion: 'Casual', tip: 'Bright yellows create showstopping vibrancy' },
      { shirt: 'Coral Polo', shirtHex: '#ff6f61', pant: 'Light Beige', pantHex: '#d2b48c', shoes: 'Tan Loafers', occasion: 'Date', tip: 'Coral + dark skin is a red carpet combination' },
      { shirt: 'Royal Gold Sherwani', shirtHex: '#c5a35c', pant: 'Ivory Churidar', pantHex: '#fffff0', shoes: 'Nagra', occasion: 'Wedding', tip: 'Gold on dark skin = absolute royalty' },
      { shirt: 'Sky Blue Oversized', shirtHex: '#87ceeb', pant: 'Black Slim', pantHex: '#1a1a1a', shoes: 'White High-tops', occasion: 'Streetwear', tip: 'Light blues create an effortlessly cool contrast' },
    ],
  },
  female: {
    fair:    [
      { shirt: 'Dusty Rose Coord Set', shirtHex: '#c4767a', pant: 'Matching Bottoms', pantHex: '#c4767a', shoes: 'Nude Heels', occasion: 'Brunch', tip: 'Dusty rose against fair skin = romantic elegance' },
      { shirt: 'Sage Green Kurti', shirtHex: '#8b9a6b', pant: 'White Palazzo', pantHex: '#faf0e6', shoes: 'Kolhapuri', occasion: 'Casual', tip: 'Sage green creates a fresh, natural harmony' },
      { shirt: 'Lavender Maxi Dress', shirtHex: '#b4a7d6', pant: '', pantHex: '', shoes: 'Silver Sandals', occasion: 'Date', tip: 'Lavender is made for fair skin — pure elegance' },
      { shirt: 'Navy Blue Saree', shirtHex: '#1e3a5f', pant: 'Gold Border', pantHex: '#c5a35c', shoes: 'Gold Heels', occasion: 'Wedding', tip: 'Navy silk with gold work is timelessly elegant' },
      { shirt: 'Blush Pink Top', shirtHex: '#ffb6c1', pant: 'Light Wash Jeans', pantHex: '#a8c5dd', shoes: 'White Sneakers', occasion: 'College', tip: 'Blush + light denim = casual pretty' },
    ],
    medium:  [
      { shirt: 'Teal Anarkali', shirtHex: '#008080', pant: 'Gold Dupatta', pantHex: '#c5a35c', shoes: 'Gold Juttis', occasion: 'Festive', tip: 'Teal + gold is a stunning festive combination' },
      { shirt: 'Rust Coord Set', shirtHex: '#b7410e', pant: 'Matching Bottoms', pantHex: '#b7410e', shoes: 'Tan Heels', occasion: 'Brunch', tip: 'Rust tones amplify the warmth in medium skin' },
      { shirt: 'Royal Blue Saree', shirtHex: '#4169e1', pant: 'Contrast Blouse', pantHex: '#c5a35c', shoes: 'Gold Heels', occasion: 'Wedding', tip: 'Royal blue silk = show-stopping wedding elegance' },
      { shirt: 'Mustard Kurti', shirtHex: '#e8a317', pant: 'White Churidar', pantHex: '#faf0e6', shoes: 'White Kolhapuri', occasion: 'Office', tip: 'Mustard on medium skin is confident and stylish' },
      { shirt: 'Emerald Green Dress', shirtHex: '#046307', pant: '', pantHex: '', shoes: 'Black Heels', occasion: 'Date', tip: 'Emerald makes your skin absolutely glow' },
    ],
    brown:   [
      { shirt: 'Hot Pink Lehenga', shirtHex: '#ff69b4', pant: 'Gold Dupatta', pantHex: '#c5a35c', shoes: 'Gold Heels', occasion: 'Wedding', tip: 'Hot pink and gold is a power combination' },
      { shirt: 'White Cotton Kurti', shirtHex: '#ffffff', pant: 'Indigo Palazzo', pantHex: '#1e3a5f', shoes: 'Silver Juttis', occasion: 'Casual', tip: 'White creates a stunning contrast on brown skin' },
      { shirt: 'Yellow Maxi Dress', shirtHex: '#ffd700', pant: '', pantHex: '', shoes: 'Brown Sandals', occasion: 'Beach', tip: 'Bright yellow on brown skin = sunshine energy' },
      { shirt: 'Turquoise Saree', shirtHex: '#40e0d0', pant: 'Silver Blouse', pantHex: '#c0c0c0', shoes: 'Silver Heels', occasion: 'Festive', tip: 'Turquoise makes brown skin look radiant' },
      { shirt: 'Coral Coord Set', shirtHex: '#ff6f61', pant: 'Matching Bottoms', pantHex: '#ff6f61', shoes: 'Nude Heels', occasion: 'Brunch', tip: 'Coral is universally flattering on deeper skin tones' },
    ],
    dark:    [
      { shirt: 'Bright White Dress', shirtHex: '#ffffff', pant: '', pantHex: '', shoes: 'Gold Sandals', occasion: 'Date', tip: 'White on dark skin = pure elegance, maximum impact' },
      { shirt: 'Royal Purple Saree', shirtHex: '#7b2d92', pant: 'Gold Blouse', pantHex: '#c5a35c', shoes: 'Gold Heels', occasion: 'Wedding', tip: 'Purple + gold creates a royal, luxurious look' },
      { shirt: 'Fuchsia Kurti', shirtHex: '#ff00ff', pant: 'Gold Churidar', pantHex: '#c5a35c', shoes: 'Gold Juttis', occasion: 'Festive', tip: 'Bold fuchsia on dark skin is absolutely stunning' },
      { shirt: 'Electric Blue Top', shirtHex: '#0892d0', pant: 'White Jeans', pantHex: '#faf0e6', shoes: 'White Sneakers', occasion: 'College', tip: 'Electric blue + white is a fresh, vibrant combo' },
      { shirt: 'Sunshine Orange Dress', shirtHex: '#ffa500', pant: '', pantHex: '', shoes: 'Brown Sandals', occasion: 'Casual', tip: 'Orange on dark skin is warm, vibrant, and powerful' },
    ],
  },
};

const OCCASION_EMOJIS = {
  Casual: '😎', Date: '❤️', Office: '💼', Weekend: '🌴', Party: '🎉',
  Wedding: '💍', Festive: '🪔', Outdoor: '🏕️', Streetwear: '🔥',
  College: '🎓', Brunch: '☕', Beach: '🏖️', Formal: '👔',
};

function OOTDCard({ skinTone, gender, isDark }) {
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(null);

  // Get today's outfit
  const genderKey = gender === 'female' ? 'female' : 'male';
  const toneKey = skinTone?.toLowerCase() || 'medium';
  const pool = OUTFITS[genderKey]?.[toneKey] || OUTFITS[genderKey]?.medium || OUTFITS.male.medium;
  const idx = getDayIndex(pool.length);
  const outfit = pool[idx];

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) { showToast('Login to save'); return; }
    try {
      await saveWardrobeItem(uid, {
        skin_tone: toneKey,
        skin_hex: outfit.shirtHex,
        source: 'ootd',
        outfit_data: { shirt: outfit.shirt, pant: outfit.pant, shoes: outfit.shoes, occasion: outfit.occasion },
      });
      setSaved(true);
      showToast('✅ Saved to wardrobe!');
    } catch { showToast('❌ Could not save'); }
  };

  const handleShare = () => {
    const msg = `👔 My Outfit of the Day from StyleGuru AI!\n\n👕 ${outfit.shirt}\n👖 ${outfit.pant}\n👟 ${outfit.shoes}\n📅 ${outfit.occasion}\n\n💡 ${outfit.tip}\n\nGet yours free 👇\nhttps://www.styleguruai.in`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/20 border-purple-700/30' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'}`}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
            👔 OUTFIT OF THE DAY
          </p>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${isDark ? 'bg-pink-500/20 border-pink-500/30 text-pink-300' : 'bg-pink-100 border-pink-300 text-pink-700'}`}>
          {OCCASION_EMOJIS[outfit.occasion] || '✨'} {outfit.occasion}
        </span>
      </div>

      {/* Outfit visual */}
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Color blocks */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-14 h-12 rounded-xl border border-white/20 shadow-lg relative overflow-hidden"
            style={{ backgroundColor: outfit.shirtHex }}>
            <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)' }} />
            <span className="absolute inset-0 flex items-center justify-center text-sm">👕</span>
          </div>
          {outfit.pant && (
            <div className="w-11 h-14 rounded-xl border border-white/20 shadow-lg relative overflow-hidden"
              style={{ backgroundColor: outfit.pantHex }}>
              <span className="absolute inset-0 flex items-center justify-center text-sm">👖</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{outfit.shirt}</p>
          {outfit.pant && <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>+ {outfit.pant}</p>}
          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>👟 {outfit.shoes}</p>
          <p className={`text-[11px] mt-2 leading-relaxed italic ${isDark ? 'text-purple-300/70' : 'text-purple-600/70'}`}>
            💡 {outfit.tip}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button onClick={handleSave} disabled={saved}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${
            saved
              ? 'bg-green-500/20 border-green-500/30 text-green-400'
              : isDark ? 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-purple-500/40' : 'bg-white border-gray-200 text-gray-600 hover:border-purple-400'
          }`}>
          {saved ? '✅ Saved' : '👗 Save'}
        </button>
        <button onClick={handleShare}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${
            isDark ? 'bg-green-500/15 border-green-500/20 text-green-400 hover:bg-green-500/25' : 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
          }`}>
          📱 Share
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg border border-white/10">
          {toast}
        </div>
      )}
    </div>
  );
}

export default OOTDCard;
