import React, { useState, useEffect, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { 
    auth, 
    getStyleInsights, 
    getWardrobe, 
    loadPrimaryProfile, 
    savePrimaryProfile,
    saveStyleInsights,
    loadStyleInsights,
    logDailyOutfit,
    getDailyOutfitLogs,
    loadUserPreferences,
    updateUserFeedback 
} from '../api/styleApi';

import { scoreWardrobeItem, getActionableAdvice, getAccessoryAdvice, calculateColorGaps } from '../utils/stylingEngine';
import { getCategoryIcon } from '../constants/fashionCategories';
import OutfitCalendar from './OutfitCalendar';
import WardrobePanel from './WardrobePanel';

const TONE_COLORS = { fair: "#F5DEB3", light: "#D2A679", medium: "#C68642", olive: "#A0724A", brown: "#7B4F2E", dark: "#4A2C0A" };

const TRENDING_COLLECTIONS = {
    male: [
        { id: 't1', key: 'item_oversized_tee', icon: '👕', score: 98 },
        { id: 't2', key: 'item_baggy_jeans', icon: '👖', score: 95 },
        { id: 't3', key: 'item_cargo_pants', icon: '📦', score: 92 },
        { id: 't4', key: 'item_varsity_jacket', icon: '🧥', score: 91 },
        { id: 't5', key: 'item_minimal_sneakers', icon: '👟', score: 96 },
        { id: 't6', key: 'item_cuban_collar', icon: '👔', score: 90 }
    ],
    female: [
        { id: 'f1', key: 'item_corset_top', icon: '🎀', score: 98 },
        { id: 'f2', key: 'item_wide_leg', icon: '👖', score: 96 },
        { id: 'f3', key: 'item_blazer', icon: '🧥', score: 94 },
        { id: 'f4', key: 'item_slip_dress', icon: '👗', score: 93 },
        { id: 'f5', key: 'item_chunky_loafers', icon: '👞', score: 91 },
        { id: 'f6', key: 'item_saree_chiffon', icon: '🥻', score: 97 }
    ]
};

export default function StyleNavigator({ user, onAnalyze }) {
    const { theme } = useContext(ThemeContext);
    const { t, language } = useLanguage();
    const isDark = theme === 'dark';

    const [loading, setLoading] = useState(true);
    const [insights, setInsights] = useState(null);
    const [profile, setProfile] = useState(null);
    const [prefs, setPrefs] = useState(null);
    const [isPrimary, setIsPrimary] = useState(false);
    const [error, setError] = useState(null);
    const [wardrobe, setWardrobe] = useState([]);
    const [isWorn, setIsWorn] = useState(false);
    const [logging, setLogging] = useState(false);
    const [mood, setMood] = useState('mood_minimal');
    const [isEditingDNA, setIsEditingDNA] = useState(false);
    const [editDNA, setEditDNA] = useState({ skinTone: 'medium', undertone: 'neutral', season: 'Spring' });
    const [activeTrendingGender, setActiveTrendingGender] = useState('male');
    const [activeView, setActiveView] = useState('intelligence'); // intelligence, planner, closet, shop, dna

    const [showShopSelector, setShowShopSelector] = useState(false);
    const [activeShopItem, setActiveShopItem] = useState(null);

    // Context Loading
    const loadInitialData = async () => {
        if (!auth.currentUser) { setLoading(false); return; }
        try {
            const uid = auth.currentUser.uid;
            const [primary, userPrefs, userWardrobe, logs] = await Promise.all([
                loadPrimaryProfile(uid),
                loadUserPreferences(uid),
                getWardrobe(uid),
                getDailyOutfitLogs(uid, 1)
            ]);
            
            const activeProfile = primary || JSON.parse(localStorage.getItem('sg_last_analysis') || 'null');
            if (!activeProfile) { setLoading(false); return; }

            setProfile(activeProfile);
            setPrefs(userPrefs);
            setWardrobe(userWardrobe);
            setIsPrimary(!!primary);
            setEditDNA({
                skinTone: activeProfile.skinTone || activeProfile.skin_tone?.category || 'medium',
                undertone: activeProfile.undertone || activeProfile.skin_tone?.undertone || 'neutral',
                season: activeProfile.season || activeProfile.skin_tone?.color_season || 'Spring'
            });

            // Auto-set gender lock
            const rawGender = activeProfile.gender || userPrefs?.gender || 'male';
            const isWomen = rawGender.toLowerCase().includes('female') || rawGender.toLowerCase() === 'women';
            setActiveTrendingGender(isWomen ? 'female' : 'male');

            const today = new Date().toLocaleDateString('en-CA');
            if (logs.length > 0 && logs[0].date === today) setIsWorn(true);

            // Load insights
            const data = await getStyleInsights(
                activeProfile.skinTone || activeProfile.skin_tone?.category,
                activeProfile.undertone || activeProfile.skin_tone?.undertone,
                userWardrobe,
                language,
                userPrefs?.lifestyle || 'other',
                rawGender
            );

            if (data.success) {
                setInsights(data.insights);
                await saveStyleInsights(uid, data.insights);
            }
        } catch (err) {
            console.error('Core Hub load failed:', err);
            setError('Sync Failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
        window.addEventListener('sg_wardrobe_updated', loadInitialData);
        return () => window.removeEventListener('sg_wardrobe_updated', loadInitialData);
    }, [language]);

    // Derived State
    const colorGaps = useMemo(() => {
        if (!profile || !wardrobe) return [];
        const rawGender = profile.gender || prefs?.gender || 'male';
        const st = (profile.skinTone || profile.skin_tone?.category || 'medium').toLowerCase();
        return calculateColorGaps(wardrobe, insights?.best_colors || profile.best_colors || [], rawGender, st);
    }, [wardrobe, insights, profile, prefs]);

    const handleWearToday = async () => {
        if (!auth.currentUser || !insights?.daily_suggestion || isWorn || logging) return;
        setLogging(true);
        try {
            const ok = await logDailyOutfit(auth.currentUser.uid, {
                title: insights.daily_suggestion.title,
                top: insights.daily_suggestion.top,
                bottom: insights.daily_suggestion.bottom,
                vibe: prefs?.lifestyle || 'casual'
            });
            if (ok) {
                setIsWorn(true);
                window.dispatchEvent(new CustomEvent('sg_calendar_updated'));
            }
        } catch (e) {} finally { setLogging(false); }
    };

    const handleUpdateDNA = async () => {
        if (!auth.currentUser || !profile) return;
        setLogging(true);
        try {
            const uid = auth.currentUser.uid;
            const updated = { ...profile, ...editDNA, skinHex: TONE_COLORS[editDNA.skinTone] || profile.skinHex, updated_at: new Date().toISOString() };
            await savePrimaryProfile(uid, updated);
            setProfile(updated);
            setIsEditingDNA(false);
            loadInitialData();
        } catch (e) {} finally { setLogging(false); }
    };

    const handleShopRedirect = (itemName, store) => {
        const rawGender = profile?.gender || prefs?.gender || 'male';
        const displayGender = rawGender.toLowerCase().includes('female') ? 'women' : 'men';
        const query = `${itemName} for ${displayGender} Trending 2025`;
        const slug = itemName.toLowerCase().replace(/ /g, '-');
        
        let url = '';
        switch(store) {
            case 'myntra': url = `https://www.myntra.com/${slug}-${displayGender}`; break;
            case 'amazon': url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`; break;
            case 'flipkart': url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`; break;
            default: url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        }
        window.open(url, '_blank');
        setShowShopSelector(false);
    };

    const getMatch = (colorName) => {
        if (!colorName || !wardrobe.length) return null;
        const low = colorName.toLowerCase();
        return wardrobe.find(item => {
            const colors = item.outfit_data?.colors || [];
            return colors.some(c => c.name.toLowerCase().includes(low)) || 
                   (item.color_name && item.color_name.toLowerCase().includes(low)) ||
                   (item.hex && item.hex.toLowerCase() === low);
        });
    };

    if (loading) return (
        <div className="space-y-6 pt-10 px-4">
            <div className={`h-48 rounded-[3rem] animate-pulse ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} />
            <div className={`h-64 rounded-[3rem] animate-pulse ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} />
        </div>
    );

    if (!profile) return (
        <div className="text-center py-24 px-6">
            <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-8 shadow-2xl">📸</div>
            <h2 className="text-3xl font-black mb-4">{t('startJourney')}</h2>
            <button onClick={onAnalyze} className="px-10 py-5 bg-purple-600 rounded-3xl text-white font-black uppercase text-xs tracking-widest shadow-xl">Analyze My Style DNA</button>
        </div>
    );

    return (
        <div className="space-y-8 pb-32">
            {/* ── SEGMENTED HUB NAVIGATION ────────────────────────── */}
            <div className={`sticky top-0 z-40 p-2 -mx-4 backdrop-blur-3xl border-b flex justify-between gap-1 overflow-x-auto scrollbar-hide ${isDark ? 'bg-[#050816]/90 border-white/10' : 'bg-slate-100/95 border-purple-100'}`}>
                {[
                    { id: 'intelligence', label: 'Brief', icon: '🧠' },
                    { id: 'planner', label: 'Planner', icon: '📅' },
                    { id: 'closet', label: 'Closet', icon: '👗' },
                    { id: 'shop', label: 'Shop', icon: '🛒' },
                    { id: 'dna', label: 'DNA', icon: '🧬' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveView(tab.id)}
                        className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl min-w-[70px] transition-all relative ${
                            activeView === tab.id ? 'text-white' : 'text-white/30'
                        }`}
                    >
                        {activeView === tab.id && (
                            <motion.div layoutId="hub-nav" className="absolute inset-0 bg-purple-600 rounded-2xl shadow-lg shadow-purple-900/40" />
                        )}
                        <span className="relative z-10 text-xl">{tab.icon}</span>
                        <span className="relative z-10 text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* ── VIEW: INTELLIGENCE (DAILY BRIEF) ────────────────────────── */}
                {activeView === 'intelligence' && (
                    <motion.div key="int" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                        {/* OOTD CARD */}
                        {insights?.daily_suggestion && (
                            <div className={`p-8 rounded-[3rem] border relative overflow-hidden group ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-xl shadow-purple-900/5'}`}>
                                <div className="absolute top-0 right-0 p-8">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-[1.2rem] flex items-center justify-center text-white shadow-xl">✨</div>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 mb-2">Today's DNA Mandate</p>
                                    <h3 className="text-3xl font-black mb-1">{insights.daily_suggestion.title}</h3>
                                    <p className="text-xs font-bold opacity-30 uppercase tracking-tighter mb-8">{profile.season.toUpperCase()} SYNERGY · {prefs?.lifestyle.toUpperCase()}</p>
                                    
                                    <div className="grid grid-cols-2 gap-8 mb-10">
                                        {['top', 'bottom'].map(type => {
                                            const name = insights.daily_suggestion[type];
                                            const match = getMatch(name);
                                            return (
                                                <div key={type} className="space-y-4">
                                                    <div className="w-full aspect-square rounded-[2rem] border-4 border-white/10 shadow-2xl relative" style={{ backgroundColor: match?.hex || '#222' }}>
                                                        {match ? (
                                                            <div className="absolute top-2 right-2 bg-green-500 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg">OWNED</div>
                                                        ) : (
                                                            <button onClick={() => { setActiveShopItem(name); setShowShopSelector(true); }} className="absolute top-2 right-2 bg-orange-600 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg animate-pulse">BUY</button>
                                                        )}
                                                        {isWorn && <div className="absolute inset-0 bg-green-500/40 rounded-[1.8rem] flex items-center justify-center text-3xl">✓</div>}
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase text-center">{name}</p>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <button onClick={handleWearToday} disabled={isWorn || logging} className={`w-full py-5 rounded-[1.8rem] font-black uppercase text-xs tracking-widest transition-all ${isWorn ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white text-slate-900 shadow-2xl active:scale-95'}`}>
                                        {isWorn ? 'Style Logged Today' : 'Mark as Worn'}
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* ACCESSORY BOX */}
                        <div className={`p-6 rounded-[2.5rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50'}`}>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-6 opacity-40">Accessory Engine</p>
                            {(() => {
                                const activeGender = profile?.gender || prefs?.gender || 'male';
                                const tips = getAccessoryAdvice(activeGender, profile?.season || 'Spring', mood === 'mood_attention' ? 'PARTY' : 'casual');
                                return (
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="flex gap-3 items-center">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">⌚</div>
                                            <div>
                                                <p className="text-[8px] font-black opacity-30 uppercase">Watch/Metal</p>
                                                <p className="text-[11px] font-black leading-tight mt-0.5">{tips.jewelry}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 items-center">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">👞</div>
                                            <div>
                                                <p className="text-[8px] font-black opacity-30 uppercase">Footwear</p>
                                                <p className="text-[11px] font-black leading-tight mt-0.5">{tips.shoes}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </motion.div>
                )}

                {/* ── VIEW: PLANNER (WEEKLY CALENDAR) ───────────────────── */}
                {activeView === 'planner' && (
                    <motion.div key="planner" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                         <OutfitCalendar 
                           profile={profile} 
                           wardrobe={wardrobe} 
                           isDark={isDark} 
                           onClose={() => setActiveView('intelligence')}
                           bestColors={insights?.best_colors || []}
                           pantColors={insights?.best_pant_colors || []}
                           hideHeader={true}
                         />
                    </motion.div>
                )}

                {/* ── VIEW: CLOSET (DIGITAL TWIN) ────────────────────────── */}
                {activeView === 'closet' && (
                    <motion.div key="closet" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                        <WardrobePanel 
                          gender={profile?.gender || prefs?.gender || 'male'} 
                          onShowResult={() => {}} 
                          hideHeader={true}
                        />
                    </motion.div>
                )}

                {/* ── VIEW: SHOPPING (COLOR GAPS) ───────────────────────── */}
                {activeView === 'shop' && (
                    <motion.div key="shop" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                        {/* GAPS ANALYSIS */}
                        <div className={`p-8 rounded-[3rem] border relative overflow-hidden ${isDark ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-white'}`}>
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-3xl shadow-xl shadow-indigo-500/30">🎯</div>
                                <div>
                                    <h3 className="text-2xl font-black">Style Gap Analysis</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Universal Color Calibration</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {colorGaps.map((gap, i) => (
                                    <div key={i} className={`p-5 rounded-[2.5rem] border flex items-center justify-between transition-all ${gap.inCloset ? 'opacity-40 grayscale border-transparent' : isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl border-4 border-white/10 shadow-xl" style={{ backgroundColor: gap.hex || '#888' }} />
                                            <div>
                                                <p className="font-black text-xs leading-none mb-1.5">{gap.item}</p>
                                                <p className="text-[9px] font-black uppercase text-indigo-400">+{Math.round(gap.synergy)}% Synergy</p>
                                            </div>
                                        </div>
                                        {gap.inCloset ? (
                                            <span className="text-xs">🏆</span>
                                        ) : (
                                            <button onClick={() => { setActiveShopItem(gap.item); setShowShopSelector(true); }} className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 active:scale-90 transition-all">🛒</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* TRENDING HUB */}
                        <div className="space-y-6">
                            <h4 className="px-4 text-[11px] font-black uppercase tracking-[0.4em] opacity-30">Trending Collections</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {(TRENDING_COLLECTIONS[activeTrendingGender] || []).map(item => (
                                    <button onClick={() => handleShopRedirect(t(item.key), 'myntra')} key={item.id} className={`p-6 rounded-[2.5rem] border text-left group transition-all ${isDark ? 'bg-white/5 border-white/10 hover:border-purple-500/40' : 'bg-white border-slate-100 shadow-sm'}`}>
                                        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                                        <p className="text-[11px] font-black uppercase leading-tight mb-2">{t(item.key)}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-purple-500 animate-pulse" />
                                            <p className="text-[8px] font-black text-purple-400 uppercase tracking-tighter">{item.score}% DNA HIT</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── VIEW: STYLE DNA (TECHNICAL) ────────────────────────── */}
                {activeView === 'dna' && (
                    <motion.div key="dna" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8">
                        <div className={`p-8 rounded-[3rem] border relative overflow-hidden ${isDark ? 'bg-white/5 border-white/10 shadow-2xl' : 'bg-white shadow-xl'}`}>
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black uppercase tracking-widest text-purple-400">Technical DNA</h3>
                                <button onClick={() => setIsEditingDNA(true)} className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase ${isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-slate-50 text-slate-500'}`}>Edit DNA</button>
                            </div>

                            <div className="flex items-center gap-6 mb-10">
                                <div className="w-20 h-20 rounded-[2rem] border-4 border-white/10 shadow-2xl" style={{ backgroundColor: isEditingDNA ? TONE_COLORS[editDNA.skinTone] : profile.skinHex }} />
                                <div className="flex-1">
                                    <h4 className="text-3xl font-black capitalize mb-1">{profile.skinTone || 'Medium'} Tone</h4>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{profile.undertone} Undertone · {profile.season} Palette</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Analyses', val: '24', icon: '📸' },
                                    { label: 'Closet Size', val: wardrobe.length, icon: '👕' },
                                    { label: 'Style Streak', val: '🔥 8', icon: '⚡' },
                                    { label: 'Engine Lvl', val: 'Elite', icon: '🧠' }
                                ].map((stat, i) => (
                                    <div key={i} className={`p-5 rounded-3xl border flex items-center gap-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50'}`}>
                                        <span className="text-2xl">{stat.icon}</span>
                                        <div>
                                            <p className="text-[8px] font-black opacity-30 uppercase leading-none mb-1">{stat.label}</p>
                                            <p className="text-sm font-black text-purple-400">{stat.val}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {isEditingDNA && (
                            <div className={`p-8 rounded-[3rem] border animate-slide-up ${isDark ? 'bg-[#0f1123] border-purple-500/30' : 'bg-white'}`}>
                                <h3 className="text-lg font-black mb-6">Recalibrate DNA</h3>
                                <div className="space-y-4">
                                    <select value={editDNA.skinTone} onChange={e => setEditDNA({...editDNA, skinTone: e.target.value})} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 font-bold">
                                        {Object.keys(TONE_COLORS).map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                                    </select>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={handleUpdateDNA} className="py-4 bg-purple-600 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest shadow-xl">Apply DNA Sync</button>
                                        <button onClick={() => setIsEditingDNA(false)} className="py-4 bg-white/5 border border-white/10 rounded-2xl text-white/40 font-black uppercase text-[10px] tracking-widest">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SHOP MODAL */}
            <AnimatePresence>
                {showShopSelector && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 backdrop-blur-2xl bg-black/60" onClick={() => setShowShopSelector(false)}>
                        <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} className={`w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative ${isDark ? 'bg-[#0f1123] border border-white/10' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-black">Select Style Source</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">Sourcing: {activeShopItem}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {['myntra', 'amazon', 'flipkart'].map(store => (
                                    <button onClick={() => handleShopRedirect(activeShopItem, store)} key={store} className={`flex flex-col items-center gap-3 p-6 rounded-[2.5rem] border transition-all active:scale-95 ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50'}`}>
                                        <span className="text-2xl">{store === 'myntra' ? '🎀' : store === 'amazon' ? '📦' : '🛒'}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{store.toUpperCase()}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
