import { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { usePlan } from '../context/PlanContext';
import { auth, db, loadProfile, logout, getHistory, getSavedColors, saveUserPreferences, loadUserPreferences, destroyUserAccount } from '../api/styleApi';
import { updateProfile } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { FashionIcons, IconRenderer } from './Icons';

export default function ProfilePanel() {
  const { theme, setTheme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const { isPro, usage, coins, plan } = usePlan();
  const { language, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();

  // State Management
  const [viewMode, setViewMode] = useState('main'); // main, edit
  const [activeTab, setActiveTab] = useState('overview'); 
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ analyses: 0, colors: 0, level: 1, xp: 0 });
  const [wardrobeStats, setWardrobeStats] = useState(null);
  
  // Preferences State
  const [userPrefs, setUserPrefs] = useState({ 
    height: 'regular', build: 'athletic', styleGoal: 'sophisticated', 
    lifestyle: 'other', gender: 'male', contrast: 'medium', persona: 'classic' 
  });

  // Edit State
  const [editData, setEditData] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);

  // Modal States
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [showDestroyModal, setShowDestroyModal] = useState(false);
  const [destroyConfirmText, setDestroyConfirmText] = useState('');
  const [destroying, setDestroying] = useState(false);

  const SUPPORT_EMAIL = 'styleguruai.in.gmail@gmail.com';

  const loadData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      setUser({
        name: currentUser.displayName || 'Anonymous User',
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        uid: currentUser.uid,
      });
      setEditData({ name: currentUser.displayName || '', email: currentUser.email });

      const [historyRes, colorsRes, prefsRes, dnaRes] = await Promise.all([
        getHistory(),
        getSavedColors(currentUser.uid),
        loadUserPreferences(currentUser.uid),
        loadProfile(currentUser.uid)
      ]);

      if (prefsRes) setUserPrefs(prev => ({ ...prev, ...prefsRes }));
      
      const historyCount = historyRes?.data?.total || 0;
      const savedColorsCount = colorsRes?.length || 0;
      const xp = (historyCount * 20) + (savedColorsCount * 10);
      
      setStats({
        analyses: historyCount,
        colors: savedColorsCount,
        xp,
        level: Math.floor(xp / 100) + 1
      });

      // DNA Logic
      const primaryProfile = JSON.parse(localStorage.getItem('sg_primary_profile') || 'null');
      if (primaryProfile) {
        setWardrobeStats({
          skinTone: primaryProfile.skin_tone?.category || primaryProfile.skinTone,
          undertone: primaryProfile.skin_tone?.undertone || primaryProfile.undertone,
          season: primaryProfile.skin_tone?.color_season || primaryProfile.season,
          skinHex: primaryProfile.skin_color?.hex || primaryProfile.skinHex || '#C68642',
          confidence: primaryProfile.skin_tone?.confidence || 'high'
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('sg_wardrobe_updated', loadData);
    return () => window.removeEventListener('sg_wardrobe_updated', loadData);
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: editData.name });
      setUser(prev => ({ ...prev, name: editData.name }));
      setViewMode('main');
    } catch (err) {
      alert('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDestroy = async () => {
    if (destroyConfirmText !== 'DELETE') return;
    setDestroying(true);
    try {
      await destroyUserAccount(user.uid);
      localStorage.clear();
      navigate('/');
    } catch (err) {
      alert('Destruction failed. Please re-login and try again.');
      setShowDestroyModal(false);
    } finally {
      setDestroying(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'StyleGuru AI',
      text: 'Check out ToneFit - My AI Style Companion for perfect outfit colors!',
      url: window.location.origin
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard!');
      }
    } catch (err) {}
  };

  const updatePref = async (key, val) => {
    const newPrefs = { ...userPrefs, [key]: val };
    setUserPrefs(newPrefs);
    await saveUserPreferences(user.uid, newPrefs);
    window.dispatchEvent(new CustomEvent('sg_wardrobe_updated'));
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20 min-h-[60vh]">
      <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 animate-fade-in">
      <AnimatePresence mode="wait">
        {viewMode === 'main' ? (
          <motion.div 
            key="main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* ── PROFILE HEADER ──────────────────────── */}
            <header className="flex items-center justify-between px-4">
               <h1 className="text-xl font-black uppercase tracking-widest text-white">{t('profileSetting')}</h1>
               <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs p-1.5"><IconRenderer icon={FashionIcons.User} /></div>
            </header>

            <div className={`p-6 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-3xl flex items-center gap-4`}>
               <div className="w-20 h-20 rounded-[1.8rem] bg-gradient-to-br from-purple-500 to-indigo-600 p-1">
                  <div className="w-full h-full rounded-[1.6rem] bg-slate-900 flex items-center justify-center text-2xl font-black text-white">
                    {user.name.charAt(0)}
                  </div>
               </div>
               <div className="flex-1">
                  <h2 className="text-xl font-black text-white">{user.name}</h2>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-tight">{user.email}</p>
               </div>
               <div className="flex flex-col items-center gap-1 opacity-40">
                  <span className="text-[8px] font-black uppercase tracking-tighter">Level {stats.level}</span>
                  <div className="w-10 h-1 bg-white/10 rounded-full overflow-hidden">
                     <div className="bg-purple-500 h-full" style={{ width: `${stats.xp % 100}%` }} />
                  </div>
               </div>
            </div>

            {/* ── USAGE LIMITS & PLAN ────────────────────────── */}
            <div className={`border rounded-[2.5rem] p-6 space-y-4 relative overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200 shadow-sm'}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 blur-[50px] -z-10 ${isDark ? 'bg-purple-500/10' : 'bg-purple-200/40'}`} />
                <div className="flex justify-between items-center mb-2">
                   <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Your Current Plan</p>
                   {isPro ? (
                       <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${isDark ? 'text-yellow-400 bg-yellow-400/10' : 'text-yellow-700 bg-yellow-100'}`}>🌟 PRO {plan === 'yearly' ? 'YEARLY' : 'MONTHLY'}</span>
                   ) : (
                       <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${isDark ? 'text-slate-400 bg-slate-400/20' : 'text-slate-600 bg-slate-200'}`}>⚪ Free Plan</span>
                   )}
                </div>

                {isPro ? (
                    <div className={`py-8 text-center border rounded-[1.5rem] shadow-inner ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-purple-100'}`}>
                        <div className={`w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-black text-xl shadow-lg ${isDark ? 'shadow-yellow-500/20' : 'shadow-amber-500/30'}`}>∞</div>
                        <p className={`text-xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Unlimited Access</p>
                        <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>AI Scans • Outfit Checks • No Ads</p>
                    </div>
                ) : (
                    <>
                       <div className="space-y-4">
                          {/* DNA Analysis Limit */}
                          <div className="space-y-1">
                             <div className="flex justify-between text-xs font-bold">
                                <span className={isDark ? 'text-white/80' : 'text-gray-700'}>DNA Analyses (Ad-Free)</span>
                                <span className={isDark ? 'text-white' : 'text-purple-600'}>{Math.max(0, 3 - (usage?.adFreeAnalysesLeft || 0))} / 3 Used</span>
                             </div>
                             <div className={`w-full rounded-full h-1.5 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}><div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${(Math.max(0, 3 - (usage?.adFreeAnalysesLeft || 0)) / 3) * 100}%` }}></div></div>
                          </div>
                          
                          {/* Outfit Checks Limit */}
                          <div className="space-y-1">
                             <div className="flex justify-between text-xs font-bold">
                                <span className={isDark ? 'text-white/80' : 'text-gray-700'}>Outfit Checks (Ad-Free)</span>
                                <span className={isDark ? 'text-white' : 'text-indigo-600'}>{Math.max(0, 3 - (usage?.adFreeOutfitChecks || 0))} / 3 Used</span>
                             </div>
                             <div className={`w-full rounded-full h-1.5 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}><div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(Math.max(0, 3 - (usage?.adFreeOutfitChecks || 0)) / 3) * 100}%` }}></div></div>
                          </div>

                          {/* History Saves */}
                          <div className="space-y-1">
                             <div className="flex justify-between text-xs font-bold">
                                <span className={isDark ? 'text-white/80' : 'text-gray-700'}>History Saved</span>
                                <span className={isDark ? 'text-white' : 'text-pink-600'}>{usage?.analysisHistoryCount || 0} / 5 Slots</span>
                             </div>
                             <div className={`w-full rounded-full h-1.5 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}><div className="bg-pink-500 h-1.5 rounded-full" style={{ width: `${((usage?.analysisHistoryCount || 0) / 5) * 100}%` }}></div></div>
                          </div>
                          
                          {/* Coin Balance */}
                          <div className={`pt-2 border-t ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                              <div className={`flex justify-between items-center p-3 rounded-xl border ${isDark ? 'bg-yellow-500/5 border-yellow-500/10' : 'bg-yellow-50 border-yellow-200 shadow-sm'}`}>
                                  <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${isDark ? 'text-yellow-500/70' : 'text-yellow-600'}`}>🪙 ToneFit Coins Balance:</span>
                                  <span className={`text-sm font-black ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>{coins} Coins</span>
                              </div>
                              <p className={`text-[8px] text-center mt-2 uppercase tracking-widest leading-relaxed ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                                 1 Coin = 1 AI Scan when free limits are exhausted. 
                              </p>
                          </div>
                       </div>

                       <button onClick={() => window.dispatchEvent(new CustomEvent('open_subscription_modal'))} className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all">
                          Unlock Unlimited Access
                       </button>
                    </>
                )}
            </div>


            {/* ── SECTIONS ────────────────────────── */}
            <div className="space-y-8">
               
               {/* ── GENERAL ────────────────────────── */}
               <section className="space-y-4">
                  <p className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{t('general')}</p>
                  <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-2 space-y-1">
                     <button onClick={() => setViewMode('edit')} className="w-full flex items-center justify-between p-5 rounded-2xl hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-4">
                           <span className="w-5 h-5 opacity-60"><IconRenderer icon={FashionIcons.User} /></span>
                           <span className="text-sm font-bold text-white/80">{t('editProfile')}</span>
                        </div>
                        <span className="text-white/20 group-hover:text-purple-500 transition-colors">→</span>
                     </button>

                     <button onClick={() => window.open(`mailto:${SUPPORT_EMAIL}`)} className="w-full flex items-center justify-between p-5 rounded-2xl hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-4">
                           <span className="w-5 h-5 opacity-60"><IconRenderer icon={FashionIcons.Formal} /></span>
                           <span className="text-sm font-bold text-white/80">{t('contactUs')}</span>
                        </div>
                        <span className="text-white/20 group-hover:text-purple-500 transition-colors">→</span>
                     </button>

                     <button onClick={() => window.open(`mailto:${SUPPORT_EMAIL}?subject=Error Report`)} className="w-full flex items-center justify-between p-5 rounded-2xl hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-4">
                           <span className="w-5 h-5 opacity-60"><IconRenderer icon={FashionIcons.Analysis} /></span>
                           <span className="text-sm font-bold text-white/80">{t('reportError')}</span>
                        </div>
                        <span className="text-white/20 group-hover:text-purple-500 transition-colors">→</span>
                     </button>

                     <button className="w-full flex items-center justify-between p-5 rounded-2xl hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-4">
                           <span className="w-5 h-5 opacity-60"><IconRenderer icon={FashionIcons.Accuracy} /></span>
                           <span className="text-sm font-bold text-white/80">{t('terms')}</span>
                        </div>
                        <span className="text-white/20 group-hover:text-indigo-500 transition-colors">→</span>
                     </button>
                  </div>
               </section>

               {/* ── COMMUNITY & SUPPORT ────────────────── */}
               <section className="space-y-4">
                  <p className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{t('community')}</p>
                  <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-2 space-y-1">
                     <button onClick={handleShare} className="w-full flex items-center justify-between p-5 rounded-2xl hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-4">
                           <span className="w-5 h-5 opacity-60"><IconRenderer icon={FashionIcons.Formal} /></span>
                           <span className="text-sm font-bold text-white/80">{t('shareApp')}</span>
                        </div>
                        <span className="text-white/20 group-hover:text-purple-500 transition-colors">→</span>
                     </button>
                     <button className="w-full flex items-center justify-between p-5 rounded-2xl hover:bg-white/5 transition-all group opacity-50 cursor-not-allowed">
                        <div className="flex items-center gap-4">
                           <span className="w-5 h-5 opacity-60"><IconRenderer icon={FashionIcons.Star} /></span>
                           <span className="text-sm font-bold text-white/80">{t('rateUs')}</span>
                        </div>
                     </button>
                     <button onClick={() => window.open(`mailto:${SUPPORT_EMAIL}?subject=Feature Request`)} className="w-full flex items-center justify-between p-5 rounded-2xl hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-4">
                           <span className="w-5 h-5 opacity-60"><IconRenderer icon={FashionIcons.AI} /></span>
                           <span className="text-sm font-bold text-white/80">{t('featureRequest')}</span>
                        </div>
                        <span className="text-white/20 group-hover:text-indigo-500 transition-colors">→</span>
                     </button>
                  </div>
               </section>

               {/* ── PREFERENCES (MY STYLE) ────────────────── */}
               <section className="space-y-4">
                  <p className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{t('preferences')}</p>
                  
                  {/* STYLE DNA BLUEPRINT (WORKING) */}
                  {wardrobeStats && (
                    <div className="px-2">
                       <button 
                         onClick={() => setShowBlueprint(true)}
                         className="w-full p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 text-left relative overflow-hidden group active:scale-[0.98] transition-all"
                       >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-[60px]" />
                          <div className="relative z-10 flex items-center justify-between">
                             <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-purple-400 mb-2">{t('blueprint')}</p>
                                <h3 className="text-2xl font-black text-white">{wardrobeStats.season} Master</h3>
                                <p className="text-[10px] font-bold text-white/40 mt-1 uppercase tracking-tight">{wardrobeStats.undertone} Undertone • {wardrobeStats.skinTone} Tone</p>
                             </div>
                             <div className="w-14 h-14 rounded-2xl bg-white shadow-2xl flex items-center justify-center p-3" style={{ backgroundColor: wardrobeStats.skinHex }}>
                                <IconRenderer icon={FashionIcons.AI} className="w-full h-full text-white/50" />
                             </div>
                          </div>
                       </button>
                    </div>
                  )}

                  <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-2 space-y-1">
                      <div className="p-5 flex items-center justify-between">
                         <div className="flex items-center gap-4 text-white/80">
                            <span className="w-5 h-5 opacity-60"><IconRenderer icon={FashionIcons.Formal} /></span>
                            <span className="text-sm font-bold">Language</span>
                         </div>
                         <div className="flex p-0.5 bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                            {[
                               { id: 'en', label: 'EN' },
                               { id: 'hi', label: 'HI' },
                               { id: 'hinglish', label: 'HIN' }
                            ].map(lang => (
                               <button 
                                 key={lang.id} 
                                 onClick={() => changeLanguage(lang.id)}
                                 className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${language === lang.id ? 'bg-purple-600 text-white' : 'text-white/30 hover:text-white/50'}`}
                               >
                                 {lang.label}
                               </button>
                            ))}
                         </div>
                     </div>

                     {/* LIFESTYLE SELECTOR */}
                     <div className="p-5 space-y-4 border-t border-white/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{t('lifestyle')}</p>
                        <div className="flex flex-wrap gap-2">
                           {[
                              { id: 'student', icon: FashionIcons.Star, label: t('student') },
                              { id: 'pro', icon: FashionIcons.Formal, label: t('corpPro') },
                              { id: 'creative', icon: FashionIcons.Camera, label: t('creativeFreelancer') },
                              { id: 'social', icon: FashionIcons.Star, label: t('socialCreator') },
                              { id: 'other', icon: FashionIcons.Bulb, label: t('lifestyle_other') }
                           ].map(item => (
                              <button
                                key={item.id}
                                onClick={() => updatePref('lifestyle', item.id)}
                                className={`px-4 py-3 rounded-2xl border transition-all flex items-center gap-2 ${
                                  userPrefs.lifestyle === item.id 
                                    ? 'bg-purple-600 border-transparent text-white shadow-lg' 
                                    : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'
                                }`}
                              >
                                <span className="w-4 h-4"><IconRenderer icon={item.icon} /></span>
                                <span className="text-[10px] font-black uppercase">{item.label}</span>
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* PHYSICAL SELECTORS (WORKING) */}
                     <div className="p-5 space-y-4 border-t border-white/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{t('physicalProfile')}</p>
                        <div className="grid grid-cols-2 gap-2">
                           {[
                              { key: 'height', options: [{id:'petite',i:'📐'},{id:'regular',i:'📏'},{id:'tall',i:'🚀'}], label: t('heightGroup') },
                              { key: 'build', options: [{id:'slim',i:'🧘'},{id:'athletic',i:'💪'},{id:'broad',i:'🏛'}], label: t('bodyBuild') }
                           ].map(section => (
                             <div key={section.key} className="space-y-3">
                                <p className="text-[8px] font-black uppercase text-white/20 tracking-tighter">{section.label}</p>
                                <div className="flex gap-1.5">
                                   {section.options.map(opt => (
                                     <button 
                                       key={opt.id} 
                                       onClick={() => updatePref(section.key, opt.id)}
                                       className={`flex-1 py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                                         userPrefs[section.key] === opt.id ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/5 text-white/20'
                                       }`}
                                     >
                                        <span className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity"><IconRenderer icon={opt.i} /></span>
                                        <span className="text-[7px] font-black uppercase">{opt.id}</span>
                                     </button>
                                   ))}
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </section>

               {/* ── DANGER ZONE ─────────────────────────── */}
               <section className="space-y-4">
                  <p className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-red-500/50">{t('dangerZone')}</p>
                  <div className="bg-red-500/5 border border-red-500/10 rounded-[2.5rem] p-2">
                     <button onClick={() => logout().then(() => navigate('/'))} className="w-full flex items-center justify-between p-5 rounded-2xl hover:bg-white/5 transition-all text-red-500 group">
                        <div className="flex items-center gap-4">
                           <span className="w-5 h-5"><IconRenderer icon={FashionIcons.Wardrobe} /></span>
                           <span className="text-sm font-bold">Sign Out</span>
                        </div>
                        <span className="opacity-40 group-hover:opacity-100 transition-opacity">→</span>
                     </button>
                     <button onClick={() => setShowDestroyModal(true)} className="w-full flex items-center justify-between p-5 rounded-2xl hover:bg-red-500/10 transition-all text-red-600 font-black uppercase text-[10px] tracking-widest">
                        <span>{t('destroyAccount')}</span>
                     </button>
                  </div>
               </section>

               <div className="text-center pt-4 opacity-20 text-[9px] font-black uppercase tracking-[0.4em] text-white">
                  ToneFit v4.1 PRO • AI-Engine Enabled
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="edit"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <header className="flex items-center gap-6 px-4">
               <button onClick={() => setViewMode('main')} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white p-4">
                  <IconRenderer icon={FashionIcons.Formal} />
               </button>
               <h1 className="text-xl font-black uppercase tracking-widest text-white">{t('editProfile')}</h1>
            </header>

            <div className="flex flex-col items-center gap-6 py-6">
               <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 p-1 relative">
                  <div className="w-full h-full rounded-[2.2rem] bg-slate-900 flex items-center justify-center text-4xl font-black text-white">
                     {user.name.charAt(0)}
                  </div>
                  <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-white border-4 border-slate-900 flex items-center justify-center p-2.5">
                     <IconRenderer icon={FashionIcons.Analysis} className="text-slate-900" />
                  </button>
               </div>
            </div>

            <div className="px-6 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">{t('name')}</label>
                   <input 
                     type="text" 
                     value={editData.name} 
                     onChange={e => setEditData({...editData, name: e.target.value})}
                     className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold focus:outline-none focus:border-purple-500 transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">{t('email')}</label>
                   <input 
                     type="text" 
                     value={editData.email} 
                     disabled
                     className="w-full p-5 rounded-2xl bg-white/5 border border-white/5 text-white/40 font-bold cursor-not-allowed"
                   />
                </div>

                <div className="pt-8">
                   <button 
                     onClick={handleSaveProfile}
                     disabled={saving}
                     className="w-full py-5 rounded-[2rem] bg-purple-600 text-white font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-purple-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                   >
                     {saving ? 'Syncing...' : 'Confirm Update'}
                   </button>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODALS ────────────────────────────────────── */}
      
      {/* 1. DNA BLUEPRINT MODAL */}
      <AnimatePresence>
        {showBlueprint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBlueprint(false)} className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} 
               animate={{ scale: 1, opacity: 1 }} 
               exit={{ scale: 0.9, opacity: 0 }} 
               className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[3rem] overflow-hidden relative z-10 p-8 shadow-2xl"
            >
               <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">{t('dnaTechnical')}</h2>
               <div className="space-y-6">
                  {[
                    { l: t('dnaItaTitle'), v: '41.2° (Type B)', d: 'Determines skin lightness level' },
                    { l: t('dnaUndertoneTitle'), v: wardrobeStats.undertone, d: 'Melanin distribution correlation' },
                    { l: t('dnaSeasonTitle'), v: wardrobeStats.season, d: 'Chromodynamic grouping' },
                    { l: t('dnaConfidenceTitle'), v: wardrobeStats.confidence, d: 'Algorithm precision rate' }
                  ].map((stat, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                       <div className="w-1.5 h-auto rounded-full bg-purple-500" />
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{stat.l}</p>
                          <p className="text-lg font-black text-white uppercase">{stat.v}</p>
                          <p className="text-[8px] font-bold text-white/20 mt-1 uppercase leading-none">{stat.d}</p>
                       </div>
                    </div>
                  ))}
               </div>
               <button onClick={() => setShowBlueprint(false)} className="w-full mt-8 py-4 px-6 rounded-2xl bg-white text-slate-900 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl">Close Blueprint</button>
            </motion.div>
          </div>
        )}

        {/* 2. DESTROY ACCOUNT MODAL */}
        {showDestroyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDestroyModal(false)} className="absolute inset-0 bg-red-950/80 backdrop-blur-md" />
            <motion.div 
               initial={{ scale: 0.9, y: 20 }} 
               animate={{ scale: 1, y: 0 }} 
               exit={{ scale: 0.9, y: 20 }} 
               className="bg-slate-900 border border-red-500/20 w-full max-w-md rounded-[3rem] overflow-hidden relative z-10 p-10 shadow-2xl text-center"
            >
               <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 text-3xl">⚠️</div>
               <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter text-red-500">{t('destroyAccount')}</h2>
               <p className="text-xs font-bold text-white/60 mb-8 px-4 leading-relaxed">{t('destroyDesc')}</p>
               
               <input 
                 type="text"
                 placeholder={t('typeDeleteToConfirm')}
                 value={destroyConfirmText}
                 onChange={e => setDestroyConfirmText(e.target.value)}
                 className="w-full p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 font-black uppercase text-center text-xs placeholder:text-red-500/30 focus:outline-none focus:border-red-500 transition-all mb-6"
               />

               <div className="flex gap-3">
                  <button onClick={() => setShowDestroyModal(false)} className="flex-1 py-4 px-6 rounded-2xl bg-white/5 text-white/40 font-black uppercase text-[10px] tracking-widest">Cancel</button>
                  <button 
                    onClick={handleDestroy}
                    disabled={destroyConfirmText !== 'DELETE' || destroying}
                    className="flex-2 py-4 px-8 rounded-2xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-600/20 disabled:opacity-20 transition-all"
                  >
                    {destroying ? 'Wiping...' : 'Destroy All'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
