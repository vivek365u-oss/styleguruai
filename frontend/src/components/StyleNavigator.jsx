import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { auth, getStyleInsights, getWardrobe } from '../api/styleApi';

const StyleNavigator = ({ user, onAnalyze }) => {
    const { theme } = useContext(ThemeContext);
    const { t, language } = useLanguage();
    const isDark = theme === 'dark';

    const [loading, setLoading] = useState(true);
    const [insights, setInsights] = useState(null);
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadInitialData = async () => {
            if (!auth.currentUser) {
                setLoading(false);
                return;
            }

            try {
                // 1. Get profile for skin tone & undertone
                const lastAnalysis = JSON.parse(localStorage.getItem('sg_last_analysis') || 'null');
                if (!lastAnalysis) {
                    setLoading(false);
                    return;
                }
                setProfile(lastAnalysis);

                // 2. Get Wardrobe items
                const wardrobe = await getWardrobe(auth.currentUser.uid);

                // 3. Get AI Insights from backend
                const data = await getStyleInsights(
                    lastAnalysis.skinTone,
                    lastAnalysis.undertone,
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

    if (!auth.currentUser) {
        return (
            <div className="text-center py-20">
                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl text-purple-400">🔐</span>
                </div>
                <h2 className={`text-2xl font-black mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Login Required</h2>
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
                <h2 className={`text-2xl font-black mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Start Your Journey</h2>
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
                <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4">
                    <div className="w-32 h-32 rounded-full blur-3xl bg-purple-500" />
                </div>

                <div className="relative z-10 flex items-center gap-5">
                    <div
                        className="w-20 h-20 rounded-2xl border-4 border-white/20 shadow-2xl"
                        style={{ backgroundColor: profile?.skinHex || '#C68642' }}
                    />
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Style DNA</p>
                        <h3 className={`text-2xl font-black capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile?.skinTone} {profile?.undertone}</h3>
                        <div className="flex items-center gap-2 mt-2">
                             <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-purple-50 border-purple-100 text-purple-700'}`}>
                                {profile?.season || 'Spring'} Edition
                             </span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3">
                    <div className={`p-4 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100/50 border-slate-200'}`}>
                        <p className={`text-[10px] font-bold uppercase ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Overall Harmony</p>
                        <div className="flex items-end gap-2 mt-1">
                            <span className={`text-2xl font-black ${isDark ? 'text-green-400' : 'text-green-600'}`}>{insights?.overall_harmony || 0}%</span>
                            <span className={`text-[9px] mb-1.5 ${isDark ? 'text-white/20' : 'text-slate-400'}`}>Perfected</span>
                        </div>
                    </div>
                    <div className={`p-4 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100/50 border-slate-200'}`}>
                        <p className={`text-[10px] font-bold uppercase ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Style Streak</p>
                        <div className="flex items-end gap-2 mt-1">
                            <span className={`text-2xl font-black ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>+{insights?.stats?.total_items || 0}</span>
                            <span className={`text-[9px] mb-1.5 ${isDark ? 'text-white/20' : 'text-slate-400'}`}>Items Synced</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Section 2: Daily Style Rotation (OOTD) ─────────── */}
            <AnimatePresence>
                {insights?.daily_suggestion && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`rounded-[2.5rem] p-6 border ${isDark ? 'bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-purple-700/30' : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'}`}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>Today's Power Combo</p>
                                <h4 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{insights.daily_suggestion.title}</h4>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl">
                                ✨
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>👕</div>
                                <div className="flex-1">
                                    <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{insights.daily_suggestion.top}</p>
                                    <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Optimal match for your tone</p>
                                </div>
                            </div>
                            {insights.daily_suggestion.bottom && (
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>👖</div>
                                    <div className="flex-1">
                                        <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{insights.daily_suggestion.bottom}</p>
                                        <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-slate-500'}`}>High contrast harmony</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-purple-400">Harmony Score</span>
                                <span className={`text-xs p-1 px-2 rounded-lg font-black ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                                    {insights.daily_suggestion.score}%
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-white/30 italic">Highly Recommended</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Section 3: The Style Gap Assistant ─────────────── */}
            <div className={`rounded-[2.5rem] p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">🧩</span>
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>The Style Gap</p>
                        <h4 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Complete Your Collection</h4>
                    </div>
                </div>

                {insights?.missing_piece ? (
                    <div className={`p-5 rounded-3xl border border-dashed ${isDark ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                        <div className="flex items-center gap-4 mb-4">
                            <div
                                className="w-12 h-12 rounded-xl border border-white/20 shadow-lg"
                                style={{ backgroundColor: insights.missing_piece.hex }}
                            />
                            <div>
                                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{insights.missing_piece.color_name} Base</p>
                                <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{insights.missing_piece.impact}</p>
                            </div>
                        </div>
                        <p className={`text-xs italic leading-relaxed mb-6 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                             "{insights.missing_piece.reason}"
                        </p>
                        <button className="w-full py-3 bg-white text-indigo-600 rounded-xl text-xs font-black shadow-lg hover:scale-[1.02] transition-all">
                            Find Match on Myntra →
                        </button>
                    </div>
                ) : (
                    <div className="py-8 text-center bg-white/5 rounded-3xl border border-white/10">
                         <span className="text-3xl mb-2 block">🌟</span>
                         <p className="text-sm font-bold text-white/60">Your core wardrobe is perfectly balanced!</p>
                    </div>
                )}
            </div>

            {/* ── Section 4: Budget Guide (Placeholder Context) ──── */}
            <div className={`rounded-3xl p-5 border ${isDark ? 'bg-gradient-to-r from-teal-900/20 to-blue-900/20 border-teal-700/20' : 'bg-teal-50 border-teal-100'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white text-lg">💡</div>
                    <div className="flex-1">
                        <p className={`text-sm font-bold ${isDark ? 'text-teal-400' : 'text-teal-700'}`}>Style Tip: Layering Season</p>
                        <p className={`text-[10px] leading-tight ${isDark ? 'text-white/50' : 'text-teal-600/70'}`}>
                            Students: Add a denim jacket to your {insights?.daily_suggestion?.top || 'tops'} for an instant high-end college look.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default StyleNavigator;
