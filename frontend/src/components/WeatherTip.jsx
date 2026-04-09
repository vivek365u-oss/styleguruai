// ============================================================
// StyleGuru — Weather-Based Style Tip
// Uses wttr.in (no API key needed) for weather data
// ============================================================
import { useState, useEffect } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { getLocalizedWeatherTip } from '../data/weatherTips';
import { getLocalizedOOTD } from '../data/ootdOutfits';
import { auth, saveWardrobeItem } from '../api/styleApi';

const glass = {
  container: "backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl",
  header: "backdrop-blur-md bg-black/40 border-b border-white/10",
  card: "backdrop-blur-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all",
};

function getWeatherCategory(tempC, weatherCode) {
  // Check if rainy first (wttr.in weather codes)
  const rainyConditions = ['rain', 'drizzle', 'thunder', 'shower', 'overcast'];
  if (weatherCode && rainyConditions.some(r => weatherCode.toLowerCase().includes(r))) return 'rainy';
  if (tempC >= 35) return 'hot';
  if (tempC >= 25) return 'warm';
  if (tempC >= 15) return 'cool';
  return 'cold';
}

function WeatherTip({ city, isDark, profile, genderPref }) {
  const { language, t } = useLanguage();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userCity, setUserCity] = useState(city || '');
  const [editMode, setEditMode] = useState(!city);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!userCity) { setLoading(false); return; }
    const cached = sessionStorage.getItem(`sg_weather_${userCity}`);
    if (cached) {
      try { setWeather(JSON.parse(cached)); setLoading(false); return; } catch { /* ignore parsing errors */ }
    }
    fetchWeather(userCity);
  }, [userCity]);

  const fetchWeather = async (c) => {
    setLoading(true);
    try {
      const res = await fetch(`https://wttr.in/${encodeURIComponent(c)}?format=j1`);
      if (!res.ok) throw new Error('City not found');
      const data = await res.json();
      const current = data.current_condition?.[0];
      if (!current) throw new Error('No data');

      const w = {
        temp: parseInt(current.temp_C),
        humidity: parseInt(current.humidity),
        desc: current.weatherDesc?.[0]?.value || '',
        city: data.nearest_area?.[0]?.areaName?.[0]?.value || c,
      };
      w.category = getWeatherCategory(w.temp, w.desc);
      setWeather(w);
      sessionStorage.setItem(`sg_weather_${c}`, JSON.stringify(w));
    } catch {
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const tip = weather ? (() => {
    const lastAnalysis = (() => { try { return JSON.parse(localStorage.getItem('sg_last_analysis') || 'null'); } catch { return null; } })();
    const tone = (typeof lastAnalysis?.skinTone === 'string' ? lastAnalysis?.skinTone : lastAnalysis?.skinTone?.category || 'medium')?.toLowerCase();
    return getLocalizedWeatherTip(weather.category, tone, language);
  })() : null;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleSaveOOTD = async (outfit, tone) => {
    const uid = auth.currentUser?.uid;
    if (!uid) { showToast(t('Login to save')); return; }
    try {
      await saveWardrobeItem(uid, {
        skin_tone: tone,
        skin_hex: outfit.shirtHex,
        source: 'daily_briefing',
        outfit_data: { shirt: outfit.shirt, pant: outfit.pant, shoes: outfit.shoes, occasion: outfit.occasion },
      });
      setSaved(true);
      showToast(t('✅ Saved to wardrobe!'));
    } catch { showToast(t('❌ Could not save')); }
  };

  const ootd = weather ? (() => {
    const tone = (typeof profile?.skinTone === 'string' ? profile?.skinTone : profile?.skinTone?.category || 'medium')?.toLowerCase();
    const gndr = profile?.fullData?.gender || profile?.gender || genderPref;
    return {
       data: getLocalizedOOTD(gndr, tone, language, 0, weather.category),
       tone
    };
  })() : null;

  if (editMode || !userCity) {
    return (
      <div className={`rounded-3xl p-6 border transition-all ${isDark ? glass.card : 'bg-white border-purple-100 shadow-xl'}`}>
        <p className={`text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
           <span className="text-xl">🌤️</span> {t('weatherStyleBriefing')}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t('enterCity')}
            value={userCity}
            onChange={e => setUserCity(e.target.value)}
            className={`flex-1 px-4 py-3 rounded-2xl text-sm border focus:ring-2 focus:ring-purple-500 transition-all outline-none ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'}`}
          />
          <button
            onClick={() => { if (userCity.trim()) { setEditMode(false); fetchWeather(userCity.trim()); } }}
            className="px-6 py-3 rounded-2xl text-sm font-black bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg active:scale-95 transition-all"
          >{t('set')}</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`rounded-3xl p-6 border animate-pulse ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
        <div className="h-4 bg-white/10 rounded-full w-32 mb-4"/>
        <div className="space-y-3">
           <div className="h-20 bg-white/5 rounded-2xl w-full"/>
           <div className="h-10 bg-white/5 rounded-xl w-3/4"/>
        </div>
      </div>
    );
  }

  if (!weather || !tip || !ootd) return null;

  return (
    <div className={`rounded-[2.5rem] border overflow-hidden p-6 relative transition-all duration-700 ${isDark ? glass.container : 'bg-white border-purple-100 shadow-xl'}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] pointer-events-none" />
      
      <div className="relative z-10">
        {/* Weather Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-3xl shadow-inner">
                {tip.emoji}
             </div>
             <div>
                <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{weather.temp}°C</p>
                <div className="flex items-center gap-1.5 opacity-60">
                   <p className="text-[10px] font-bold uppercase tracking-widest leading-none">{weather.city}</p>
                   <span className="w-1 h-1 rounded-full bg-current opacity-30"/>
                   <p className="text-[10px] font-bold uppercase tracking-widest leading-none">{weather.desc}</p>
                </div>
             </div>
          </div>
          <button onClick={() => setEditMode(true)} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${isDark ? 'border-white/10 text-white/40 hover:bg-white/5' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}>✏️</button>
        </div>

        {/* The Briefing Suggestion */}
        <div className={`rounded-[2rem] p-5 border mb-6 ${isDark ? 'bg-white/5 border-white/10 shadow-inner' : 'bg-purple-50/50 border-purple-100'}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>🚀 Today's Smart Pick</p>
            
            <div className="flex items-center gap-4">
               {/* Outfit Visual */}
               <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <div className="w-14 h-11 rounded-xl border border-white/20 shadow-lg relative overflow-hidden" 
                       style={{ background: `linear-gradient(135deg, ${ootd.data.shirtHex}, ${ootd.data.shirtHex}dd)` }}>
                     <span className="absolute inset-0 flex items-center justify-center text-lg opacity-80 backdrop-blur-[1px]">👕</span>
                  </div>
                  {ootd.data.pantHex && (
                     <div className="w-10 h-12 rounded-xl border border-white/20 shadow-lg relative overflow-hidden ml-auto"
                          style={{ background: `linear-gradient(135deg, ${ootd.data.pantHex}, ${ootd.data.pantHex}dd)` }}>
                        <span className="absolute inset-0 flex items-center justify-center text-sm opacity-80">👖</span>
                     </div>
                  )}
               </div>

               <div className="flex-1">
                  <h4 className={`text-sm font-black mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>{ootd.data.shirt}</h4>
                  <p className={`text-xs opacity-60 mb-2 ${isDark ? 'text-white' : 'text-gray-600'}`}>+ {ootd.data.pant || ootd.data.shoes}</p>
                  <p className={`text-[11px] leading-relaxed italic ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                     “{ootd.data.tip}”
                  </p>
               </div>
            </div>

            <div className="mt-5 flex gap-2">
               <button onClick={() => handleSaveOOTD(ootd.data, ootd.tone)} disabled={saved}
                  className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${saved ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-purple-500'}`}>
                  {saved ? '✅ Saved!' : '👗 Save Look'}
               </button>
               <button onClick={() => window.open(`https://www.myntra.com/search?q=${ootd.data.shirt}`, '_blank')}
                  className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-black text-white shadow-xl active:scale-95 transition-all">
                  🛒 Shop Vibe
               </button>
            </div>
        </div>

        {/* Expert Persona Info */}
        <div className="flex items-start gap-3">
           <div className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center text-sm ${isDark ? 'bg-purple-900/40 border-purple-500/30' : 'bg-purple-100 border-purple-200'}`}>👗</div>
           <div>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-white/60' : 'text-gray-700'}`}>
                 <span className="font-black text-purple-400 uppercase mr-1">{t('expertNote')}:</span>
                 {localWeatherTip} {t('bestFabricsToday')} <b>{tip.fabrics}</b>
              </p>
           </div>
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-[10px] font-black px-4 py-2.5 rounded-full shadow-2xl border border-white/10 animate-fade-in uppercase tracking-widest">
          {toast}
        </div>
      )}
    </div>
  );
}

export default WeatherTip;
