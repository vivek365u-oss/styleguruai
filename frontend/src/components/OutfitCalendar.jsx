import { useState, useEffect } from 'react';
import { scoreWardrobeItem, getAccessoryAdvice, generateStylerBrief } from '../utils/stylingEngine';
import { useLanguage } from '../i18n/LanguageContext';
import { auth, getDailyOutfitLogs, loadUserPreferences, loadStyleInsights } from '../api/styleApi';

function OutfitCalendar({ bestColors, pantColors, isDark, onClose, wardrobe, profile }) {
  const { t } = useLanguage();
  const [selectedDay, setSelectedDay] = useState(0);
  const [logs, setLogs] = useState([]);
  const [lifestyle, setLifestyle] = useState('other');
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState('mood_comfort');
  const [lockedDNA, setLockedDNA] = useState(null);
  
  // Custom Event Overrides for the week
  const [eventOverrides, setEventOverrides] = useState({});

  useEffect(() => {
    const loadContext = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) { setLoading(false); return; }
      
      try {
        const [userLogs, prefs, dna] = await Promise.all([
          getDailyOutfitLogs(uid, 14),
          loadUserPreferences(uid),
          loadStyleInsights(uid)
        ]);
        setLogs(userLogs);
        if (prefs?.lifestyle) setLifestyle(prefs.lifestyle);
        if (dna) setLockedDNA(dna);
      } catch (e) {
        console.error('Failed to load calendar context:', e);
      } finally {
        setLoading(false);
      }
    };
    loadContext();
  }, []);

  const WEEKDAYS = [
    { key: 'monday', label: t('monday') },
    { key: 'tuesday', label: t('tuesday') },
    { key: 'wednesday', label: t('wednesday') },
    { key: 'thursday', label: t('thursday') },
    { key: 'friday', label: t('friday') },
    { key: 'saturday', label: t('saturday') },
    { key: 'sunday', label: t('sunday') }
  ];

  const EVENT_TYPES = [
    { id: 'OFFICE', label: 'Office/Business', icon: '💼' },
    { id: 'PARTY', label: 'Party/Event', icon: '🕺' },
    { id: 'CAMPUS', label: 'Campus/Study', icon: '🎓' },
    { id: 'WEEKEND', label: 'Casual/Weekend', icon: '🍿' }
  ];

  const getOccasions = () => {
     // Default occasions based on lifestyle, overridden by user choice
     const baseMapping = lifestyle === 'student' ? ['CAMPUS','CAMPUS','CAMPUS','WEEKEND','PARTY','WEEKEND','PARTY'] : 
                         lifestyle === 'pro' ? ['OFFICE','OFFICE','OFFICE','PARTY','OFFICE','WEEKEND','WEEKEND'] : 
                         ['OFFICE','OFFICE','WEEKEND','OFFICE','PARTY','WEEKEND','PARTY'];
                         
     return WEEKDAYS.map((day, i) => {
        const typeId = eventOverrides[i] || baseMapping[i];
        const type = EVENT_TYPES.find(e => e.id === typeId);
        return {
            ...day,
            event: typeId,
            icon: type.icon,
            label: type.label,
            weather: ['sunny', 'cloudy', 'rainy', 'warm', 'pleasant', 'chilly', 'sunny'][i]
        };
     });
  };

  const OCCASIONS = getOccasions();

  // English day names used for log matching regardless of display language
  const DAY_KEYS_EN = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

  const getLogForDay = (weekdayIndex) => {
    const dayKeyEn = DAY_KEYS_EN[weekdayIndex];
    return logs.find(log => {
      const logDate = new Date(log.date);
      return logDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === dayKeyEn;
    });
  };

  const getOutfitForDay = (index) => {
    const log = getLogForDay(index);
    const occasion = OCCASIONS[index];
    const context = { weather: occasion.weather, event: occasion.event, mood };
    const activeGender = lockedDNA?.gender || profile?.gender || profile?.gender_mode || 'female';
    const userProfile = { ...profile, gender: activeGender };

    if (log) {
        return {
            top: { name: log.top, type: 'executed' },
            bottom: { name: log.bottom, type: 'executed' },
            occasion,
            isExecuted: true,
            brief: "You wore this look! History saved in the cloud.",
            accessories: getAccessoryAdvice(activeGender, userProfile.season, occasion.event)
        };
    }

    // Use Engine to find best items
    const rankedWardrobe = wardrobe
        ?.map(item => ({
            ...item,
            engineScore: scoreWardrobeItem(item, context, userProfile, logs.map(l => ({ itemId: l.id, date: l.date })), lockedDNA)
        }))
        .filter(i => i.engineScore > 0) // Strict Gender Wall applied here
        .sort((a, b) => b.engineScore - a.engineScore) || [];

    // Gender-Strict Categories
    const topCats = activeGender === 'male' 
        ? ['shirts', 'tshirts', 'cat_formal_shirt', 'cat_kurta_set', 'cat_sherwani']
        : ['tops', 'kurti', 'cat_kurti', 'cat_saree_silk', 'cat_dress_mini', 'cat_dress_maxi'];

    const bottomCats = activeGender === 'male'
        ? ['pants', 'cat_formal_trouser', 'cat_jeans', 'cat_cargo']
        : ['pants', 'bottoms', 'cat_palazzo', 'cat_mom_jeans'];

    const bestTop = rankedWardrobe.find(i => topCats.includes(i.category)) || 
                    { 
                        name: activeGender === 'male' ? 'Premium Shirt' : 'Elegant Kurti', 
                        hex: bestColors.length > 0 ? bestColors[index % bestColors.length]?.hex : '#7C3AED', 
                        engineScore: 85,
                        category: activeGender === 'male' ? 'cat_formal_shirt' : 'cat_kurti'
                    };
                    
    const bestBottom = rankedWardrobe.find(i => bottomCats.includes(i.category) && i.id !== bestTop.id) || 
                       { 
                           name: activeGender === 'male' ? 'Formal Trousers' : 'Silk Palazzo', 
                           hex: pantColors.length > 0 ? pantColors[index % pantColors.length]?.hex : '#1e3a8a', 
                           engineScore: 80,
                           category: activeGender === 'male' ? 'cat_formal_trouser' : 'cat_palazzo'
                       };

    const accessorizing = getAccessoryAdvice(activeGender, userProfile.season, occasion.event);
    const stylingBrief = generateStylerBrief(bestTop, bestBottom, context, userProfile);

    return { 
      top: bestTop, 
      bottom: bestBottom, 
      occasion,
      engineScore: Math.round(((bestTop.engineScore || 70) + (bestBottom.engineScore || 70)) / 2),
      isFromWardrobe: !!(bestTop.id || bestBottom.id),
      isExecuted: false,
      accessories: accessorizing,
      brief: stylingBrief
    };
  };

  const dayInfo = getOutfitForDay(selectedDay);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className={`flex flex-col h-full animate-fade-in ${isDark ? 'text-white' : 'text-gray-900'}`}>
      {/* HEADER & NAV */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg hover:scale-110 transition-all">←</button>
        <div className="text-right">
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
             <span className="text-purple-500">AI</span> COMMAND CENTER
          </h2>
          <p className="text-[9px] opacity-40 uppercase font-black tracking-widest leading-none">Style Ecosystem v2.0</p>
        </div>
      </div>

      {/* WEEKLY TIMELINE */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 mb-6 pt-1">
        {WEEKDAYS.map((day, i) => {
          const hasLog = !!getLogForDay(i);
          return (
            <button
                key={day.key}
                onClick={() => setSelectedDay(i)}
                className={`flex flex-col items-center justify-center min-w-[70px] py-4 rounded-2xl border transition-all relative ${
                selectedDay === i 
                    ? 'bg-gradient-to-br from-purple-600/90 to-pink-600/90 text-white border-transparent shadow-xl scale-110 z-10' 
                    : isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-gray-100 border-gray-200 text-gray-400'
                }`}
            >
                {hasLog && (
                    <span className="absolute -top-1 -right-1 bg-green-500 w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white border-2 border-white shadow-lg">✓</span>
                )}
                <span className="text-[10px] font-black uppercase tracking-widest">{day.label.slice(0, 3)}</span>
                <span className="text-xl mt-1">{OCCASIONS[i].icon}</span>
            </button>
          );
        })}
      </div>

      {/* EVENT COMMANDER */}
      <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Command Context</p>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${isDark ? 'bg-white/10 text-white/60' : 'bg-slate-100 text-slate-500'}`}>
                  {OCCASIONS[selectedDay].weather.toUpperCase()} WEATHER 🛰️
              </span>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {EVENT_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setEventOverrides({...eventOverrides, [selectedDay]: type.id})}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl border text-[10px] font-bold flex items-center gap-2 transition-all ${
                        OCCASIONS[selectedDay].event === type.id
                            ? 'bg-purple-600 border-transparent text-white shadow-lg'
                            : isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-white border-gray-200 text-slate-500'
                    }`}
                  >
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                  </button>
              ))}
          </div>
      </div>

      {/* MAIN STYLE BRIEF CARD */}
      <div className={`flex-1 rounded-[2.5rem] p-8 border relative overflow-hidden transition-all duration-500 ${
        dayInfo.isExecuted 
            ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30'
            : isDark ? 'bg-white/5 border-white/10 shadow-2xl' : 'bg-white border-gray-200 shadow-xl'
      }`}>
        <div className={`absolute -top-10 -right-10 w-48 h-48 blur-[100px] pointer-events-none opacity-50 ${
            dayInfo.isExecuted ? 'bg-green-500' : 'bg-purple-500'
        }`} />

        <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-start justify-between mb-8">
                <div className="text-left">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{WEEKDAYS[selectedDay].label}</p>
                     <h3 className="text-2xl font-black">{OCCASIONS[selectedDay].label}</h3>
                </div>
                <div className={`flex flex-col items-end px-5 py-3 rounded-2xl border backdrop-blur-md ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}>
                    <p className="text-[8px] font-black opacity-30 uppercase">DNA Synergy</p>
                    <p className={`text-xl font-black ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{dayInfo.engineScore}%</p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-10 items-center">
                 {/* VISUALS */}
                 <div className="space-y-8">
                      <div className="flex flex-col items-center group">
                           <div className="w-16 h-16 rounded-2xl shadow-xl transition-all duration-500 group-hover:scale-110 border-4 border-white/10" style={{ backgroundColor: dayInfo.top.hex }} />
                           <p className="mt-3 text-[10px] font-black uppercase opacity-60 truncate w-full text-center">{dayInfo.top.name}</p>
                      </div>
                      <div className="flex flex-col items-center group">
                           <div className="w-16 h-16 rounded-2xl shadow-xl transition-all duration-500 group-hover:scale-110 border-4 border-white/10" style={{ backgroundColor: dayInfo.bottom.hex }} />
                           <p className="mt-3 text-[10px] font-black uppercase opacity-60 truncate w-full text-center">{dayInfo.bottom.name}</p>
                      </div>
                 </div>

                 {/* ACCESSORIES & BREIF */}
                 <div className="text-left space-y-6">
                      <div className={`p-4 rounded-2xl border border-dashed ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                           <p className="text-[8px] font-black opacity-30 uppercase mb-3">Finishing Touches</p>
                           <div className="space-y-3">
                                <div className="flex gap-2 items-center">
                                     <span className="text-lg">💎</span>
                                     <p className="text-[10px] font-bold leading-tight">{dayInfo.accessories.jewelry}</p>
                                </div>
                                <div className="flex gap-2 items-center">
                                     <span className="text-lg">👟</span>
                                     <p className="text-[10px] font-bold leading-tight">{dayInfo.accessories.shoes}</p>
                                </div>
                           </div>
                      </div>

                      <div className="space-y-2">
                           <p className="text-[8px] font-black opacity-30 uppercase">AI Styler's Brief</p>
                           <p className={`text-[10px] font-medium leading-relaxed italic ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                                "{dayInfo.brief}"
                           </p>
                      </div>
                 </div>
            </div>

            {!dayInfo.isExecuted ? (
                <button 
                  onClick={() => {
                    const itemName = encodeURIComponent(dayInfo.top.name || 'shirt');
                    const itemCat  = encodeURIComponent(dayInfo.top.category || '');
                    window.open(`https://www.myntra.com/search?q=${itemName}${itemCat ? '%20' + itemCat : ''}`, '_blank');
                  }}
                  className="mt-8 w-full py-5 bg-black text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                >
                    🛒 Unlock via Myntra
                </button>
            ) : (
                <div className="mt-8 w-full py-5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-3xl text-[10px] font-black uppercase text-center tracking-widest">
                    🏆 OUTFIT MISSION COMPLETE
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default OutfitCalendar;
