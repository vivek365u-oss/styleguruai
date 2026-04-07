import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { auth, getStyleInsights, getWardrobe, loadPrimaryProfile, savePrimaryProfile } from '../api/styleApi';

const infoCls = "w-5 h-5 rounded-full flex items-center justify-center text-[10px] cursor-help transition-all";

const StyleNavigator = ({ user, onAnalyze }) => {
    const { theme } = useContext(ThemeContext);
    const { t, language } = useLanguage();
    const isDark = theme === 'dark';

    const [loading, setLoading] = useState(true);
    const [insights, setInsights] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isPrimary, setIsPrimary] = useState(false);
    const [error, setError] = useState(null);
    const [showInfo, setShowInfo] = useState(null); // 'harmony' | 'gap' | null

    useEffect(() => {
        const loadInitialData = async () => {
            if (!auth.currentUser) {
                setLoading(false);
                return;
            }

            try {
                // Check for Primary Profile first (Locked Home Tone)
                const uid = auth.currentUser.uid;
                const primary = await loadPrimaryProfile(uid);
                
                let activeProfile = primary;
                if (primary) {
                    setIsPrimary(true);
                } else {
                    // Fallback to most recent analysis
                    activeProfile = JSON.parse(localStorage.getItem('sg_last_analysis') || 'null');
                    setIsPrimary(false);
                }

                if (!activeProfile) {
                    setLoading(false);
                    return;
                }
                setProfile(activeProfile);

                const wardrobe = await getWardrobe(uid);
                const data = await getStyleInsights(
                    activeProfile.skinTone,
                    activeProfile.undertone,
                    wardrobe,
                    language
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
    }, [language]);

    const handleTogglePrimary = async () => {
        if (!auth.currentUser || !profile) return;
        try {
            if (isPrimary) {
                // Unlock logic (delete from firestore if needed, but for now we just toggle local)
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
        const query = `${color} shirt for men`; // Simple query logic
        window.open(`https://www.myntra.com/${query.replace(/ /g, '-')}`, '_blank');
    };

    if (!auth.currentUser) {
        return (
            <div className="text-center py-20">
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
            <div className="text-center py-20 px-4">
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
            <div className="space-y-6 pt-4">
                <div className={`h-48 rounded-3xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} />
                <div className={`h-64 rounded-3xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} />
                <div className={`h-40 rounded-3xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pt-2 pb-10"
        >
            {/* ── Section 1: Style DNA Card ──────────────────────── */}
            <div className={`relative overflow-hidden rounded-[2.5rem] p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-xl shadow-purple-900/5'}`}>
                <div className="relative z-10 flex items-center gap-5">
                    <div
                        className="w-20 h-20 rounded-2xl border-4 border-white/20 shadow-2xl relative group overflow-hidden"
                        style={{ backgroundColor: profile?.skinHex || '#C68642' }}
                    >
                         <button 
                            onClick={handleTogglePrimary}
                            className={`absolute inset-0 flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all ${isPrimary ? 'bg-green-500/20' : 'bg-black/40'}`}
                            title={isPrimary ? "Locked as Home Tone" : "Click to Lock as Home"}
                         >
                            <span className="text-2xl">{isPrimary ? '🏠' : '🔒'}</span>
                         </button>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Style DNA</p>
                            {isPrimary && <span className="bg-green-500 w-1.5 h-1.5 rounded-full animate-pulse" title="Locked as Primary" />}
                        </div>
                        <h3 className={`text-2xl font-black capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile?.skinTone} {profile?.undertone}</h3>
                        <div className="flex items-center gap-2 mt-1">
                             <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${isDark ? 'bg-white/5 border-white/10' : 'bg-purple-50 border-purple-100 text-purple-700'}`}>
                                {profile?.season || 'Spring'} Edition
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
                            <span className={`text-2xl font-black ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>+{insights?.stats?.total_items || 0}</span>
                            <button onClick={onAnalyze} className={`ml-auto text-[9px] font-black px-2 py-1 rounded-lg ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>SYNC 📸</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Section 2: Daily Style Rotation ─────────── */}
            <AnimatePresence>
                {insights?.daily_suggestion && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`rounded-[2.5rem] p-6 border ${isDark ? 'bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-purple-700/30' : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>Today's Power Combo</p>
                                <h4 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{insights.daily_suggestion.title}</h4>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl">✨</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className={`w-full aspect-square rounded-2xl flex items-center justify-center text-3xl mb-2 ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>👕</div>
                                <p className={`font-bold text-[11px] truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{insights.daily_suggestion.top}</p>
                            </div>
                            {insights.daily_suggestion.bottom && (
                                <div className="space-y-1">
                                    <div className={`w-full aspect-square rounded-2xl flex items-center justify-center text-3xl mb-2 ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>👖</div>
                                    <p className={`font-bold text-[11px] truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{insights.daily_suggestion.bottom}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Section 3: The Style Gap Assistant ─────────────── */}
            <div className={`rounded-[2.5rem] p-6 border relative ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🧩</span>
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>The Style Gap</p>
                            <h4 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Complete Your Collection</h4>
                        </div>
                    </div>
                    <button onClick={() => setShowInfo(showInfo === 'gap' ? null : 'gap')} className={`${infoCls} ${isDark ? 'bg-white/10 text-white/40' : 'bg-slate-200 text-slate-500'}`}>?</button>
                </div>

                <AnimatePresence>
                    {showInfo === 'gap' && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`mb-4 p-4 rounded-3xl text-[11px] font-medium leading-relaxed ${isDark ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                            {t('gapExplain')}
                        </motion.div>
                    )}
                </AnimatePresence>

                {insights?.missing_piece ? (
                    <div className={`p-5 rounded-3xl border border-dashed ${isDark ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl border border-white/20 shadow-lg" style={{ backgroundColor: insights.missing_piece.hex }} />
                            <div className="flex-1">
                                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{insights.missing_piece.color_name} Base</p>
                                <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{insights.missing_piece.impact}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <button 
                                onClick={() => findOnMyntra(insights.missing_piece.color_name)}
                                className={`w-full py-3 rounded-xl text-[10px] font-black shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 ${isDark ? 'bg-white text-indigo-900' : 'bg-white text-indigo-600 border border-indigo-100'}`}
                            >
                                🔍 Find on Myntra
                            </button>
                            
                            <button 
                                onClick={onAnalyze}
                                className={`w-full py-3 rounded-xl text-[10px] font-black border transition-all ${isDark ? 'border-white/10 text-white/40 hover:bg-white/5' : 'border-slate-200 text-slate-400 hover:bg-slate-100'}`}
                            >
                                {t('syncMore')} 📸
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="py-8 text-center bg-white/5 rounded-3xl border border-white/10">
                         <span className="text-3xl mb-2 block">🌟</span>
                         <p className="text-sm font-bold text-white/60">Your core wardrobe is perfectly balanced!</p>
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
