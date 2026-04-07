import { scoreWardrobeItem } from '../utils/stylingEngine';

function OutfitCalendar({ bestColors, pantColors, isDark, onClose, wardrobe, profile }) {
  const { t } = useLanguage();
  const [selectedDay, setSelectedDay] = useState(0);
  const [logs, setLogs] = useState([]);
  const [lifestyle, setLifestyle] = useState('other');
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState('mood_comfort');

  useEffect(() => {
    const loadContext = async () => {
      if (!auth.currentUser) return;
      try {
        const [userLogs, prefs] = await Promise.all([
          getDailyOutfitLogs(auth.currentUser.uid, 14),
          loadUserPreferences(auth.currentUser.uid)
        ]);
        setLogs(userLogs);
        if (prefs?.lifestyle) setLifestyle(prefs.lifestyle);
      } catch (e) {
        console.error('Failed to load calendar context:', e);
      } finally {
        setLoading(false);
      }
    };
    loadContext();
    window.addEventListener('sg_calendar_updated', loadContext);
    return () => window.removeEventListener('sg_calendar_updated', loadContext);
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

  // Dynamic Occasions based on Lifestyle
  const getOccasions = () => {
     const base = lifestyle === 'student' ? [
        { day: 'Mon', label: 'Campus Lectures', icon: '🎓', event: 'CAMPUS', weather: 'hot' },
        { day: 'Tue', label: 'Lab Sessions', icon: '🔬', event: 'CAMPUS', weather: 'cold' },
        { day: 'Wed', label: 'Late Night Study', icon: '🦉', event: 'CAMPUS', weather: 'warm' },
        { day: 'Thu', label: 'Campus Canteen', icon: '🍔', event: 'WEEKEND', weather: 'cloudy' },
        { day: 'Fri', label: 'College Fest', icon: '🎸', event: 'PARTY', weather: 'hot' },
        { day: 'Sat', label: 'Weekend Chill', icon: '🍿', event: 'WEEKEND', weather: 'sunny' },
        { day: 'Sun', label: 'Date Prep', icon: '❤️', event: 'PARTY', weather: 'pleasant' }
     ] : lifestyle === 'pro' ? [
        { day: 'Mon', label: 'Board Meeting', icon: '💼', event: 'OFFICE', weather: 'sunny' },
        { day: 'Tue', label: 'Client Visit', icon: '🤝', event: 'OFFICE', weather: 'chilly' },
        { day: 'Wed', label: 'Deep Focus', icon: '🧠', event: 'OFFICE', weather: 'warm' },
        { day: 'Thu', label: 'Networking', icon: '🥂', event: 'PARTY', weather: 'cloudy' },
        { day: 'Fri', label: 'Desk Lunch', icon: '💻', event: 'WEEKEND', weather: 'breezy' },
        { day: 'Sat', label: 'Family Outing', icon: '🌳', event: 'WEEKEND', weather: 'sunny' },
        { day: 'Sun', label: 'Self Care', icon: '🫧', event: 'WEEKEND', weather: 'pleasant' }
     ] : [
        { day: 'Mon', label: t('officeFormal'), icon: '💼', event: 'OFFICE', weather: 'sunny' },
        { day: 'Tue', label: t('casualTech'), icon: '💻', event: 'OFFICE', weather: 'chilly' },
        { day: 'Wed', label: t('midWeekBrunch'), icon: '☕', event: 'WEEKEND', weather: 'warm' },
        { day: 'Thu', label: t('clientMeeting'), icon: '🤝', event: 'OFFICE', weather: 'cloudy' },
        { day: 'Fri', label: t('partyNight'), icon: '🕺', event: 'PARTY', weather: 'hot' },
        { day: 'Sat', label: t('weekendTrip'), icon: '🚗', event: 'WEEKEND', weather: 'sunny' },
        { day: 'Sun', label: t('dateDine'), icon: '🍝', event: 'PARTY', weather: 'pleasant' }
     ];
     return base;
  };

  const OCCASIONS = getOccasions();

  const getLogForDay = (weekdayIndex) => {
    const dayName = WEEKDAYS[weekdayIndex].label.toLowerCase();
    return logs.find(log => {
        const logDate = new Date(log.date);
        return logDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === dayName;
    });
  };

  const getOutfitForDay = (index) => {
    const log = getLogForDay(index);
    if (log) {
        return {
            top: { name: log.top, type: 'executed' },
            bottom: { name: log.bottom, type: 'executed' },
            occasion: OCCASIONS[index],
            isExecuted: true
        };
    }

    const occasion = OCCASIONS[index];
    const context = { weather: occasion.weather, event: occasion.event, mood };
    const userProfile = profile || { gender: lifestyle === 'student' ? 'male' : 'female' };

    // Use Engine to find best items
    const rankedWardrobe = wardrobe
        ?.map(item => ({
            ...item,
            engineScore: scoreWardrobeItem(item, context, userProfile, logs.map(l => ({ itemId: l.id, date: l.date })))
        }))
        .sort((a, b) => b.engineScore - a.engineScore) || [];

    const bestTop = rankedWardrobe.find(i => ['shirts', 'tshirts', 'tops', 'kurti'].includes(i.category)) || 
                    { name: t('premiumTop'), hex: bestColors[index % bestColors.length]?.hex || '#FFFFFF' };
                    
    const bestBottom = rankedWardrobe.find(i => ['pants', 'bottoms'].includes(i.category) && i.id !== bestTop.id) || 
                       { name: t('recommendedPant'), hex: pantColors[index % pantColors.length]?.hex || '#1e3a8a' };

    return { 
      top: bestTop, 
      bottom: bestBottom, 
      occasion,
      engineScore: Math.round(((bestTop.engineScore || 70) + (bestBottom.engineScore || 70)) / 2),
      isFromWardrobe: !!(bestTop.id || bestBottom.id),
      isExecuted: false
    };
  };

  const currentOutfit = getOutfitForDay(selectedDay);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className={`flex flex-col h-full animate-fade-in ${isDark ? 'text-white' : 'text-gray-900'}`}>
      <div className="flex items-center justify-between mb-6">
        <button onClick={onClose} className="text-sm font-bold opacity-60 hover:opacity-100 flex items-center gap-2">
          ← {t('back')}
        </button>
        <div className="text-right">
          <h2 className="text-xl font-black uppercase tracking-tight">{t('aiCalendar')}</h2>
          <p className="text-[10px] opacity-60 uppercase font-black tracking-widest leading-none">{lifestyle.toUpperCase()} LIFESTYLE</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 mb-6">
        {WEEKDAYS.map((day, i) => {
          const hasLog = !!getLogForDay(i);
          return (
            <button
                key={day.key}
                onClick={() => setSelectedDay(i)}
                className={`flex flex-col items-center justify-center min-w-[75px] py-4 rounded-2xl border transition-all relative ${
                selectedDay === i 
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white border-transparent shadow-lg scale-105' 
                    : isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-gray-100 border-gray-200 text-gray-400'
                }`}
            >
                {hasLog && (
                    <span className="absolute -top-1 -right-1 bg-green-500 w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white border-2 border-white shadow-lg">✓</span>
                )}
                <span className="text-[10px] font-bold uppercase tracking-widest">{day.label.slice(0, 3)}</span>
                <span className="text-xl mt-1">{OCCASIONS[i].icon}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-6 space-y-3">
         <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Styling Intent</p>
         <div className="grid grid-cols-4 gap-2">
            {['mood_comfort', 'mood_confidence', 'mood_minimal', 'mood_attention'].map(m => (
               <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`py-3 rounded-xl border text-[9px] font-black uppercase transition-all ${
                     mood === m 
                        ? 'bg-purple-600 border-transparent text-white shadow-lg' 
                        : isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-white border-gray-200 text-slate-400'
                  }`}
               >
                  {t(m)?.split(' ')[0]}
               </button>
            ))}
         </div>
      </div>

      <div className={`flex-1 rounded-[32px] p-7 border relative overflow-hidden flex flex-col items-center justify-center text-center transition-all ${
        currentOutfit.isExecuted 
            ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500/30'
            : isDark ? 'bg-white/5 border-white/10 shadow-2xl' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 blur-[80px] pointer-events-none ${
            currentOutfit.isExecuted ? 'bg-green-500/20' : 'bg-purple-500/20'
        }`} />
        
        <div className="relative z-10 mb-6">
           {currentOutfit.isExecuted ? (
               <div className="bg-green-500 text-white text-[9px] font-black px-3 py-1 rounded-full w-fit mx-auto mb-4">MISSION LOGGED 🏆</div>
           ) : (
               <div className={`text-[10px] font-black px-4 py-1 rounded-full w-fit mx-auto mb-4 border tracking-widest ${
                  isDark ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-600'
               }`}>
                  {currentOutfit.engineScore}% ENGINE MATCH
               </div>
           )}
           <span className="text-xs font-bold uppercase tracking-[0.1em] opacity-40 mb-2 block italic">
             {OCCASIONS[selectedDay].label} · {OCCASIONS[selectedDay].weather.toUpperCase()}
           </span>
           <h3 className="text-2xl font-black mb-2">{WEEKDAYS[selectedDay].label}<span className="text-purple-500">.</span></h3>
        </div>

        <div className="flex flex-col items-center gap-10 w-full max-w-[240px]">
          <div className="w-full flex flex-col items-center group">
            <div 
              className={`w-20 h-20 rounded-[2.5rem] border-4 border-white/20 shadow-xl transition-transform group-hover:scale-110 relative flex items-center justify-center text-3xl ${
                  currentOutfit.isExecuted ? 'bg-white/10' : ''
              }`} 
              style={{ backgroundColor: currentOutfit.top.hex }}
            >
              {currentOutfit.isExecuted ? '👔' : ''}
              {(currentOutfit.top.id || currentOutfit.isExecuted) && (
                <span className={`absolute -top-2 -right-2 text-[8px] font-black px-2 py-0.5 rounded-full text-white shadow-lg ${
                    currentOutfit.isExecuted ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                    {currentOutfit.isExecuted ? 'LOGGED' : 'CLOSET'}
                </span>
              )}
            </div>
            <div className="mt-4">
               <p className="font-black text-xs uppercase tracking-wider">{currentOutfit.top.name}</p>
               {currentOutfit.top.fabric && <p className="text-[9px] font-bold opacity-30 mt-1">{t(currentOutfit.top.fabric)} · {t(currentOutfit.top.fit)}</p>}
            </div>
          </div>

          <div className="w-full flex flex-col items-center group">
            <div 
              className={`w-20 h-20 rounded-[2.5rem] border-4 border-white/20 shadow-xl transition-transform group-hover:scale-110 relative flex items-center justify-center text-3xl ${
                  currentOutfit.isExecuted ? 'bg-white/10' : ''
              }`} 
              style={{ backgroundColor: currentOutfit.bottom.hex }}
            >
              {currentOutfit.isExecuted ? '👖' : ''}
              {(currentOutfit.bottom.id || currentOutfit.isExecuted) && (
                <span className={`absolute -top-2 -right-2 text-[8px] font-black px-2 py-0.5 rounded-full text-white shadow-lg ${
                    currentOutfit.isExecuted ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                    {currentOutfit.isExecuted ? 'LOGGED' : 'CLOSET'}
                </span>
              )}
            </div>
            <div className="mt-4">
               <p className="font-black text-xs uppercase tracking-wider">{currentOutfit.bottom.name}</p>
               {currentOutfit.bottom.fabric && <p className="text-[9px] font-bold opacity-30 mt-1">{t(currentOutfit.bottom.fabric)} · {t(currentOutfit.bottom.fit)}</p>}
            </div>
          </div>
        </div>

        {!currentOutfit.isExecuted && (
            <button 
                onClick={() => {
                    const query = `${currentOutfit.top.name} ${currentOutfit.bottom.name} for ${lifestyle}`.replace(/\s+/g, '%20');
                    window.open(`https://www.myntra.com/search?rawQuery=${query}`, '_blank');
                }}
                className="mt-12 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black hover:bg-white/10 transition-all uppercase tracking-widest shadow-xl"
            >
                🛒 {t('findOnMarket')}
            </button>
        )}
      </div>

      <p className="mt-6 text-[10px] text-center opacity-30 font-black italic uppercase tracking-wider max-w-xs mx-auto">
        THE AI SCORING ENGINE DETERMINES THE BEST OUTFIT BASED ON WEATHER, EVENT CONTEXT, AND YOUR SKIN DNA.
      </p>
    </div>
  );
}

export default OutfitCalendar;
