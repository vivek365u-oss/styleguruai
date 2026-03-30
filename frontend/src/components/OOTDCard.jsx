// ============================================================
// StyleGuru — AI Outfit of the Day (OOTD)
// Combines: Gemini AI + Weather + Skin Tone + Style Tip
// ============================================================
import { useState, useEffect } from 'react';
import { auth, saveWardrobeItem, fetchAIOOTD } from '../api/styleApi';

// Static fallbacks per skin tone (used when API unavailable)
const FALLBACK_OUTFITS = {
  male: {
    fair:   { shirt: 'Navy Blue Polo', shirtHex: '#1e3a5f', pant: 'Beige Chinos', pantHex: '#d2b48c', shoes: 'White Sneakers', occasion: 'Casual', tip: 'Navy + beige is timeless for fair skin' },
    light:  { shirt: 'Teal Polo', shirtHex: '#008080', pant: 'Khaki Chinos', pantHex: '#c3b091', shoes: 'White Canvas', occasion: 'Casual', tip: 'Teal brings out the warm undertones beautifully' },
    medium: { shirt: 'Royal Blue Tee', shirtHex: '#4169e1', pant: 'Charcoal Slim', pantHex: '#36454f', shoes: 'White Sneakers', occasion: 'Casual', tip: 'Royal blue makes medium skin glow' },
    olive:  { shirt: 'Cobalt Blue Polo', shirtHex: '#0047ab', pant: 'Tan Chinos', pantHex: '#d2b48c', shoes: 'Brown Loafers', occasion: 'Office', tip: 'Cobalt creates a striking contrast with olive skin' },
    brown:  { shirt: 'Bright White Tee', shirtHex: '#ffffff', pant: 'Black Jeans', pantHex: '#1a1a1a', shoes: 'White Sneakers', occasion: 'Casual', tip: 'High contrast white is unbeatable on dark skin' },
    dark:   { shirt: 'Crisp White Shirt', shirtHex: '#ffffff', pant: 'Charcoal Trousers', pantHex: '#36454f', shoes: 'Brown Oxford', occasion: 'Office', tip: 'White is THE power color for dark skin' },
  },
  female: {
    fair:   { shirt: 'Dusty Rose Coord Set', shirtHex: '#c4767a', pant: 'Matching Bottoms', pantHex: '#c4767a', shoes: 'Nude Heels', occasion: 'Brunch', tip: 'Dusty rose against fair skin = romantic elegance' },
    medium: { shirt: 'Teal Anarkali', shirtHex: '#008080', pant: 'Gold Dupatta', pantHex: '#c5a35c', shoes: 'Gold Juttis', occasion: 'Festive', tip: 'Teal + gold is a stunning festive combination' },
    brown:  { shirt: 'Hot Pink Lehenga', shirtHex: '#ff69b4', pant: 'Gold Dupatta', pantHex: '#c5a35c', shoes: 'Gold Heels', occasion: 'Wedding', tip: 'Hot pink and gold is a power combination' },
    dark:   { shirt: 'Bright White Dress', shirtHex: '#ffffff', pant: '', pantHex: '', shoes: 'Gold Sandals', occasion: 'Date', tip: 'White on dark skin = pure elegance' },
  },
};

const OCCASION_EMOJIS = {
  Casual: '😎', Date: '❤️', Office: '💼', Weekend: '🌴', Party: '🎉',
  Wedding: '💍', Festive: '🪔', Outdoor: '🏕️', Streetwear: '🔥',
  College: '🎓', Brunch: '☕', Beach: '🏖️', Formal: '👔', 'Smart Casual': '✨',
};

function OOTDCard({ skinTone, gender, isDark }) {
  const [outfit, setOutfit] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(null);
  const [source, setSource] = useState('');

  const lastAnalysis = (() => { try { return JSON.parse(localStorage.getItem('sg_last_analysis') || 'null'); } catch { return null; } })();
  const st = skinTone || lastAnalysis?.skinTone || 'medium';
  const ut = lastAnalysis?.undertone || 'warm';
  const ssn = lastAnalysis?.season || 'autumn';
  const gndr = gender || lastAnalysis?.fullData?.gender || 'male';

  // Step 1: Fetch weather
  useEffect(() => {
    const cachedCity = localStorage.getItem('sg_weather_city') || sessionStorage.getItem('sg_ootd_city');
    if (!cachedCity) {
      // Try to get city from existing weather cache
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('sg_weather_')) {
          try {
            const w = JSON.parse(sessionStorage.getItem(key));
            if (w?.city && w?.temp !== undefined) {
              setWeather(w);
              return;
            }
          } catch {}
        }
      }
      setWeather(null);
      return;
    }
    const cachedWeather = sessionStorage.getItem(`sg_weather_${cachedCity}`);
    if (cachedWeather) {
      try { setWeather(JSON.parse(cachedWeather)); return; } catch {}
    }
    // Fetch fresh
    fetch(`https://wttr.in/${encodeURIComponent(cachedCity)}?format=j1`)
      .then(r => r.json())
      .then(data => {
        const current = data.current_condition?.[0];
        if (current) {
          const w = {
            temp: parseInt(current.temp_C),
            desc: current.weatherDesc?.[0]?.value || '',
            city: data.nearest_area?.[0]?.areaName?.[0]?.value || cachedCity,
          };
          setWeather(w);
          sessionStorage.setItem(`sg_weather_${cachedCity}`, JSON.stringify(w));
        }
      })
      .catch(() => setWeather(null));
  }, []);

  // Step 2: Fetch AI outfit (once weather is resolved or skipped)
  useEffect(() => {
    const cacheKey = `sg_ootd_${new Date().toLocaleDateString('en-IN')}_${st}_${gndr}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setOutfit(parsed.outfit);
        setSource(parsed.source);
        setLoading(false);
        return;
      } catch {}
    }

    // Small delay to let weather settle
    const timer = setTimeout(() => {
      const payload = {
        skin_tone: st,
        undertone: ut,
        season: ssn,
        gender: gndr,
      };
      if (weather) {
        payload.weather_temp = weather.temp;
        payload.weather_desc = weather.desc;
        payload.city = weather.city;
      }

      fetchAIOOTD(payload)
        .then(res => {
          const o = res.data.outfit;
          const s = res.data.source;
          setOutfit(o);
          setSource(s);
          localStorage.setItem(cacheKey, JSON.stringify({ outfit: o, source: s }));
        })
        .catch(() => {
          // Use static fallback
          const gKey = gndr === 'female' ? 'female' : 'male';
          const tKey = st?.toLowerCase() || 'medium';
          const fb = FALLBACK_OUTFITS[gKey]?.[tKey] || FALLBACK_OUTFITS[gKey]?.medium || FALLBACK_OUTFITS.male.medium;
          setOutfit(fb);
          setSource('local');
        })
        .finally(() => setLoading(false));
    }, 800);

    return () => clearTimeout(timer);
  }, [weather, st, gndr]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) { showToast('Login to save'); return; }
    try {
      await saveWardrobeItem(uid, {
        skin_tone: st,
        skin_hex: outfit.shirtHex,
        source: 'ootd',
        outfit_data: { shirt: outfit.shirt, pant: outfit.pant, shoes: outfit.shoes, occasion: outfit.occasion },
      });
      setSaved(true);
      showToast('✅ Saved to wardrobe!');
    } catch { showToast('❌ Could not save'); }
  };

  const handleShare = () => {
    const weatherLine = weather ? `🌤️ Weather: ${weather.temp}°C, ${weather.desc} in ${weather.city}\n` : '';
    const msg = `👔 My AI Outfit of the Day from StyleGuru AI!\n\n${weatherLine}👕 ${outfit.shirt}\n👖 ${outfit.pant}\n👟 ${outfit.shoes}\n📅 ${outfit.occasion}\n\n💡 ${outfit.tip}\n\nGet yours free 👇\nhttps://www.styleguruai.in`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Loading state
  if (loading) {
    return (
      <div className={`rounded-2xl border p-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="animate-pulse space-y-3">
          <div className={`h-3 rounded-full w-40 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
          <div className="flex gap-3">
            <div className={`w-14 h-20 rounded-xl ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
            <div className="flex-1 space-y-2">
              <div className={`h-3 rounded-full w-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
              <div className={`h-3 rounded-full w-3/4 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
              <div className={`h-3 rounded-full w-1/2 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!outfit) return null;

  const occasionEmoji = OCCASION_EMOJIS[outfit.occasion] || '✨';

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/20 border-purple-700/30' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'}`}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
            {source === 'gemini' ? '🤖 AI' : '👔'} OUTFIT OF THE DAY
          </p>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            {weather ? ` • ${weather.temp}°C ${weather.desc}` : ''}
          </p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${isDark ? 'bg-pink-500/20 border-pink-500/30 text-pink-300' : 'bg-pink-100 border-pink-300 text-pink-700'}`}>
          {occasionEmoji} {outfit.occasion}
        </span>
      </div>

      {/* Weather context badge */}
      {weather && (
        <div className="px-4 pb-1">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${isDark ? 'bg-sky-500/15 text-sky-300 border border-sky-500/20' : 'bg-sky-50 text-sky-700 border border-sky-200'}`}>
            🌤️ Weather-matched for {weather.city}
          </div>
        </div>
      )}

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

      {/* Source badge */}
      {source === 'gemini' && (
        <div className="px-4 pb-1">
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
            ✨ Powered by Gemini AI
          </span>
        </div>
      )}

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
