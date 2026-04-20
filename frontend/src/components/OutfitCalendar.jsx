import { useState, useEffect } from 'react';
import { scoreWardrobeItem, getAccessoryAdvice, generateStylerBrief } from '../utils/stylingEngine';
import { useLanguage } from '../i18n/LanguageContext';
import { auth, getDailyOutfitLogs, loadUserPreferences, loadStyleInsights, logDailyOutfit } from '../api/styleApi';
import { buildMyntraSearchUrl } from '../utils/myntraUrl';
import { getWeeklyForecast } from '../utils/weatherService';

// ── Occasion-Aware Fallback Outfits (when wardrobe is empty) ──────────────────
// Each occasion gets a DIFFERENT outfit so calendar is never repetitive per day
const FALLBACK_MALE = {
  OFFICE:  { topName: 'Formal Shirt',   botName: 'Tailored Trousers', topCat: 'cat_formal_shirt',  botCat: 'cat_formal_trouser' },
  PARTY:   { topName: 'Party Shirt',    botName: 'Slim Jeans',        topCat: 'cat_party_shirt',   botCat: 'cat_jeans'          },
  CAMPUS:  { topName: 'Crew Tee',       botName: 'Slim Chinos',       topCat: 'cat_tshirt',        botCat: 'cat_chinos'         },
  WEEKEND: { topName: 'Polo Shirt',     botName: 'Clean Chinos',      topCat: 'cat_polo',          botCat: 'cat_chinos'         },
};
const FALLBACK_FEMALE = {
  OFFICE:  { topName: 'Structured Blazer', botName: 'Cigarette Trousers',     topCat: 'cat_blazer',        botCat: 'cat_formal_trouser' },
  PARTY:   { topName: 'Co-ord Set Top',    botName: 'Wide Leg Palazzo',       topCat: 'cat_top',           botCat: 'cat_palazzo'        },
  CAMPUS:  { topName: 'Casual Kurti',      botName: 'Cotton Palazzo',         topCat: 'cat_kurti',         botCat: 'cat_palazzo'        },
  WEEKEND: { topName: 'Crop Top',          botName: 'High Waist Mom Jeans',   topCat: 'cat_top',           botCat: 'cat_mom_jeans'      },
};

// ── Component ────────────────────────────────────────────────────────────────
// gender prop: passed from ToolsTab for reliable DNA-aware gender resolution
function OutfitCalendar({ bestColors, pantColors, isDark, onClose, wardrobe, profile, gender: genderProp }) {
  const { t } = useLanguage();
  const [selectedDay, setSelectedDay] = useState(0);
  const [logs, setLogs] = useState([]);
  const [lifestyle, setLifestyle] = useState('other');
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState('mood_comfort');
  const [lockedDNA, setLockedDNA] = useState(null);
  const [forecast, setForecast] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [plannedOutfits, setPlannedOutfits] = useState({});
  
  // Custom Event Overrides for the week
  const [eventOverrides, setEventOverrides] = useState({});

  useEffect(() => {
    const loadContext = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) { setLoading(false); return; }
      
      try {
        const [userLogs, prefs, dna, weather] = await Promise.all([
          getDailyOutfitLogs(uid, 14),
          loadUserPreferences(uid),
          loadStyleInsights(uid),
          getWeeklyForecast()
        ]);
        setLogs(userLogs);
        if (prefs?.lifestyle) setLifestyle(prefs.lifestyle);
        if (dna) setLockedDNA(dna);
        setForecast(weather);
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
        const dayForecast = forecast[day.key] || { condition: 'pleasant', temp: 25 };
        return {
            ...day,
            event: typeId,
            icon: type.icon,
            label: type.label,
            weather: dayForecast.condition,
            temp: dayForecast.temp
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
    // Priority: 1. Execution Logs (History) -> 2. User Planned -> 3. AI Predictive
    const log = getLogForDay(index);
    const planned = plannedOutfits[index];
    const occasion = OCCASIONS[index];
    
    // ── Context Setup ───────────────────────────────────────────────────────
    const rawGender = lockedDNA?.gender || profile?.gender || profile?.gender_mode || genderProp || 'male';
    const activeGender = (rawGender.toLowerCase().includes('female') || rawGender === 'women') ? 'female' : 'male';
    const activeSeason = profile?.season || profile?.skin_tone?.color_season || 'Spring';
    const userProfile = { ...profile, gender: activeGender, season: activeSeason };
    const context = { weather: occasion.weather, event: occasion.event, mood };
    const historyItems = logs.map(l => ({ itemId: l.id, date: l.date }));

    if (log) {
        return {
            top: { name: log.top, type: 'executed' },
            bottom: { name: log.bottom, type: 'executed' },
            occasion,
            isExecuted: true,
            brief: "You wore this look! History saved in the cloud.",
            accessories: getAccessoryAdvice(activeGender, activeSeason, occasion.event)
        };
    }

    if (planned) return { ...planned, isPlanned: true };

    // ── AI Predictive Engine ───────────────────────────────────────────────
    const rankedWardrobe = wardrobe
        ?.map(item => ({
            ...item,
            engineScore: scoreWardrobeItem(item, context, userProfile, historyItems, profile?.preferences, lockedDNA)
        }))
        .filter(i => i.engineScore > 0)
        .sort((a, b) => b.engineScore - a.engineScore) || [];

    const topCats = activeGender === 'male'
        ? ['shirts', 'tshirts', 'cat_formal_shirt', 'cat_kurta_set', 'cat_sherwani', 'cat_party_shirt', 'cat_polo', 'cat_tshirt']
        : ['tops', 'kurti', 'cat_kurti', 'cat_saree_silk', 'cat_dress_mini', 'cat_dress_maxi', 'cat_top', 'cat_blazer'];

    const bottomCats = activeGender === 'male'
        ? ['pants', 'cat_formal_trouser', 'cat_jeans', 'cat_cargo', 'cat_chinos']
        : ['pants', 'bottoms', 'cat_palazzo', 'cat_mom_jeans', 'cat_skirt'];

    const fallbackMap = activeGender === 'male' ? FALLBACK_MALE : FALLBACK_FEMALE;
    const fallback = fallbackMap[occasion.event] || fallbackMap['WEEKEND'];

    const matchingTops = rankedWardrobe.filter(i => topCats.includes(i.category));
    const matchingBottoms = rankedWardrobe.filter(i => bottomCats.includes(i.category));

    const isWardrobeEmpty = matchingTops.length === 0;

    const bestTopObj = bestColors.length > 0 ? bestColors[index % bestColors.length] : null;
    const bestPantObj = pantColors.length > 0 ? pantColors[(index + 1) % pantColors.length] : null;

    const bestTop = matchingTops.length > 0 
                    ? matchingTops[0] 
                    : {
                        name: bestTopObj ? `${bestTopObj.name || 'Signature'} ${fallback.topName}` : fallback.topName,
                        hex: bestTopObj ? bestTopObj.hex : '#7C3AED',
                        engineScore: 85,
                        category: fallback.topCat,
                        isMissing: true
                    };

    const bestBottom = matchingBottoms.length > 0 
                       ? matchingBottoms[0] 
                       : {
                           name: bestPantObj ? `${bestPantObj.name || 'Classic'} ${fallback.botName}` : fallback.botName,
                           hex: bestPantObj ? bestPantObj.hex : '#1e3a8a',
                           engineScore: 80,
                           category: fallback.botCat,
                           isMissing: true
                       };

    const accessorizing = getAccessoryAdvice(activeGender, activeSeason, occasion.event);
    const stylingBrief = generateStylerBrief(bestTop, bestBottom, context, userProfile);

    return {
      top: bestTop,
      bottom: bestBottom,
      occasion,
      engineScore: Math.round(((bestTop.engineScore || 70) + (bestBottom.engineScore || 70)) / 2),
      isFromWardrobe: !!(bestTop.id || bestBottom.id),
      isExecuted: false,
      accessories: accessorizing,
      brief: stylingBrief,
      isMissing: bestTop.isMissing || bestBottom.isMissing
    };
  };

  const handleSmartGenerate = async () => {
     setIsGenerating(true);
     const newPlan = {};
     // Run logic for each day
     for(let i=0; i<7; i++) {
        newPlan[i] = getOutfitForDay(i);
     }
     setPlannedOutfits(newPlan);
     setTimeout(() => setIsGenerating(false), 800);
  };

  const handleLogOutfit = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || dayInfo.isExecuted) return;
    
    const success = await logDailyOutfit(uid, {
        top: dayInfo.top.name,
        bottom: dayInfo.bottom.name,
        topId: dayInfo.top.id || null,
        bottomId: dayInfo.bottom.id || null,
        event: dayInfo.occasion.event,
        score: dayInfo.engineScore
    });
    
    if (success) {
        setLogs(prev => [{ date: new Date().toISOString(), ...dayInfo }, ...prev]);
        window.alert("Outfit Logged & Items Sent to Laundry! 🧺");
    }
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
             <span className="text-purple-500">AI</span> PREDICTOR
          </h2>
          <p className="text-[9px] opacity-40 uppercase font-black tracking-widest leading-none">Style Ecosystem v4.0</p>
        </div>
      </div>

      {/* SMART GENERATE BUTTON (Phase 4) */}
      <button 
        onClick={handleSmartGenerate}
        disabled={isGenerating}
        className={`w-full mb-6 py-4 rounded-2xl border-2 border-dashed transition-all flex items-center justify-center gap-3 ${
            isGenerating ? 'opacity-50' : 'hover:bg-purple-500/10 border-purple-500/30 text-purple-500 hover:border-purple-500'
        }`}
      >
          {isGenerating ? (
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          ) : <span>🧠</span>}
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isGenerating ? 'Thinking...' : 'AI Smart Plan Week'}</span>
      </button>

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
              <div className="flex gap-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${isDark ? 'bg-white/10 text-white/60' : 'bg-slate-100 text-slate-500'}`}>
                    {OCCASIONS[selectedDay].temp}°C 🌡️
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${isDark ? 'bg-white/10 text-white/60' : 'bg-slate-100 text-slate-500'}`}>
                    {OCCASIONS[selectedDay].weather?.toUpperCase()} WEATHER 🛰️
                </span>
              </div>
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

            {dayInfo.isMissing && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                   <div className="text-lg">🕵️</div>
                   <div>
                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-tight">The Missing Piece</p>
                      <p className="text-[8px] opacity-60">This mission-match is missing from your closet. AI recommends acquiring this look.</p>
                   </div>
                </div>
            )}

            {!dayInfo.isExecuted ? (
                <div className="flex gap-2 mt-auto pt-6">
                    <button 
                        onClick={() => {
                            const itemName = dayInfo.top.name || 'shirt';
                            const lower = itemName.toLowerCase();
                            let itemType = 'shirt';
                            if (lower.includes('trouser') || lower.includes('pant') || lower.includes('jean')) itemType = 'pant';
                            else if (lower.includes('dress') || lower.includes('coord')) itemType = 'dress';
                            else if (lower.includes('kurti') || lower.includes('saree') || lower.includes('lehenga')) itemType = 'kurti';
                            else if (lower.includes('top') || lower.includes('blouse')) itemType = 'top';
                            const gender = dayInfo.top.gender || 'male';
                            window.open(buildMyntraSearchUrl(itemName, gender, itemType), '_blank');
                        }}
                        className="flex-1 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        {dayInfo.isMissing ? '🛍️ Shop Look' : '🛒 Shop Similar'}
                    </button>
                    {!dayInfo.isMissing && (
                        <button 
                            onClick={handleLogOutfit}
                            className="flex-1 py-4 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            ✅ Mark as Worn
                        </button>
                    )}
                </div>
            ) : (
                <div className="mt-auto pt-6 w-full py-4 bg-green-500/20 text-green-400 border border-green-500/30 rounded-2xl text-[10px] font-black uppercase text-center tracking-widest">
                    🏆 MISSION COMPLETE
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default OutfitCalendar;
