// ============================================================
// StyleGuru — Weather-Based Style Tip
// Uses wttr.in (no API key needed) for weather data
// ============================================================
import { useState, useEffect } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { getLocalizedWeatherTip } from '../data/weatherTips';

function getWeatherCategory(tempC, weatherCode) {
  // Check if rainy first (wttr.in weather codes)
  const rainyConditions = ['rain', 'drizzle', 'thunder', 'shower', 'overcast'];
  if (weatherCode && rainyConditions.some(r => weatherCode.toLowerCase().includes(r))) return 'rainy';
  if (tempC >= 35) return 'hot';
  if (tempC >= 25) return 'warm';
  if (tempC >= 15) return 'cool';
  return 'cold';
}

function WeatherTip({ city, isDark }) {
  const { language, t } = useLanguage();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userCity, setUserCity] = useState(city || '');
  const [editMode, setEditMode] = useState(!city);

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

  const localWeatherTip = tip?.tip || '';

  if (editMode || !userCity) {
    return (
      <div className={`rounded-2xl p-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
        <p className={`text-xs font-bold mb-2 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>🌤️ {t('weatherStyleTip')}</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t('enterCity')}
            value={userCity}
            onChange={e => setUserCity(e.target.value)}
            className={`flex-1 px-3 py-2 rounded-xl text-xs border ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'}`}
          />
          <button
            onClick={() => { if (userCity.trim()) { setEditMode(false); fetchWeather(userCity.trim()); } }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-500 transition-all"
          >{t('set')}</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`rounded-2xl p-4 border animate-pulse ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
        <div className={`h-3 rounded-full w-32 mb-2 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}/>
        <div className={`h-3 rounded-full w-48 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}/>
      </div>
    );
  }

  if (!weather || !tip) return null;

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gradient-to-r from-sky-900/20 to-blue-900/20 border-sky-700/30' : 'bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200'}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{tip.emoji}</span>
            <div>
              <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {weather.temp}°C • {tip.label}
              </p>
              <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                📍 {weather.city} • {weather.desc}
              </p>
            </div>
          </div>
          <button onClick={() => setEditMode(true)}
            className={`text-[10px] px-2 py-1 rounded-lg border ${isDark ? 'border-white/10 text-white/40' : 'border-gray-200 text-gray-400'}`}>
            ✏️
          </button>
        </div>

        <div className={`rounded-xl p-3 border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white/60 border-white/40'}`}>
          <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>👔 {t('expertWeatherTip')}</p>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-white/70' : 'text-gray-700'}`}>{localWeatherTip}</p>
        </div>

        <p className={`text-[10px] mt-2 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
          🧵 {t('bestFabricsToday')} {tip.fabrics}
        </p>
      </div>
    </div>
  );
}

export default WeatherTip;
