import React, { useState, useEffect, useContext } from 'react';
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

import { scoreWardrobeItem, getActionableAdvice, getAccessoryAdvice } from '../utils/stylingEngine';
import { getCategoryIcon } from '../constants/fashionCategories';

const infoCls = "w-5 h-5 rounded-full flex items-center justify-center text-[10px] cursor-help transition-all";

const TONE_COLORS = { fair: "#F5DEB3", light: "#D2A679", medium: "#C68642", olive: "#A0724A", brown: "#7B4F2E", dark: "#4A2C0A" };

const StyleNavigator = ({ user, onAnalyze }) => {
    const { theme } = useContext(ThemeContext);
    const { t, language } = useLanguage();
    const isDark = theme === 'dark';

    const [loading, setLoading] = useState(true);
    const [insights, setInsights] = useState(null);
    const [profile, setProfile] = useState(null);
    const [prefs, setPrefs] = useState(null);
    const [isPrimary, setIsPrimary] = useState(false);
    const [error, setError] = useState(null);
    const [showInfo, setShowInfo] = useState(null); // 'harmony' | 'gap' | null
    const [wardrobe, setWardrobe] = useState([]);
    const [isWorn, setIsWorn] = useState(false);
    const [logging, setLogging] = useState(false);
    const [mood, setMood] = useState('mood_minimal');
    const [isEditingDNA, setIsEditingDNA] = useState(false);
    const [editDNA, setEditDNA] = useState({ skinTone: 'medium', undertone: 'neutral', season: 'Spring' });
    const [activeView, setActiveView] = useState('daily'); // 'daily' | 'shop' | 'dna'

    useEffect(() => {
        const loadInitialData = async () => {
            if (!auth.currentUser) {
                setLoading(false);
                return;
            }

            try {
                const uid = auth.currentUser.uid;
                const [primary, userPrefs, userWardrobe, logs] = await Promise.all([
                    loadPrimaryProfile(uid),
                    loadUserPreferences(uid),
                    getWardrobe(uid),
                    getDailyOutfitLogs(uid, 1)
                ]);
                
                let activeProfile = primary;
                if (primary) {
                    setIsPrimary(true);
                } else {
                    activeProfile = JSON.parse(localStorage.getItem('sg_last_analysis') || 'null');
                    setIsPrimary(false);
                }

                if (!activeProfile) {
                    setLoading(false);
                    return;
                }
                setProfile(activeProfile);
                setPrefs(userPrefs);
                setWardrobe(userWardrobe);
                setEditDNA({
                    skinTone: activeProfile.skinTone || activeProfile.skin_tone?.category || 'medium',
                    undertone: activeProfile.undertone || activeProfile.skin_tone?.undertone || 'neutral',
                    season: activeProfile.season || activeProfile.skin_tone?.color_season || 'Spring'
                });

                // Check if already worn today
                const today = new Date().toLocaleDateString('en-CA');
                if (logs.length > 0 && logs[0].date === today) {
                    setIsWorn(true);
                }

                // Load locked insights from Firestore first
                const lockedInsights = await loadStyleInsights(uid);
                if (lockedInsights) {
                    setInsights(lockedInsights);
                }

                const data = await getStyleInsights(
                    activeProfile.skinTone || activeProfile.skin_tone?.category,
                    activeProfile.undertone || activeProfile.skin_tone?.undertone,
                    userWardrobe,
                    language,
                    userPrefs?.lifestyle || 'other',
                    activeProfile.gender || userPrefs?.gender || 'men'
                );

                if (data.success) {
                    setInsights(data.insights);
                    // Sync to Firestore for persistence
                    await saveStyleInsights(uid, data.insights);
                } else if (!lockedInsights) {
                    setError('Failed to sync style data');
                }
            } catch (err) {
                console.error('Style Navigator load failed:', err);
                setError('Failed to sync style data');
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
        window.addEventListener('sg_wardrobe_updated', loadInitialData);
        return () => window.removeEventListener('sg_wardrobe_updated', loadInitialData);
    }, [language]);

    const getMatch = (colorName, categoryHint = 'top') => {
        if (!colorName || !wardrobe.length) return null;
        
        // Use AIPSE Engine for matching
        const context = { weather: 'sunny', event: prefs?.lifestyle || 'casual', mood };
        const userProfile = profile || { gender: 'male' };

        const ranked = wardrobe
            .map(item => ({
                ...item,
                engineScore: scoreWardrobeItem(item, context, userProfile, [], prefs || {}, insights)
            }))
            .sort((a, b) => b.engineScore - a.engineScore);

        // Try to find a high-match item in wardrobe that matches the hint
        const low = colorName.toLowerCase();
        return ranked.find(item => {
            const outfitColors = item.outfit_data?.colors || [];
            const matchesColor = outfitColors.some(c => c.name.toLowerCase().includes(low)) || 
                                (item.hex && item.hex.toLowerCase() === low) ||
                                (item.color_name && item.color_name.toLowerCase().includes(low));
            
            return matchesColor && item.engineScore > 60;
        });
    };

    const handleWearToday = async () => {
        if (!auth.currentUser || !insights?.daily_suggestion || isWorn || logging) return;
        setLogging(true);
        try {
            const success = await logDailyOutfit(auth.currentUser.uid, {
                title: insights.daily_suggestion.title,
                top: insights.daily_suggestion.top,
                bottom: insights.daily_suggestion.bottom,
                vibe: prefs?.lifestyle || 'casual'
            });
            if (success) {
                setIsWorn(true);
                 window.dispatchEvent(new CustomEvent('sg_calendar_updated'));
            }
        } catch (e) {
            console.error('Failed to log outfit:', e);
        } finally {
            setLogging(false);
        }
    };

    const handleUpdateDNA = async () => {
        if (!auth.currentUser || !profile) return;
        setLogging(true);
        try {
            const uid = auth.currentUser.uid;
            const updatedProfile = {
                ...profile,
                skinTone: editDNA.skinTone,
                undertone: editDNA.undertone,
                season: editDNA.season,
                // Ensure skinHex is updated if manually changed
                skinHex: TONE_COLORS[editDNA.skinTone] || profile.skinHex,
                updated_at: new Date().toISOString()
            };
            await savePrimaryProfile(uid, updatedProfile);
            setProfile(updatedProfile);
            setIsEditingDNA(false);
            // Refresh insights
            const data = await getStyleInsights(
                updatedProfile.skinTone,
                updatedProfile.undertone,
                wardrobe,
                language,
                prefs?.lifestyle || 'other',
                updatedProfile.gender || prefs?.gender || 'men'
            );
            if (data.success) {
                setInsights(data.insights);
                await saveStyleInsights(uid, data.insights);
            }
            window.dispatchEvent(new CustomEvent('sg_wardrobe_updated'));
        } catch (e) {
            console.error('Failed to update DNA:', e);
            alert('Update failed. Please try again.');
        } finally {
            setLogging(false);
        }
    };

    const handleReanalyze = () => {
        if (window.confirm('This will clear your current profile and start a new analysis. Proceed?')) {
            localStorage.removeItem('sg_primary_profile');
            localStorage.removeItem('sg_locked_insights');
            onAnalyze();
        }
    };

    const handleTogglePrimary = async () => {
        if (!auth.currentUser || !profile) return;
        try {
            if (isPrimary) {
                setIsPrimary(false);
                localStorage.removeItem('sg_primary_profile');
            } else {
                await savePrimaryProfile(auth.currentUser.uid, profile);
                setIsPrimary(true);
            }
        } catch (e) {
            console.error('Failed to toggle primary profile:', e);
        }
    };

    const handleFeedback = async (signal) => {
        if (!auth.currentUser || logging) return;
        const suggestion = insights?.daily_suggestion;
        if (!suggestion) return;

        setLogging(true);
        try {
            const uid = auth.currentUser.uid;
            // Capture the top's category and the bottom's category if possible, 
            // but for now we tag the actual colors/vibes
            await updateUserFeedback(uid, 'color', suggestion.top, signal);
            await updateUserFeedback(uid, 'color', suggestion.bottom, signal);
            
            // Show feedback
            const msg = signal === 'like' ? 'Style preference saved! ❤️' : 'Optimizing engine... 🧠';
            alert(msg); // Simplified for now, or use a toast if available
            
            // Reload prefs to refresh scores
            const newPrefs = await loadUserPreferences(uid);
            setPrefs(newPrefs);
        } catch (e) {
            console.error('Feedback failed:', e);
        } finally {
            setLogging(false);
        }
    };

    const [showShopSelector, setShowShopSelector] = useState(false);
    const [activeShopItem, setActiveShopItem] = useState(null);

    const handleShopRedirect = (fullItemName, store) => {
        // STRICT GENDER ENFORCEMENT
        const rawGender = insights?.gender || profile?.gender || prefs?.gender || 'male';
        const isWomen = rawGender.toLowerCase().includes('female') || rawGender.toLowerCase() === 'women';
        const displayGender = isWomen ? 'women' : 'men';
        
        // MODERN KEYWORDS: Adding 'Trending 2025', 'Premium', etc.
        const modernKeywords = "Trending 2025 Premium Latest Collection High Quality";
        const query = `${fullItemName} for ${displayGender} ${modernKeywords}`; 
        const slug = fullItemName.toLowerCase().replace(/ /g, '-');
        
        let url = '';
        switch(store) {
            case 'myntra':
                // Myntra slug logic: item-title-women
                url = `https://www.myntra.com/${slug}-${displayGender}`;
                break;
            case 'amazon':
                url = `https://www.amazon.in/s?k=${encodeURIComponent(`${displayGender}'s ${fullItemName} Trending 2025 India`)}`;
                break;
            case 'flipkart':
                url = `https://www.flipkart.com/search?q=${encodeURIComponent(`${displayGender} ${fullItemName} Premium Quality 2025`)}`;
                break;
            case 'meesho':
                url = `https://www.meesho.com/search?q=${encodeURIComponent(`${displayGender} ${fullItemName}`)}`;
                break;
            default:
                url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        }
        window.open(url, '_blank');
        setShowShopSelector(false);
    };

    const openShop = (itemName) => {
        setActiveShopItem(itemName);
        setShowShopSelector(true);
    };

    if (!auth.currentUser) {
        return (
            <div className="text-center py-20 animate-fade-in">
                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl text-purple-400">🔐</span>
                </div>
                <h2 className={`text-2xl font-black mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('loginRequired') || 'Login Required'}</h2>
                <p className={`text-sm max-w-xs mx-auto ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                    Unlock your personal Style Navigator by signing in to your account.
                </p>
            </div>
        );
    }

    if (!profile && !loading) {
        return (
            <div className="text-center py-20 px-4 animate-fade-in">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/10">
                    <span className="text-5xl animate-bounce">📸</span>
                </div>
                <h2 className={`text-2xl font-black mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('startJourney') || 'Start Your Journey'}</h2>
                <p className={`text-sm max-w-xs mx-auto mb-8 leading-relaxed ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                    We need one quick analysis to build your **Style DNA** and unlock your personal navigator.
                </p>
                <button
                    onClick={onAnalyze}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white font-black shadow-lg shadow-purple-900/40 hover:scale-105 active:scale-95 transition-all"
                >
                    Analyze My First Look
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="space-y-6 pt-4 animate-fade-in">
                <div className={`h-48 rounded-3xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} />
                <div className={`h-64 rounded-3xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} />
                <div className={`h-40 rounded-3xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} />
            </div>
        );
    }

    const lifestyleKey = prefs?.lifestyle ? `lifestyle_${prefs.lifestyle}` : 'lifestyle_other';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pt-2 pb-10"
        >
            {/* ── SEGMENTED NAVIGATION ──────────────────────── */}
            <div className={`sticky top-0 z-30 p-2 -mx-4 mb-6 backdrop-blur-xl border-b flex justify-center gap-1 ${isDark ? 'bg-[#050816]/80 border-white/10' : 'bg-slate-100/80 border-purple-100'}`}>
                {[
                    { id: 'daily', label: 'Recommended', icon: '✨' },
                    { id: 'shop', label: 'Shopping', icon: '🛒' },
                    { id: 'dna', label: 'Style DNA', icon: '🧬' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveView(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all relative ${
                            activeView === tab.id 
                                ? 'text-white' 
                                : isDark ? 'text-white/40 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {activeView === tab.id && (
                            <motion.div 
                                layoutId="nav-bg"
                                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg shadow-purple-900/40"
                                initial={false}
                                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                            />
                        )}
                        <span className="relative z-10">{tab.icon}</span>
                        <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeView === 'dna' && (
                    <motion.div
                        key="dna"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {/* ── SECTION 1: STYLE DNA ──────────────────────── */}
                        <div className={`relative overflow-hidden rounded-[2.5rem] p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-xl shadow-purple-900/5'}`}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-2">
                                     <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Permanent DNA</p>
                                     <button onClick={() => setIsEditingDNA(true)} className={`text-[9px] font-black px-2 py-0.5 rounded-md ${isDark ? 'bg-white/10 text-white/40 hover:text-white' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`}>EDIT ✏️</button>
                                </div>
                                
                                <button 
                                    onClick={handleTogglePrimary}
                                    className={`w-fit flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${
                                        isPrimary 
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                            : isDark ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                                    }`}
                                >
                                    <span>{isPrimary ? '🏠' : '🔓'}</span>
                                    <span>{isPrimary ? (t('primaryProfileLocked') || 'Home Profile') : (t('setAsHomeTone') || 'Set as Home Tone')}</span>
                                </button>
                            </div>

                            <div className="relative z-10 flex items-center gap-5">
                                <div
                                    className="w-20 h-20 rounded-2xl border-4 border-white/20 shadow-2xl overflow-hidden flex-shrink-0 transition-colors duration-500"
                                    style={{ backgroundColor: isEditingDNA ? (TONE_COLORS[editDNA.skinTone] || '#C68642') : (profile?.skinHex || profile?.skin_color?.hex || '#C68642') }}
                                />
                                <div className="flex-1 min-w-0">
                                    {isEditingDNA ? (
                                        <div className="space-y-3 animate-fade-in">
                                            <div className="flex gap-2">
                                                <select 
                                                    value={editDNA.skinTone} 
                                                    onChange={(e) => setEditDNA({...editDNA, skinTone: e.target.value})}
                                                    className={`flex-1 text-[10px] p-2 rounded-xl border font-black focus:outline-none transition-all ${isDark ? 'bg-[#1a1c2e] border-white/10 text-white select-dark-options' : 'bg-white border-purple-200 text-slate-800'}`}
                                                >
                                                    {['fair', 'light', 'medium', 'olive', 'brown', 'dark'].map(t => <option key={t} value={t} className={isDark ? 'bg-[#1a1c2e] text-white' : ''}>{t.toUpperCase()}</option>)}
                                                </select>
                                                <select 
                                                    value={editDNA.undertone} 
                                                    onChange={(e) => setEditDNA({...editDNA, undertone: e.target.value})}
                                                    className={`flex-1 text-[10px] p-2 rounded-xl border font-black focus:outline-none transition-all ${isDark ? 'bg-[#1a1c2e] border-white/10 text-white select-dark-options' : 'bg-white border-purple-200 text-slate-800'}`}
                                                >
                                                    {['warm', 'cool', 'neutral'].map(u => <option key={u} value={u} className={isDark ? 'bg-[#1a1c2e] text-white' : ''}>{u.toUpperCase()}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex gap-2">
                                                <select 
                                                    value={editDNA.season} 
                                                    onChange={(e) => setEditDNA({...editDNA, season: e.target.value})}
                                                    className={`flex-1 text-[10px] p-2 rounded-xl border font-black focus:outline-none transition-all ${isDark ? 'bg-[#1a1c2e] border-white/10 text-white select-dark-options' : 'bg-white border-purple-200 text-slate-800'}`}
                                                >
                                                    {['Spring', 'Summer', 'Autumn', 'Winter'].map(s => <option key={s} value={s} className={isDark ? 'bg-[#1a1c2e] text-white' : ''}>{s}</option>)}
                                                </select>
                                                <button onClick={handleUpdateDNA} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-purple-500/20 active:scale-95 transition-all">Save</button>
                                            </div>
                                            <button 
                                                onClick={handleReanalyze}
                                                className={`w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                            >
                                                📸 Re-analyze Photo
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className={`text-2xl font-black capitalize truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                {profile?.skinTone || profile?.skin_tone?.category} {profile?.undertone || profile?.skin_tone?.undertone}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${isDark ? 'bg-white/5 border-white/10' : 'bg-purple-50 border-purple-100 text-purple-700'}`}>
                                                    {profile?.season || profile?.skin_tone?.color_season || 'Spring'} Edition
                                                </span>
                                            </div>
                                            <div className="mt-4 space-y-2">
                                                <p className={`text-[9px] font-black uppercase opacity-40`}>Actionable DNA Stats</p>
                                                <div className="flex flex-wrap gap-2">
                                                     <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
                                                        <span>👕</span>
                                                        <span>{wardrobe.length} Wardrobe Items</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 grid grid-cols-2 gap-3">
                                <div className={`p-4 rounded-3xl border relative ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100/50 border-slate-200'}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <p className={`text-[10px] font-bold uppercase ${isDark ? 'text-white/30' : 'text-slate-500'}`}>Harmony Score</p>
                                        <button onClick={() => setShowInfo(showInfo === 'harmony' ? null : 'harmony')} className={`${infoCls} ${isDark ? 'bg-white/10 text-white/40' : 'bg-slate-200 text-slate-500'}`}>?</button>
                                    </div>
                                    <div className="flex items-end gap-2">
                                         <span className={`text-2xl font-black ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                            {(() => {
                                                if (!wardrobe.length || !profile) return '0%';
                                                const totalScore = wardrobe.reduce((acc, item) => {
                                                    return acc + scoreWardrobeItem(item, { weather: 'sunny' }, profile, [], prefs || {}, insights);
                                                }, 0);
                                                return Math.round(totalScore / wardrobe.length) + '%';
                                            })()}
                                         </span>
                                    </div>
                                    
                                    <AnimatePresence>
                                        {showInfo === 'harmony' && (
                                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`absolute inset-0 z-20 p-4 rounded-3xl flex items-center text-[10px] font-medium leading-tight backdrop-blur-md ${isDark ? 'bg-black/90 text-white' : 'bg-white/95 text-slate-600 shadow-xl'}`}>
                                                {t('harmonyExplain')}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className={`p-4 rounded-3xl border relative ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100/50 border-slate-200'}`}>
                                    <p className={`text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-white/30' : 'text-slate-500'}`}>Sync Status</p>
                                    <div className="flex items-end gap-2">
                                        <span className={`text-[10px] font-black ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>ACTIVE ANALYZER</span>
                                        <button onClick={onAnalyze} className={`ml-auto text-[9px] font-black px-2 py-1 rounded-lg ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>REFRESH 📸</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeView === 'daily' && (
                    <motion.div
                        key="daily"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {/* ── SECTION 2: MOOD & ENGINE ──────────────────────── */}
                        <div className="space-y-4">
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-white/40' : 'text-slate-500/60'}`}>Recommended Intent</p>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { id: 'mood_comfort', label: 'Comfort' },
                                    { id: 'mood_confidence', label: 'Confident' },
                                    { id: 'mood_minimal', label: 'Minimal' },
                                    { id: 'mood_attention', label: 'Party' }
                                ].map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMood(m.id)}
                                        className={`py-3 rounded-xl border text-[9px] font-black uppercase transition-all ${
                                            mood === m.id 
                                                ? 'bg-purple-600 border-transparent text-white shadow-lg' 
                                                : isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-white border-gray-200 text-slate-500 hover:bg-gray-50'
                                        }`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* DAILY SUGGESTION CARD */}
                        {insights?.daily_suggestion && (
                            <div className={`rounded-[2.5rem] p-7 border relative overflow-hidden transition-all ${isDark ? 'bg-white/5 border-white/10 shadow-2xl' : 'bg-white border-purple-100 shadow-xl shadow-purple-900/5'}`}>
                                <div className="absolute top-0 right-0 p-6 flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">✨</div>
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full border tracking-widest ${isDark ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-600'}`}>
                                           TODAY'S BEST LOOK
                                        </span>
                                    </div>
                                    
                                    <h2 className={`text-2xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        {insights.daily_suggestion.title}
                                    </h2>
                                    <p className={`text-sm mb-8 opacity-60 font-medium ${isDark ? 'text-white' : 'text-slate-500'}`}>
                                         {t(lifestyleKey)} Rotation · {t('basedOnWeather')}
                                    </p>

                                    <div className="grid grid-cols-2 gap-6 mb-8">
                                        {/* TOP */}
                                        {(() => {
                                            const match = getMatch(insights.daily_suggestion.top, 'top');
                                            return (
                                                <div className="space-y-3 relative group">
                                                    <div className="w-16 h-16 rounded-2xl border-4 border-white/10 shadow-lg relative flex-shrink-0" style={{ backgroundColor: match?.hex || '#888' }}>
                                                        {match ? (
                                                             <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg">CLOSET</span>
                                                        ) : (
                                                             <button 
                                                                onClick={() => openShop(insights.daily_suggestion.top)}
                                                                className="absolute -top-2 -right-2 bg-orange-600 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg animate-pulse hover:scale-110 transition-transform"
                                                             >
                                                                🛒 SHOP
                                                             </button>
                                                        )}
                                                        {isWorn && <div className="absolute inset-0 bg-green-500/40 rounded-xl flex items-center justify-center text-white text-xl">✓</div>}
                                                    </div>
                                                    <div>
                                                        <p className={`text-[10px] font-black uppercase truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{insights.daily_suggestion.top}</p>
                                                        <p className="text-[9px] font-bold opacity-30 mt-0.5">{match ? (match.color_name || 'Matched') : '🚧 Score Boost Available'}</p>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* BOTTOM */}
                                        {(() => {
                                            const match = getMatch(insights.daily_suggestion.bottom, 'bottom');
                                            return (
                                                <div className="space-y-3 relative group">
                                                    <div className="w-16 h-16 rounded-2xl border-4 border-white/10 shadow-lg relative flex-shrink-0" style={{ backgroundColor: match?.hex || '#333' }}>
                                                        {match ? (
                                                             <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg">CLOSET</span>
                                                        ) : (
                                                             <button 
                                                                onClick={() => openShop(insights.daily_suggestion.bottom)}
                                                                className="absolute -top-2 -right-2 bg-orange-600 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg animate-pulse hover:scale-110 transition-transform"
                                                             >
                                                                🛒 SHOP
                                                             </button>
                                                        )}
                                                        {isWorn && <div className="absolute inset-0 bg-green-500/40 rounded-xl flex items-center justify-center text-white text-xl">✓</div>}
                                                    </div>
                                                    <div>
                                                        <p className={`text-[10px] font-black uppercase truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{insights.daily_suggestion.bottom}</p>
                                                        <p className="text-[9px] font-bold opacity-30 mt-0.5">{match ? (match.color_name || 'Matched') : '🚧 Score Boost Available'}</p>
                                                        
                                                        {/* Finishing Touches Section */}
                                                        <div className={`mt-6 p-4 rounded-3xl border border-dashed ${isDark ? 'bg-white/5 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
                                                             <p className={`text-[9px] font-black uppercase ${isDark ? 'opacity-40' : 'text-slate-500'} mb-3 tracking-widest`}>Finishing Touches</p>
                                                             {(() => {
                                                                 const rawGender = insights?.gender || profile?.gender || prefs?.gender || 'male';
                                                                 const isFemale = rawGender.toLowerCase().includes('female') || rawGender.toLowerCase() === 'women';
                                                                 const tips = getAccessoryAdvice(isFemale ? 'female' : 'male', profile?.season || 'Spring');
                                                                  return (
                                                                      <div className="flex flex-col sm:flex-row gap-6">
                                                                          <div className="flex-1 flex gap-3 items-center min-w-0">
                                                                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white shadow-sm border border-slate-100'}`}>
                                                                                  {isFemale ? '💍' : '⌚'}
                                                                              </div>
                                                                              <div className="min-w-0">
                                                                                  <p className={`text-[9px] font-black uppercase tracking-wider ${isDark ? 'opacity-40' : 'text-slate-500'}`}>{tips.label || (isFemale ? 'Jewelry Advice' : 'Accessory Advice')}</p>
                                                                                  <p className={`text-[11px] font-extrabold leading-tight break-words ${isDark ? 'text-white' : 'text-slate-900'}`}>{tips.jewelry}</p>
                                                                              </div>
                                                                          </div>
                                                                          <div className="flex-1 flex gap-3 items-center min-w-0">
                                                                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white shadow-sm border border-slate-100'}`}>👞</div>
                                                                              <div className="min-w-0">
                                                                                  <p className={`text-[9px] font-black uppercase tracking-wider ${isDark ? 'opacity-40' : 'text-slate-500'}`}>Footwear Style</p>
                                                                                  <p className={`text-[11px] font-extrabold leading-tight break-words ${isDark ? 'text-white' : 'text-slate-900'}`}>{tips.shoes}</p>
                                                                              </div>
                                                                          </div>
                                                                      </div>
                                                                 );
                                                             })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    <button
                                        onClick={handleWearToday}
                                        disabled={isWorn || logging}
                                        className={`w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl group overflow-hidden relative ${
                                            isWorn 
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                                : 'bg-black text-white hover:scale-[1.02] active:scale-95'
                                        }`}
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {isWorn ? '🏆 STYLE LOGGED TODAY' : '✅ MARK AS WORN'}
                                        </span>
                                        {!isWorn && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* Actionable Advice Section (Moved here for better vertical flow) */}
                        <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'}`}>
                            <p className={`text-[9px] font-black uppercase tracking-widest mb-4 ${isDark ? 'opacity-40' : 'text-slate-500'}`}>DNA-Matched Suggestions</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {(() => {
                                    const rawGender = insights?.gender || profile?.gender || prefs?.gender || 'male';
                                    const isFemale = rawGender.toLowerCase().includes('female') || rawGender.toLowerCase() === 'women';
                                    const skinTone = insights?.skin_tone?.category || profile?.skin_tone?.category || profile?.skinTone || 'medium';
                                    return getActionableAdvice(insights?.best_colors || profile?.best_colors, isFemale ? 'female' : 'male', skinTone).map((adv, i) => {
                                        const hasInCloset = wardrobe.some(item => item.category === adv.category);
                                        return (
                                            <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-100 shadow-sm hover:border-purple-200'}`}>
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-white/5 shrink-0">
                                                    {getCategoryIcon(adv.category)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-[10px] font-black truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{adv.item}</p>
                                                    {hasInCloset && (
                                                        <p className="text-[8px] font-bold text-green-500 uppercase tracking-tighter">In Wardrobe ✓</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeView === 'shop' && (
                    <motion.div
                        key="shop"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {/* ── SECTION 3: STYLE GAPS (DISCOVERY GRID) ──────────────────────── */}
                        <div className={`rounded-[2.5rem] p-8 border relative overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 blur-[80px] pointer-events-none" />
                            <div className="flex items-center gap-4 mb-8 relative z-10">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white text-indigo-600 border border-indigo-100'}`}>🛍️</div>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Universal Shopping Hub</p>
                                    <h4 className={`text-xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>DNA Style Discovery</h4>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                                {(() => {
                                    const rawGender = insights?.gender || profile?.gender || prefs?.gender || 'male';
                                    const advisoryItems = getActionableAdvice(
                                        insights?.best_colors || 
                                        profile?.best_colors || 
                                        profile?.best_shirt_colors || 
                                        insights?.best_shirt_colors || 
                                        [], 
                                        rawGender.toLowerCase().includes('female') ? 'female' : 'male',
                                        insights?.skin_tone?.category || profile?.skin_tone?.category || profile?.skinTone || 'medium'
                                    );
                                    
                                    // Check for colors explicitly missing from wardrobe
                                    let missingGaps = advisoryItems.filter(adv => {
                                        const colorName = adv.color?.toLowerCase() || adv.item.split(' ')[0].toLowerCase();
                                        const hasInCloset = wardrobe.some(item => {
                                            const itemColors = item.outfit_data?.colors || [];
                                            return itemColors.some(c => c.name.toLowerCase().includes(colorName)) || 
                                                   (item.color_name && item.color_name.toLowerCase().includes(colorName)) ||
                                                   (item.hex && insights?.best_colors?.some(bc => bc.name.toLowerCase() === colorName && bc.hex === item.hex));
                                        });
                                        return !hasInCloset;
                                    });

                                    // FALLBACK: If optimization is 100%, show "Elite Upgrades" using all best colors
                                    const displayGaps = missingGaps.length > 0 ? missingGaps.slice(0, 4) : advisoryItems.slice(0, 4).map(a => ({ ...a, item: `Elite ${a.item}` }));

                                    return displayGaps.map((gap, idx) => {
                                        const colorName = gap.color || gap.item.split(' ')[0];
                                        const colorHex = gap.hex || (insights?.best_colors || profile?.best_colors || []).find(c => c.name === colorName)?.hex || '#888';
                                        const isElite = missingGaps.length === 0;

                                        return (
                                            <motion.div 
                                                key={idx}
                                                whileHover={{ y: -5 }}
                                                className={`p-5 rounded-[2.5rem] border group transition-all ${isDark ? 'bg-indigo-500/5 border-indigo-500/10 hover:border-indigo-500/30' : 'bg-white border-slate-100 hover:border-indigo-200 shadow-sm'}`}
                                            >
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-14 h-14 rounded-2xl border-4 border-white/10 shadow-xl flex-shrink-0" style={{ backgroundColor: colorHex }} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-black text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{gap.item}</p>
                                                        <p className="text-[10px] text-indigo-500 font-bold">{isElite ? '💎 Elite Upgrade' : `+ ${15 + (idx * 5)}% Synergy`}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => openShop(gap.item)}
                                                    className={`w-full py-3 rounded-xl text-[9px] font-black tracking-widest transition-all ${isDark ? 'bg-white text-indigo-900' : 'bg-indigo-600 text-white'}`}
                                                >
                                                    🔍 SHOP HUB
                                                </button>
                                            </motion.div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── STORE SELECTOR MODAL ──────────────────────── */}
            <AnimatePresence>
                {showShopSelector && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 backdrop-blur-2xl bg-black/60"
                        onClick={() => setShowShopSelector(false)}
                    >
                        <motion.div 
                            initial={{ y: 100, scale: 0.9 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 100, scale: 0.9 }}
                            className={`w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden ${isDark ? 'bg-[#0f1123] border border-white/10' : 'bg-white'}`}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="text-center mb-8 shrink-0">
                                <div className="w-14 h-1 bg-white/10 rounded-full mx-auto mb-6 sm:hidden" />
                                <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('shopOn') || 'Select Style Source'}</h3>
                                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">Shopping for: {activeShopItem}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-1 -mx-2 px-2 custom-scrollbar">
                                {[
                                    { id: 'myntra', name: 'Myntra', logo: '🎀', color: 'from-[#f13ab1] to-[#f87171]' },
                                    { id: 'amazon', name: 'Amazon', logo: '📦', color: 'from-[#ff9900] to-[#232f3e]' },
                                    { id: 'flipkart', name: 'Flipkart', logo: '🛒', color: 'from-[#2874f0] to-[#fb1]' },
                                    { id: 'meesho', name: 'Meesho', logo: '👗', color: 'from-[#ff44af] to-[#ff8c00]' }
                                ].map(store => (
                                    <button 
                                        key={store.id}
                                        onClick={() => handleShopRedirect(activeShopItem, store.id)}
                                        className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border transition-all hover:scale-[1.05] active:scale-95 ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-xl'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${store.color} flex items-center justify-center text-2xl shadow-lg`}>
                                            <span className="drop-shadow-sm">{store.logo}</span>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>{store.name}</span>
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={() => setShowShopSelector(false)}
                                className="w-full mt-8 py-4 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity shrink-0"
                            >
                                Cancel Discovery
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default StyleNavigator;
