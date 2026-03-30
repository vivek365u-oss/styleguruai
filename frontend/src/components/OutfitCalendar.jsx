import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

function OutfitCalendar({ bestColors, pantColors, gender, isDark, onClose }) {
  const { t, language } = useLanguage();
  const [selectedDay, setSelectedDay] = useState(0);

  const WEEKDAYS = [
    { key: 'monday', label: t('monday') },
    { key: 'tuesday', label: t('tuesday') },
    { key: 'wednesday', label: t('wednesday') },
    { key: 'thursday', label: t('thursday') },
    { key: 'friday', label: t('friday') },
    { key: 'saturday', label: t('saturday') },
    { key: 'sunday', label: t('sunday') }
  ];

  const OCCASIONS = [
    { day: 'Mon', label: t('officeFormal'), icon: '💼', weather: t('sunny') },
    { day: 'Tue', label: t('casualTech'), icon: '💻', weather: t('chilly') },
    { day: 'Wed', label: t('midWeekBrunch'), icon: '☕', weather: t('warm') },
    { day: 'Thu', label: t('clientMeeting'), icon: '🤝', weather: t('cloudy') },
    { day: 'Fri', label: t('partyNight'), icon: '🕺', weather: t('breezy') },
    { day: 'Sat', label: t('weekendTrip'), icon: '🚗', weather: t('sunny') },
    { day: 'Sun', label: t('dateDine'), icon: '🍝', weather: t('pleasant') }
  ];

  // Simple deterministic outfit generator
  const getOutfitForDay = (index) => {
    const top = bestColors[index % bestColors.length] || { name: t('premiumTop'), hex: '#FFFFFF' };
    const bottom = pantColors[(index + 2) % pantColors.length] || { name: t('recommendedPant'), hex: '#1e3a8a' };
    const occasion = OCCASIONS[index];
    
    return { top, bottom, occasion };
  };

  const currentOutfit = getOutfitForDay(selectedDay);

  return (
    <div className={`flex flex-col h-full animate-fade-in ${isDark ? 'text-white' : 'text-gray-900'}`}>
      <div className="flex items-center justify-between mb-6">
        <button onClick={onClose} className="text-sm font-bold opacity-60 hover:opacity-100 flex items-center gap-2">
          ← {t('back')}
        </button>
        <div className="text-right">
          <h2 className="text-xl font-black uppercase tracking-tight">{t('aiCalendar')}</h2>
          <p className="text-[10px] opacity-60 uppercase font-black tracking-widest leading-none">{t('smartWeeklyDrops')}</p>
        </div>
      </div>

      {/* Horizontal Day Picker */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 mb-6">
        {WEEKDAYS.map((day, i) => (
          <button
            key={day.key}
            onClick={() => setSelectedDay(i)}
            className={`flex flex-col items-center justify-center min-w-[70px] py-4 rounded-2xl border transition-all ${
              selectedDay === i 
                ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white border-transparent shadow-lg scale-105' 
                : isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-gray-100 border-gray-200 text-gray-400'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest">{day.label.slice(0, 3)}</span>
            <span className="text-xl mt-1">{OCCASIONS[i].icon}</span>
          </button>
        ))}
      </div>

      {/* Outfit Card */}
      <div className={`flex-1 rounded-[32px] p-6 border relative overflow-hidden flex flex-col items-center justify-center text-center ${
        isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/20 blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 mb-4">
           <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-40 mb-2 block italic">
             {OCCASIONS[selectedDay].label} · {OCCASIONS[selectedDay].weather}
           </span>
           <h3 className="text-2xl font-black mb-6">{WEEKDAYS[selectedDay].label}{t('dropSuffix')}</h3>
        </div>

        {/* Visual Composition */}
        <div className="flex flex-col items-center gap-10 w-full max-w-[240px]">
          {/* Top */}
          <div className="w-full flex flex-col items-center group">
            <div 
              className="w-16 h-16 rounded-2xl border-4 border-white/20 shadow-xl transition-transform group-hover:scale-110" 
              style={{ backgroundColor: currentOutfit.top.hex }}
            />
            <span className="mt-3 font-black text-sm uppercase tracking-wider">{currentOutfit.top.name}</span>
            <span className="text-[10px] opacity-50 uppercase font-bold tracking-widest">Premium Top</span>
          </div>

          <div className="w-6 h-0.5 bg-current opacity-10 rounded-full" />

          {/* Bottom */}
          <div className="w-full flex flex-col items-center group">
            <div 
              className="w-16 h-16 rounded-2xl border-4 border-white/20 shadow-xl transition-transform group-hover:scale-110" 
              style={{ backgroundColor: currentOutfit.bottom.hex }}
            />
            <span className="mt-3 font-black text-sm uppercase tracking-wider">{currentOutfit.bottom.name}</span>
            <span className="text-[10px] opacity-50 uppercase font-bold tracking-widest">Recommended Pant</span>
          </div>
        </div>

        <button 
          onClick={() => {
            const query = `${currentOutfit.top.name} ${currentOutfit.bottom.name}`.replace(/\s+/g, '%20');
            window.open(`https://www.myntra.com/search?rawQuery=${query}`, '_blank');
          }}
          className="mt-10 px-8 py-3 bg-white/5 border border-white/10 rounded-full text-xs font-bold hover:bg-white/10 transition"
        >
          🛒 {t('findOnMarket')}
        </button>
      </div>

      <p className="mt-4 text-[10px] text-center opacity-40 font-medium italic">
        "{t('smartLogicNote')}"
      </p>
    </div>
  );
}

export default OutfitCalendar;
