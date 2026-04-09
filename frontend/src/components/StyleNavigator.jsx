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

    const findOnMyntra = (color) => {
        const gender = profile?.gender || 'men';
        const query = `${color} outfit for ${gender}`; 
        window.open(`https://www.myntra.com/${query.replace(/ /g, '-')}`, '_blank');
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
                                    <p className={`text-[9px] font-black uppercase opacity-40`}>Actionable DNA Recommendations</p>
                                    <div className="flex flex-wrap gap-2">
                                        {getActionableAdvice(insights?.best_colors || profile?.best_colors, profile?.gender || 'female').map((adv, i) => {
                                            const hasInCloset = wardrobe.some(item => item.category === adv.category);
                                            return (
                                                <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
                                                    <span>{getCategoryIcon(adv.category)}</span>
                                                    <span>{adv.item}</span>
                                                    {hasInCloset ? (
                                                        <span className="text-green-500 font-black">✓</span>
                                                    ) : (
                                                        <span className="text-orange-500 flex items-center gap-1">🚧 <span className="text-[8px] animate-pulse">+20 pts</span></span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3">
                    <div className={`p-4 rounded-3xl border relative ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100/50 border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-1">
                            <p className={`text-[10px] font-bold uppercase ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Overall Harmony</p>
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
                        <p className={`text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Items Synced</p>
                        <div className="flex items-end gap-2">
                            <span className={`text-2xl font-black ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>+{wardrobe.length || 0}</span>
                            <button onClick={onAnalyze} className={`ml-auto text-[9px] font-black px-2 py-1 rounded-lg ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>SYNC 📸</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SECTION 2: MOOD & ENGINE ──────────────────────── */}
            <div className="space-y-4">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-white/40' : 'text-slate-500/60'}`}>Current Styling Intent</p>
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { id: 'mood_comfort', label: 'Comfort' },
                        { id: 'mood_confidence', label: 'Confidence' },
                        { id: 'mood_minimal', label: 'Minimal' },
                        { id: 'mood_attention', label: 'Attention' }
                    ].map(m => (
                        <button
                            key={m.id}
                            onClick={() => setMood(m.id)}
                            className={`py-3.5 rounded-2xl border text-[10px] font-black uppercase transition-all ${
                                mood === m.id 
                                    ? 'bg-purple-600 border-transparent text-white shadow-xl shadow-purple-900/40' 
                                    : isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-white border-gray-200 text-slate-400 hover:bg-gray-50'
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
                         <div className="flex gap-1.5 mr-4">
                              <button 
                                onClick={() => handleFeedback('like')}
                                className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs transition-all ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                              >
                                👍
                              </button>
                              <button 
                                onClick={() => handleFeedback('dislike')}
                                className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs transition-all ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                              >
                                👎
                              </button>
                         </div>
                         <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">✨</div>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full border tracking-widest ${isDark ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-600'}`}>
                               AI ENGINE MATCH
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
                                                 <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg animate-pulse">MISSING</span>
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
                                                 <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg animate-pulse">MISSING</span>
                                            )}
                                            {isWorn && <div className="absolute inset-0 bg-green-500/40 rounded-xl flex items-center justify-center text-white text-xl">✓</div>}
                                        </div>
                                        <div>
                                            <p className={`text-[10px] font-black uppercase truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{insights.daily_suggestion.bottom}</p>
                                            <p className="text-[9px] font-bold opacity-30 mt-0.5">{match ? (match.color_name || 'Matched') : '🚧 Score Boost Available'}</p>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Finishing Touches Section */}
                        <div className={`mb-8 p-4 rounded-3xl border border-dashed ${isDark ? 'bg-white/5 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
                             <p className="text-[9px] font-black uppercase opacity-40 mb-3 tracking-widest">Finishing Touches</p>
                             {(() => {
                                 const tips = getAccessoryAdvice(profile?.gender || 'female', profile?.season || 'Spring');
                                 return (
                                     <div className="grid grid-cols-2 gap-4">
                                         <div className="flex gap-2 items-center">
                                             <span className="text-xl">💍</span>
                                             <div>
                                                 <p className="text-[9px] font-black uppercase opacity-60">Jewelry</p>
                                                 <p className="text-[10px] font-bold">{tips.jewelry}</p>
                                             </div>
                                         </div>
                                         <div className="flex gap-2 items-center">
                                             <span className="text-xl">👞</span>
                                             <div>
                                                 <p className="text-[9px] font-black uppercase opacity-60">Shoes</p>
                                                 <p className="text-[10px] font-bold">{tips.shoes}</p>
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

            {/* ── SECTION 3: STYLE GAP ──────────────────────── */}
            <div className={`rounded-[2.5rem] p-8 border relative overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 blur-[80px] pointer-events-none" />
                <div className="flex items-center gap-4 mb-8">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white text-indigo-600 border border-indigo-100'}`}>🧩</div>
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>The Style Gap</p>
                        <h4 className={`text-xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Unlock Elite Harmony</h4>
                    </div>
                    <div className="ml-auto text-right">
                         <p className="text-[10px] font-black text-indigo-500 animate-pulse">POTENTIAL BOOST</p>
                         <p className="text-xl font-black">+25%</p>
                    </div>
                </div>

                {insights?.missing_piece ? (
                    <div className={`p-6 rounded-[2.5rem] border border-dashed relative z-10 ${isDark ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-white border-indigo-200 shadow-sm'}`}>
                        <div className="flex items-center gap-5 mb-6">
                            <div className="w-16 h-16 rounded-[1.5rem] border-4 border-white/10 shadow-2xl flex-shrink-0" style={{ backgroundColor: insights.missing_piece.hex }} />
                            <div className="flex-1">
                                <p className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{insights.missing_piece.color_name} {profile?.gender === 'female' ? 'Ethnic Wear' : 'Formal Wear'}</p>
                                <p className={`text-[11px] font-bold leading-tight mt-1 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{insights.missing_piece.impact}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 mb-4">
                             <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 text-[9px] font-black rounded-full border border-indigo-500/20 uppercase">Must Add</span>
                             <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[9px] font-black rounded-full border border-green-500/20 uppercase">DNA Match</span>
                        </div>
                        <button 
                            onClick={() => findOnMyntra(insights.missing_piece.color_name)}
                            className={`w-full py-4 rounded-2xl text-[10px] font-black tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all ${isDark ? 'bg-white text-indigo-900 font-black' : 'bg-indigo-600 text-white shadow-indigo-900/10'}`}
                        >
                            🔍 SHOP STYLE GAP
                        </button>
                    </div>
                ) : (
                    <div className={`py-12 text-center rounded-[2.5rem] border border-dashed ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                         <span className="text-4xl mb-3 block">✨</span>
                         <p className={`text-sm font-black tracking-tight uppercase ${isDark ? 'text-white/60' : 'text-slate-400'}`}>Wardrobe Optimization: 100%</p>
                    </div>
                )}
            </div>

            {/* TIPS CARD */}
            <div className={`rounded-3xl p-5 border ${isDark ? 'bg-gradient-to-r from-teal-900/20 to-blue-900/20 border-teal-700/20' : 'bg-teal-50 border-teal-100 shadow-sm'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white text-lg">💡</div>
                    <div className="flex-1">
                        <p className={`text-[11px] font-black uppercase tracking-tight mb-0.5 ${isDark ? 'text-teal-400' : 'text-teal-700'}`}>Personalized Hack</p>
                        <p className={`text-[10px] leading-tight ${isDark ? 'text-white/60' : 'text-teal-900/70'}`}>
                            {t('smartLogicNote') || 'Smart logic se colors tumhari skin tone se perfectly match honge.'}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default StyleNavigator;
