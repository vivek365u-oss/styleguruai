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
    logDailyOutfit,
    getDailyOutfitLogs,
    loadUserPreferences 
} from '../api/styleApi';

const infoCls = "w-5 h-5 rounded-full flex items-center justify-center text-[10px] cursor-help transition-all";

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

                // Check if already worn today
                const today = new Date().toLocaleDateString('en-CA');
                if (logs.length > 0 && logs[0].date === today) {
                    setIsWorn(true);
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

    const getMatch = (colorName) => {
        if (!colorName || !wardrobe.length) return null;
        const low = colorName.toLowerCase();
        return wardrobe.find(item => {
            const outfitColors = item.outfit_data?.colors || [];
            // Match by hex or color name or category
            return outfitColors.some(c => c.name.toLowerCase().includes(low)) || 
                   (item.category && item.category.toLowerCase().includes(low)) ||
                   (item.hex && item.hex.toLowerCase() === low);
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
            {/* ── Section 1: Style DNA Card ──────────────────────── */}
            <div className={`relative overflow-hidden rounded-[2.5rem] p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-xl shadow-purple-900/5'}`}>
                <div className="absolute top-6 right-6 z-20">
                    <button 
                        onClick={handleTogglePrimary}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${
                            isPrimary 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : isDark ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                        }`}
                    >
                        <span>{isPrimary ? '🏠' : '🔓'}</span>
                        <span>{isPrimary ? (t('primaryProfileLocked') || 'Home Profile') : (t('setAsHomeTone') || 'Set as Home Tone')}</span>
                    </button>
                </div>

                <div className="relative z-10 flex items-center gap-5 pt-2">
                    <div
                        className="w-20 h-20 rounded-2xl border-4 border-white/20 shadow-2xl overflow-hidden"
                        style={{ backgroundColor: profile?.skinHex || profile?.skin_color?.hex || '#C68642' }}
                    />
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Style DNA</p>
                        </div>
                        <h3 className={`text-2xl font-black capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {profile?.skinTone || profile?.skin_tone?.category} {profile?.undertone || profile?.skin_tone?.undertone}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                             <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${isDark ? 'bg-white/5 border-white/10' : 'bg-purple-50 border-purple-100 text-purple-700'}`}>
                                {profile?.season || profile?.skin_tone?.color_season || 'Spring'} Edition
                             </span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3">
                    <div className={`p-4 rounded-3xl border relative ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100/50 border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-1">
                            <p className={`text-[10px] font-bold uppercase ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Overall Harmony</p>
                            <button onClick={() => setShowInfo(showInfo === 'harmony' ? null : 'harmony')} className={`${infoCls} ${isDark ? 'bg-white/10 text-white/40' : 'bg-slate-200 text-slate-500'}`}>?</button>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className={`text-2xl font-black ${isDark ? 'text-green-400' : 'text-green-600'}`}>{insights?.overall_harmony || 0}%</span>
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

            {/* ── Section 2: Daily Style Rotation (LIFESTYLE AWARE) ─────────── */}
            <AnimatePresence>
                {insights?.daily_suggestion && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`rounded-[2.5rem] p-7 border relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-purple-700/30' : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-lg shadow-purple-900/5'}`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[60px] pointer-events-none" />
                        
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                    {t(lifestyleKey)} Rotation
                                </p>
                                <h4 className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{insights.daily_suggestion.title}</h4>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl shadow-xl">✨</div>
                        </div>

                        <div className="grid grid-cols-2 gap-5 mb-8">
                            {[
                                { color: insights.daily_suggestion.top, label: 'Recommended Top', icon: '👕' },
                                { color: insights.daily_suggestion.bottom, label: 'Perfect Match', icon: '👖' }
                            ].map((slot, idx) => {
                                const match = getMatch(slot.color);
                                return (
                                    <div key={idx} className="space-y-3">
                                        <div className={`aspect-square rounded-[3rem] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 group ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white shadow-xl shadow-purple-900/5 border border-purple-100'}`}>
                                            {!match ? (
                                                <span className="text-4xl opacity-40 group-hover:scale-110 transition-transform">{slot.icon}</span>
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                                                     <div className="w-full h-full rounded-3xl overflow-hidden shadow-inner bg-slate-100 flex items-center justify-center">
                                                         {match.hex ? (
                                                             <div className="w-full h-full" style={{ backgroundColor: match.hex }} />
                                                         ) : (
                                                             <span className="text-4xl">{slot.icon}</span>
                                                         )}
                                                     </div>
                                                </div>
                                            )}
                                            
                                            {match && (
                                                <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
                                                     <span className="bg-green-500 text-[8px] font-black px-2 py-0.5 rounded-full text-white shadow-lg shadow-green-500/40 pulse-glow">CLOSET MATCH</span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className={`font-black text-xs line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                {match ? (match.category ? t(`cat_${match.category}`) : slot.color) : slot.color}
                                            </p>
                                            <p className="text-[9px] font-bold opacity-40 uppercase tracking-tighter">
                                                {match ? `Your ${t(`cat_${match.category}`) || 'Item'}` : slot.label}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button 
                            onClick={handleWearToday}
                            disabled={isWorn || logging}
                            className={`w-full py-4 rounded-2xl text-xs font-black shadow-xl transition-all flex items-center justify-center gap-3 ${
                                isWorn 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-white text-purple-900 hover:scale-[1.02] active:scale-95'
                            }`}
                        >
                            <span>{isWorn ? '🔥' : '🥋'}</span>
                            {logging ? 'LOGGING...' : isWorn ? t('alreadyWorn') : t('wearToday')}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Section 3: The Style Gap Assistant ─────────────── */}
            <div className={`rounded-[2.5rem] p-8 border relative overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 blur-[80px] pointer-events-none" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white text-indigo-600 border border-indigo-100'}`}>🧩</div>
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>The Style Gap</p>
                            <h4 className={`text-xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Complete Your DNA</h4>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {showInfo === 'gap' && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`mb-6 p-5 rounded-[2rem] text-[11px] font-medium leading-relaxed z-20 relative ${isDark ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                            {t('gapExplain')}
                        </motion.div>
                    )}
                </AnimatePresence>

                {insights?.missing_piece ? (
                    <div className={`p-6 rounded-[2.5rem] border border-dashed relative z-10 ${isDark ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-white border-indigo-200 shadow-sm'}`}>
                        <div className="flex items-center gap-5 mb-6">
                            <div className="w-16 h-16 rounded-[1.5rem] border-4 border-white/10 shadow-2xl flex-shrink-0" style={{ backgroundColor: insights.missing_piece.hex }} />
                            <div className="flex-1">
                                <p className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{insights.missing_piece.color_name} Essential</p>
                                <p className={`text-[11px] font-bold leading-tight mt-1 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{insights.missing_piece.impact}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => findOnMyntra(insights.missing_piece.color_name)}
                                className={`py-4 rounded-2xl text-[10px] font-black tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 ${isDark ? 'bg-white text-indigo-900' : 'bg-indigo-600 text-white shadow-indigo-900/10'}`}
                            >
                                🔍 SHOP GAP
                            </button>
                            
                            <button 
                                onClick={onAnalyze}
                                className={`py-4 rounded-2xl text-[10px] font-black border transition-all uppercase tracking-widest ${isDark ? 'border-white/10 text-white/40 hover:bg-white/5' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                            >
                                {t('syncMore')} 📸
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="py-12 text-center bg-white/5 rounded-[2.5rem] border border-white/10 border-dashed">
                         <span className="text-4xl mb-3 block">✨</span>
                         <p className="text-sm font-black text-white/60 tracking-tight uppercase">Wardrobe Optimization: 100%</p>
                         <p className="text-[10px] mt-1 opacity-20 font-bold uppercase tracking-widest text-white">No Style Gaps Detected</p>
                    </div>
                )}
            </div>

            {/* ── Section 4: Tips Card ─────────────── */}
            <div className={`rounded-3xl p-5 border ${isDark ? 'bg-gradient-to-r from-teal-900/20 to-blue-900/20 border-teal-700/20' : 'bg-teal-50 border-teal-100 shadow-sm'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white text-lg">💡</div>
                    <div className="flex-1">
                        <p className={`text-[11px] font-black uppercase tracking-tight mb-0.5 ${isDark ? 'text-teal-400' : 'text-teal-700'}`}>Personalized Hack</p>
                        <p className={`text-[10px] leading-tight ${isDark ? 'text-white/60' : 'text-teal-800/70'}`}>
                            Save at least 5 items in different colors to unlock the **Style Master** badge and perfect your harmony score.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default StyleNavigator;
