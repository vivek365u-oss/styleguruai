import { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { usePlan } from '../context/PlanContext';
import { auth, loadProfile, logout, getHistory, getSavedColors, saveUserPreferences, loadUserPreferences } from '../api/styleApi';
import { updateProfile, deleteUser } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export default function ProfilePanel({ hideHeader = false }) {
  const { theme, setTheme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const { isPro, usage, validUntil } = usePlan();
  const { language, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); // overview, wardrobe, preferences, support
  const [userPrefs, setUserPrefs] = useState({ 
    height: 'regular', 
    build: 'athletic', 
    fit: 'regular', 
    aesthetic: 'casual',
    styleGoal: 'sophisticated',
    contrast: 'medium',
    persona: 'classic'
  });
  const [stats, setStats] = useState({ analyses: 0, colors: 0, score: 0, level: 1, xp: 0 });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [wardrobeStats, setWardrobeStats] = useState(null);
  const [dnaInsights, setDnaInsights] = useState(null);
  const [showBlueprint, setShowBlueprint] = useState(false);

  // Notification State
  const [notifStatus, setNotifStatus] = useState(() => {
    if (typeof Notification === 'undefined' || !('PushManager' in window)) return 'unsupported';
    return Notification.permission;
  });
  const [subId, setSubId] = useState(() => localStorage.getItem('sg_push_sub_id') || null);

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
      setEditName(currentUser.displayName || '');

      // Fetch real-time metrics & preferences
      const { loadStyleInsights } = await import('../api/styleApi');
      const [profile, historyRes, colorsRes, prefsRes, dnaRes] = await Promise.all([
        loadProfile(currentUser.uid),
        getHistory(),
        getSavedColors(currentUser.uid),
        loadUserPreferences(currentUser.uid),
        loadStyleInsights(currentUser.uid)
      ]);

      if (prefsRes) setUserPrefs(prev => ({ ...prev, ...prefsRes }));
      if (dnaRes) setDnaInsights(dnaRes);

      const historyCount = historyRes?.data?.total || 0;
      const savedColorsCount = colorsRes?.length || 0;
      
      // Priority logic: Use Locked Insights as the Hero data
      const activeProfile = dnaRes || JSON.parse(localStorage.getItem('sg_primary_profile') || 'null');

      let calculatedScore = 0;
      let xp = (historyCount * 20) + (savedColorsCount * 10);
      let level = Math.floor(xp / 100) + 1;
      
      if (activeProfile) {
        setWardrobeStats({
          skinTone: activeProfile.skin_tone?.category || activeProfile.skinTone,
          undertone: activeProfile.skin_tone?.undertone || activeProfile.undertone,
          season: activeProfile.skin_tone?.color_season || activeProfile.season,
          skinHex: activeProfile.skin_color?.hex || activeProfile.skinHex || '#C68642',
          date: activeProfile.saved_at || activeProfile.locked_at || new Date().toISOString(),
          confidence: activeProfile.skin_tone?.confidence || 'high'
        });
        calculatedScore = activeProfile.skin_tone?.confidence === 'high' ? 95 : 85;
      } else {
        setWardrobeStats(null);
      }

      setStats({
        analyses: historyCount,
        colors: savedColorsCount,
        score: calculatedScore || 0,
        xp,
        level
      });

    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Sync listener
    window.addEventListener('sg_wardrobe_updated', loadData);
    return () => window.removeEventListener('sg_wardrobe_updated', loadData);
  }, []);

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: editName.trim(),
      });
      setUser(prev => ({ ...prev, name: editName.trim() }));
      setEditing(false);
    } catch (err) {
      console.error('Error updating name:', err);
      alert('Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeToggle = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('tonefit_theme', newTheme);
  };

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
  };

  // Push Notification Logic
  const requestNotification = async () => {
    if (typeof Notification === 'undefined') {
      alert("This browser doesn't support notifications.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotifStatus(permission);
      if (permission !== 'granted') return;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY || undefined,
      });
      const subJson = sub.toJSON();

      const { savePushSubscription } = await import('../api/styleApi');
      const uid = auth.currentUser?.uid;
      if (uid) {
        const id = await savePushSubscription(uid, subJson, wardrobeStats?.skinTone || '', wardrobeStats?.season || '');
        if (id) {
          setSubId(id);
          localStorage.setItem('sg_push_sub_id', id);
        }
      }
      localStorage.setItem('sg_notif', 'granted');
    } catch (e) {
      console.error('Notification error:', e);
    }
  };

  const disableNotification = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
      if (subId && auth.currentUser?.uid) {
        const { deletePushSubscription } = await import('../api/styleApi');
        await deletePushSubscription(auth.currentUser.uid, subId);
      }
      setSubId(null);
      localStorage.removeItem('sg_push_sub_id');
      localStorage.removeItem('sg_notif');
      setNotifStatus('default');
    } catch (e) {
      console.error('Disable notification error:', e);
    }
  };

  const handleDownloadData = () => {
    const userData = {
      user,
      usage,
      wardrobeStats,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `styleguru-data-${user?.uid}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSupportEmail = (type) => {
    const email = 'styleguruai.in@gmail.com';
    let subject = 'Support Request - StyleGuru AI';
    let body = '';

    if (type === 'help') {
      subject = 'Help & FAQ - StyleGuru AI';
      body = `Hi StyleGuru Team,\n\nI have a question about StyleGuru:\n\n[Please describe your question here]\n\n---\nUser Email: ${user?.email}\nID: ${user?.uid}`;
    } else if (type === 'issue') {
      subject = 'Report Issue - StyleGuru AI';
      body = `Hi StyleGuru Team,\n\nI'm reporting an issue:\n\nProblem Description:\n[Please describe the issue here]\n\nSteps to Reproduce:\n[How can we repeat this issue?]\n\n---\nUser Email: ${user?.email}\nDevice: ${navigator.userAgent}`;
    } else if (type === 'feature') {
      subject = 'Feature Request - StyleGuru AI';
      body = `Hi StyleGuru Team,\n\nI would like to request a new feature:\n\nFeature Description:\n[What feature would you like to see?]\n\n---\nUser Email: ${user?.email}`;
    }

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleShare = async () => {
    const shareData = {
      title: 'StyleGuru AI',
      text: 'Check out ToneFit AI - identify your perfect colors based on your skin tone!',
      url: window.location.origin,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      alert('Link copied to clipboard!');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('WARNING: This will permanently delete your account and all data. Are you sure?')) {
      try {
        await deleteUser(auth.currentUser);
        localStorage.clear();
        navigate('/');
      } catch (err) {
        console.error('Delete account failed', err);
        alert('Please log out and log in again to delete your account (security requirement).');
      }
    }
  };

  const handleUpdatePreference = async (key, value) => {
    const newPrefs = { ...userPrefs, [key]: value };
    setUserPrefs(newPrefs);
    if (user?.uid) {
      await saveUserPreferences(user.uid, newPrefs);
    }
  };

  const cardCls = isDark 
    ? 'bg-[#0f1123]/80 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]' 
    : 'bg-white/90 backdrop-blur-xl border border-purple-500/10 shadow-[0_8px_32px_rgba(31,38,135,0.07)]';
    
  const labelCls = isDark ? 'text-white/40' : 'text-purple-950/80';
  const headingCls = isDark ? 'text-white' : 'text-slate-900';
  const accentCls = 'text-purple-500';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full shadow-lg" />
      </div>
    );
  }

  const TABS = [
    { id: 'overview', label: 'Overview', icon: '✨' },
    { id: 'preferences', label: 'My Style', icon: '🎨' },
    { id: 'support', label: 'Support', icon: '👋' }
  ];

  return (
    <div className={`space-y-6 ${hideHeader ? 'pb-24' : ''} animate-fade-in`}>
      
      {/* ── PROFILE HEADER ─────────────────────────────────────────── */}
      <div className={`rounded-[2.5rem] p-8 border overflow-hidden relative group ${cardCls} bg-gradient-to-br transition-all duration-500 ${isDark ? 'from-purple-900/40 to-slate-900/40' : 'from-purple-50 to-white'}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10 text-center md:text-left">
          <div className="relative">
            <div className="w-28 h-28 flex-shrink-0 rounded-[2rem] bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-1.5 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-[1.8rem] object-cover border-4 border-white/10" />
              ) : (
                <div className="w-full h-full rounded-[1.8rem] flex items-center justify-center text-4xl font-black text-white bg-[#0f1123]">
                   {user?.name?.charAt(0)}
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-tighter">
              Level {stats.level}
            </div>
            {/* XP PROGRESS BAR */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
               <div className="h-full bg-yellow-400 transition-all duration-1000" style={{ width: '65%' }} />
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            {editing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full max-w-sm px-6 py-3 rounded-2xl border font-bold text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                  autoFocus
                />
                <div className="flex gap-3 justify-center md:justify-start">
                  <button onClick={handleSaveName} disabled={saving} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-50 transition-all">
                    {saving ? 'Saving...' : 'Confirm'}
                  </button>
                  <button onClick={() => setEditing(false)} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <h2 className={`text-3xl font-black tracking-tight ${headingCls}`}>{user?.name}</h2>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <p className={`text-xs ${labelCls} font-bold tracking-tight`}>{user?.email}</p>
                </div>
                <div className="pt-2 flex flex-wrap gap-2 justify-center md:justify-start">
                  <button 
                    onClick={() => setEditing(true)} 
                    className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
                      isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    Edit Profile
                  </button>
                  <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${isDark ? 'border-purple-500/30 text-purple-400 bg-purple-500/5' : 'border-purple-200 text-purple-600 bg-purple-50'}`}>
                    Verified Explorer
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TAB NAVIGATION ─────────────────────────────────────────── */}
      <div className={`sticky top-0 z-40 flex p-1.5 rounded-[2rem] border overflow-x-auto no-scrollbar backdrop-blur-3xl shadow-xl transition-all ${isDark ? 'bg-black/40 border-white/10 shadow-purple-900/10' : 'bg-white/80 border-gray-100 shadow-gray-200/50'}`}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[90px] py-3.5 rounded-[1.5rem] flex flex-col items-center gap-1 transition-all duration-300 relative ${activeTab === tab.id ? 'text-purple-500 scale-[1.02]' : isDark ? 'text-white opacity-40 hover:opacity-100' : 'text-slate-600 opacity-60 hover:opacity-100'}`}
          >
            {activeTab === tab.id && (
               <div className={`absolute inset-0 rounded-[1.5rem] shadow-inner ${isDark ? 'bg-gradient-to-br from-purple-500/20 to-transparent' : 'bg-purple-50'}`} />
            )}
            <span className="text-xl relative z-10">{tab.icon}</span>
            <span className="text-[9px] font-black uppercase tracking-widest relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ────────────────────────────────────────────── */}
      <div className="min-h-[400px] relative">
        <AnimatePresence mode="wait">
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: "circOut" }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                 <div className={`rounded-3xl p-6 border text-center ${cardCls} bg-gradient-to-br from-purple-500/5 to-transparent`}>
                    <div className="text-3xl mb-2">📸</div>
                    <div className={`text-2xl font-black ${headingCls}`}>{stats.analyses}</div>
                    <div className={`text-[10px] uppercase font-black tracking-widest ${labelCls}`}>Analyses</div>
                 </div>
                  <div className={`rounded-3xl p-6 border text-center ${cardCls} bg-gradient-to-br from-pink-500/5 to-transparent`}>
                    <div className="text-3xl mb-2">🏆</div>
                    <div className={`text-2xl font-black ${headingCls}`}>{stats.xp}</div>
                    <div className={`text-[10px] uppercase font-black tracking-widest ${labelCls}`}>XP Points</div>
                  </div>
              </div>

              {wardrobeStats ? (
                <div className="space-y-6">
                  {/* IMMERSIVE DNA STAGE */}
                  <div className={`rounded-[3rem] p-10 border relative overflow-hidden group transition-all duration-700 ${cardCls} ${isDark ? 'from-indigo-600/10 to-transparent' : 'from-indigo-50 to-white'} bg-gradient-to-br shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]`}>
                    <div className={`absolute top-0 right-0 w-96 h-96 blur-[120px] pointer-events-none opacity-30 transition-all duration-1000 group-hover:opacity-50`} style={{ backgroundColor: wardrobeStats.skinHex }} />
                    <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]" />
                    
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row items-center gap-12">
                            {/* DNA CORE VISUAL */}
                            <div className="relative">
                               <div className="w-44 h-44 rounded-[3.5rem] shadow-2xl border-8 border-white p-2 relative z-10 overflow-hidden transform group-hover:scale-105 transition-transform duration-700" style={{ backgroundColor: wardrobeStats.skinHex }}>
                                  <div className="absolute inset-0 bg-gradient-to-tr from-black/30 to-transparent" />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-5xl drop-shadow-lg">✨</span>
                                  </div>
                               </div>
                               <div className="absolute -inset-4 bg-white/5 border border-white/10 rounded-[4rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                               <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white rounded-3xl shadow-2xl flex items-center justify-center text-3xl z-20 animate-bounce-slow">🎨</div>
                            </div>

                            {/* IDENTITY TEXT */}
                            <div className="flex-1 text-center md:text-left space-y-4">
                                <div>
                                    <p className={`text-[11px] font-black uppercase tracking-[0.3em] opacity-40 mb-2 ${labelCls}`}>DNA Style Identity</p>
                                    <h3 className={`text-5xl font-black tracking-tighter ${headingCls}`}>{wardrobeStats.season} <span className="text-purple-500">Explorer</span></h3>
                                </div>
                                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                    <span className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/10 backdrop-blur-md ${isDark ? 'bg-white/5 text-white/60' : 'bg-slate-100 text-slate-600'}`}>
                                        {wardrobeStats.undertone} Undertone
                                    </span>
                                    <span className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/10 backdrop-blur-md ${isDark ? 'bg-white/5 text-white/60' : 'bg-slate-100 text-slate-600'}`}>
                                        {wardrobeStats.skinTone} Tone
                                    </span>
                                </div>
                                
                                <button 
                                  onClick={() => setShowBlueprint(true)}
                                  className="mt-4 px-8 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto md:mx-0"
                                >
                                   📄 View DNA Blueprint
                                </button>
                            </div>
                        </div>

                        {/* HARMONY PROGRESS */}
                        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 items-center pt-8 border-t border-white/5">
                            <div className="md:col-span-2 space-y-3">
                                <div className="flex justify-between items-end">
                                   <p className={`text-[11px] font-black uppercase tracking-widest ${labelCls}`}>Wardrobe Synergy</p>
                                   <p className={`text-2xl font-black text-purple-500`}>{stats.score}%</p>
                                </div>
                                <div className={`h-4 w-full rounded-full overflow-hidden p-1 ${isDark ? 'bg-white/5' : 'bg-slate-50 border border-slate-100'}`}>
                                   <motion.div 
                                     className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full" 
                                     initial={{ width: 0 }}
                                     animate={{ width: `${stats.score}%` }}
                                     transition={{ duration: 2, ease: "circOut" }}
                                   />
                                </div>
                            </div>
                            <div className="text-center md:text-right">
                                <p className={`text-[9px] font-black uppercase opacity-30 mb-1 leading-none`}>Confidence Rate</p>
                                <p className={`text-xl font-black uppercase ${wardrobeStats.confidence === 'high' ? 'text-green-500' : 'text-yellow-500'}`}>
                                    {wardrobeStats.confidence === 'high' ? '✓ Elite 95%' : '~ High 85%'}
                                </p>
                            </div>
                        </div>
                    </div>
                  </div>

                  {/* PROFESSIONAL IDENTITY METRICS */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {[
                        { label: 'Lifestyle', value: userPrefs.lifestyle || 'Active', icon: '💼', color: 'bg-blue-500' },
                        { label: 'Body Build', value: userPrefs.build || 'Athletic', icon: '💪', color: 'bg-orange-500' },
                        { label: 'Archetype', value: userPrefs.styleGoal || 'Elite', icon: '💎', color: 'bg-indigo-500' },
                        { label: 'Goal', value: userPrefs.aesthetic || 'Casual', icon: '⚡', color: 'bg-pink-500' }
                     ].map((metric, i) => (
                        <div key={i} className={`rounded-[2rem] p-6 border group hover:scale-[1.02] transition-all duration-300 ${cardCls}`}>
                            <div className={`w-10 h-10 rounded-xl ${metric.color}/10 flex items-center justify-center text-lg mb-4 group-hover:rotate-12 transition-transform`}>{metric.icon}</div>
                            <p className={`text-[9px] font-black uppercase opacity-30 leading-none mb-2 ${labelCls}`}>{metric.label}</p>
                            <p className={`text-xs font-black uppercase tracking-tighter truncate ${headingCls}`}>{metric.value}</p>
                        </div>
                     ))}
                  </div>

                  {/* QUICK INFO BUTTONS */}
                  <div className={`rounded-3xl p-6 border flex items-center justify-between group cursor-pointer ${cardCls} hover:bg-white/5 transition-all`} onClick={() => setActiveTab('preferences')}>
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-xl">🧬</div>
                         <div>
                            <p className={`text-xs font-black ${headingCls}`}>Technical Metrics</p>
                            <p className={`text-[10px] opacity-40 italic ${labelCls}`}>View and Update Identity Stats</p>
                         </div>
                      </div>
                      <span className="text-purple-500 opacity-20 group-hover:opacity-100 group-hover:translate-x-2 transition-all">→</span>
                  </div>
                </div>
              ) : (
                <div className={`rounded-[2.5rem] p-12 border text-center border-dashed ${cardCls}`}>
                   <div className="text-4xl mb-4 opacity-40">📸</div>
                   <p className={`text-sm font-bold opacity-60 max-w-[200px] mx-auto ${labelCls}`}>Run your first analysis to unlock your Style DNA profile</p>
                </div>
              )}
            </motion.div>
          )}


          {/* TAB: PREFERENCES */}
          {activeTab === 'preferences' && (
            <motion.div 
              key="preferences"
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className={`rounded-3xl p-8 border ${cardCls}`}>
                <h3 className={`text-[11px] font-black uppercase mb-8 tracking-[0.2em] opacity-60 ${headingCls}`}>App Personalization</h3>
                
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${isDark ? 'bg-white/5' : 'bg-white border border-gray-100'}`}>🌐</div>
                      <span className={`font-black text-sm tracking-tight ${headingCls}`}>Language</span>
                    </div>
                    {/* PREMIUM PILL CONTROL */}
                    <div className={`flex relative p-1 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                      {['en', 'hi', 'hinglish'].map(lang => (
                        <button
                          key={lang}
                          onClick={() => handleLanguageChange(lang)}
                          className={`relative z-10 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${language === lang ? 'text-white' : isDark ? 'text-white/40' : 'text-slate-600'}`}
                        >
                          {language === lang && (
                            <motion.div layoutId="lang-pill" className="absolute inset-0 bg-purple-600 rounded-xl -z-10 shadow-lg shadow-purple-500/30" />
                          )}
                          {lang.toUpperCase().slice(0, 2)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${isDark ? 'bg-white/5' : 'bg-white border border-gray-100'}`}>🌓</div>
                      <span className={`font-black text-sm tracking-tight ${headingCls}`}>Visual Theme</span>
                    </div>
                    <button onClick={handleThemeToggle} className={`w-14 h-8 rounded-full relative transition-all duration-500 ${isDark ? 'bg-purple-600' : 'bg-gray-200'}`}>
                      <motion.div 
                        animate={{ x: isDark ? 24 : 4 }}
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-xl`} 
                      />
                    </button>
                  </div>

                  <div className="pt-4 space-y-4">
                    <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${labelCls}`}>Lifestyle & Vibe</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'student', label: 'College Student', icon: '🎓' },
                        { id: 'pro', label: 'Corporate Pro', icon: '💼' },
                        { id: 'creative', label: 'Freelancer', icon: '🎨' },
                        { id: 'other', label: 'Other', icon: '✨' }
                      ].map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            const newPrefs = { ...userPrefs, lifestyle: item.id };
                            setUserPrefs(newPrefs);
                            saveUserPreferences(auth.currentUser.uid, newPrefs);
                            window.dispatchEvent(new CustomEvent('sg_calendar_updated'));
                          }}
                          className={`px-4 py-3 rounded-2xl border transition-all flex items-center gap-2 ${
                            userPrefs.lifestyle === item.id 
                              ? 'bg-purple-600 border-transparent text-white shadow-lg' 
                              : isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-white border-gray-200 text-slate-500'
                          }`}
                        >
                          <span className="text-sm">{item.icon}</span>
                          <span className="text-[10px] font-black uppercase">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${labelCls}`}>Identity Lock</p>
                    <div className="flex gap-2">
                       {[
                         { id: 'male', label: 'Male', icon: '👨' },
                         { id: 'female', label: 'Female', icon: '👩' }
                       ].map(item => (
                         <button
                           key={item.id}
                           onClick={() => {
                             const newPrefs = { ...userPrefs, gender: item.id };
                             setUserPrefs(newPrefs);
                             saveUserPreferences(auth.currentUser.uid, newPrefs);
                             // Force global reload for Navigator/Shop links
                             localStorage.setItem('sg_gender_pref', item.id);
                             window.dispatchEvent(new CustomEvent('sg_wardrobe_updated'));
                           }}
                           className={`flex-1 py-4 rounded-2xl border transition-all flex flex-col items-center gap-1 ${
                             userPrefs.gender === item.id 
                               ? 'bg-pink-600 border-transparent text-white shadow-lg' 
                               : isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-white border-gray-200 text-slate-500'
                           }`}
                         >
                           <span className="text-xl">{item.icon}</span>
                           <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                         </button>
                       ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className={`rounded-3xl p-8 border ${cardCls} bg-gradient-to-r from-purple-500/5 to-pink-500/5`}>
                 <h3 className={`text-[11px] font-black uppercase mb-8 tracking-[0.2em] opacity-60 ${headingCls}`}>Physical Profile</h3>
                 <div className="space-y-10">
                   {/* HEIGHT SELECTOR */}
                   <div>
                     <p className={`text-[10px] font-black uppercase mb-4 tracking-widest ${labelCls}`}>Height Group</p>
                     <div className="flex flex-wrap gap-2">
                       {[{id:'petite',i:'📐'},{id:'regular',i:'📏'},{id:'tall',i:'🚀'}].map(h => (
                         <button 
                           key={h.id} 
                           onClick={() => handleUpdatePreference('height', h.id)} 
                           className={`flex-1 min-w-[80px] p-4 rounded-3xl border transition-all flex flex-col items-center gap-2 ${
                             userPrefs.height === h.id 
                               ? 'bg-purple-600 border-purple-600 text-white shadow-xl shadow-purple-600/20' 
                               : isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-white border-purple-100 text-slate-700'
                           }`}
                         >
                           <span className="text-xl">{h.i}</span>
                           <span className={`text-[9px] font-black uppercase tracking-tighter`}>{h.id}</span>
                         </button>
                       ))}
                     </div>
                   </div>
                   
                   {/* BUILD SELECTOR */}
                   <div>
                     <p className={`text-[10px] font-black uppercase mb-4 tracking-widest ${labelCls}`}>Body Build</p>
                     <div className="flex flex-wrap gap-2">
                       {[{id:'slim',i:'🧘'},{id:'athletic',i:'💪'},{id:'broad',i:'🏛'}].map(b => (
                         <button 
                           key={b.id} 
                           onClick={() => handleUpdatePreference('build', b.id)} 
                           className={`flex-1 min-w-[80px] p-4 rounded-3xl border transition-all flex flex-col items-center gap-2 ${
                             userPrefs.build === b.id 
                               ? 'bg-purple-600 border-purple-600 text-white shadow-xl shadow-purple-600/20' 
                               : isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-white border-purple-100 text-slate-700'
                           }`}
                         >
                           <span className="text-xl">{b.i}</span>
                           <span className="text-[9px] font-black uppercase tracking-tighter">{b.id}</span>
                         </button>
                       ))}
                     </div>
                   </div>

                   {/* STYLE GOAL SELECTOR */}
                   <div>
                     <p className={`text-[10px] font-black uppercase mb-4 tracking-widest ${labelCls}`}>Style Archetype</p>
                     <div className="grid grid-cols-2 gap-2">
                       {[{id:'minimalist',i:'⚪'},{id:'sophisticated',i:'🍷'},{id:'edgy',i:'⛓️'},{id:'vibrant',i:'🌈'}].map(a => (
                         <button 
                           key={a.id} 
                           onClick={() => handleUpdatePreference('styleGoal', a.id)} 
                           className={`p-4 rounded-3xl border transition-all flex items-center gap-3 ${
                             userPrefs.styleGoal === a.id 
                               ? 'bg-purple-600 border-purple-600 text-white shadow-xl shadow-purple-600/20' 
                               : isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-white border-purple-100 text-slate-700'
                           }`}
                         >
                           <span className="text-xl">{a.i}</span>
                           <span className="text-[9px] font-black uppercase tracking-tighter">{a.id}</span>
                         </button>
                       ))}
                     </div>
                   </div>

                   {/* CONTRAST SELECTOR */}
                   <div>
                     <p className={`text-[10px] font-black uppercase mb-4 tracking-widest ${labelCls}`}>Contrast Depth</p>
                     <div className="flex gap-2">
                       {[{id:'low',i:'🌫️'},{id:'medium',i:'⚖️'},{id:'high',i:'⚡'}].map(c => (
                         <button 
                           key={c.id} 
                           onClick={() => handleUpdatePreference('contrast', c.id)} 
                           className={`flex-1 p-4 rounded-3xl border transition-all flex flex-col items-center gap-2 ${
                             userPrefs.contrast === c.id 
                               ? 'bg-purple-600 border-purple-600 text-white shadow-xl shadow-purple-600/20' 
                               : isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-white border-purple-100 text-slate-700'
                           }`}
                         >
                           <span className="text-xl">{c.i}</span>
                           <span className="text-[9px] font-black uppercase tracking-tighter">{c.id}</span>
                         </button>
                       ))}
                     </div>
                   </div>

                    {/* PERSONA SELECTOR */}
                   <div>
                     <p className={`text-[10px] font-black uppercase mb-4 tracking-widest ${labelCls}`}>Fabric Persona</p>
                     <div className="grid grid-cols-2 gap-2">
                       {[{id:'classic',i:'🧥'},{id:'rugged',i:'🥾'},{id:'organic',i:'🌿'},{id:'luxe',i:'✨'}].map(p => (
                         <button 
                           key={p.id} 
                           onClick={() => handleUpdatePreference('persona', p.id)} 
                           className={`p-4 rounded-3xl border transition-all flex items-center gap-3 ${
                             userPrefs.persona === p.id 
                               ? 'bg-purple-600 border-purple-600 text-white shadow-xl shadow-purple-600/20' 
                               : isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-white border-purple-100 text-slate-700'
                           }`}
                         >
                           <span className="text-xl">{p.i}</span>
                           <span className="text-[9px] font-black uppercase tracking-tighter">{p.id}</span>
                         </button>
                       ))}
                     </div>
                   </div>
                 </div>
              </div>
            </motion.div>
          )}

          {/* TAB: SUPPORT */}
          {activeTab === 'support' && (
            <motion.div 
              key="support"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
               <div className={`rounded-3xl p-2 border ${cardCls}`}>
                  <div className="space-y-1">
                    {[
                      { l: 'Help & FAQ', i: '❓', act: () => handleSupportEmail('help') },
                      { l: 'Report Issue', i: '🐛', act: () => handleSupportEmail('issue') },
                      { l: 'Request Feature', i: '💡', act: () => handleSupportEmail('feature') },
                      { l: 'Community Impact', i: '📈', act: () => alert('Community stats coming soon!') },
                      { l: 'Share StyleGuru', i: '📱', act: handleShare },
                    ].map((sub, idx) => (
                      <button key={idx} onClick={sub.act} className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-5">
                          <span className="text-2xl">{sub.i}</span>
                          <span className={`font-black text-sm tracking-tight ${headingCls}`}>{sub.l}</span>
                        </div>
                        <span className="opacity-20 text-xs text-purple-500">→</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`rounded-[2rem] p-6 border ${cardCls} bg-gradient-to-tr from-purple-500/5 to-transparent`}>
                  <button onClick={handleDownloadData} className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-lg">💾</div>
                      <span className={`font-black text-xs tracking-widest uppercase ${headingCls}`}>Export Profile</span>
                    </div>
                    <span className="text-[10px] font-black opacity-30 uppercase">JSON</span>
                  </button>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── FOOTER ACTIONS ─────────────────────────────────────────── */}
      <div className="space-y-4 pt-10 pb-20">
        <button 
          onClick={async () => { if(window.confirm('Clear session and logout?')) { await logout(); localStorage.clear(); navigate('/'); } }} 
          className="w-full py-6 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-red-500/20 active:scale-[0.98] transition-all"
        >
          🚪 Sign Out
        </button>
        <div className="flex flex-col items-center gap-4 text-center">
          <button onClick={handleDeleteAccount} className="text-red-500/40 font-black text-[10px] uppercase tracking-[0.2em] hover:text-red-500 transition-colors">
            Destroy Account
          </button>
          <div className={`opacity-20 text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2 ${labelCls}`}>
             <span>v3.0.0-PRO</span>
             <span className="w-1 h-1 bg-current rounded-full" />
             <span>© 2025 STYLEGURU</span>
          </div>
        </div>
      </div>

      {/* ── DNA BLUEPRINT MODAL ────────────────────────────────────── */}
      <AnimatePresence>
        {showBlueprint && dnaInsights && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/80"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.9, y: 20 }}
               className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[3.5rem] p-10 relative border border-white/10 ${isDark ? 'bg-[#0a0c1a]' : 'bg-white'}`}
             >
                <button 
                  onClick={() => setShowBlueprint(false)}
                  className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl hover:bg-white/10 transition-all"
                >
                  ✕
                </button>

                <div className="space-y-12">
                   <div className="text-center space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-500">Technical Analysis Report</p>
                       <h2 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>DNA BLUEPRINT</h2>
                       <p className="text-xs opacity-40 uppercase font-bold">Accuracy Rating: 95.8% • AI Precision</p>
                   </div>

                   {/* CORE METRICS */}
                   <div className="grid grid-cols-2 gap-6">
                       <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                           <p className="text-[9px] font-black uppercase opacity-30 mb-2">Skin Identification</p>
                           <p className="text-sm font-bold">{dnaInsights.skin_tone?.category || 'Tone Matched'}</p>
                           <p className="text-[10px] opacity-40 mt-1 italic">Hex: {dnaInsights.skin_color?.hex}</p>
                       </div>
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                           <p className="text-[9px] font-black uppercase opacity-30 mb-2">Chromacity Scan</p>
                           <p className="text-sm font-bold">{dnaInsights.skin_tone?.undertone || 'Neutral'} Undertone</p>
                           <p className="text-[10px] opacity-40 mt-1 italic">Confidence: {dnaInsights.skin_tone?.confidence}</p>
                       </div>
                   </div>

                   {/* PALETTE MAP */}
                   <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-black uppercase tracking-widest opacity-60">Master Palette Map</h4>
                            <span className="text-[9px] font-bold text-slate-500">SHIRTS • TOPS • DRESSES</span>
                        </div>
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                            {(dnaInsights.best_shirt_colors || dnaInsights.best_top_colors || []).slice(0, 10).map((c, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="aspect-square rounded-xl shadow-lg border-2 border-white/20" style={{ backgroundColor: c.hex }} />
                                    <p className="text-[6px] font-black text-center truncate uppercase opacity-40">{c.name}</p>
                                </div>
                            ))}
                        </div>
                   </div>

                    {/* ACTIONABLE INTEL */}
                    <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-600/20 to-transparent border border-purple-500/20">
                         <h4 className="text-[10px] font-black uppercase tracking-widest mb-4">Stylist AI Verdict</h4>
                         <p className="text-xs leading-relaxed opacity-70 italic font-medium">
                            "The DNA analysis confirms a {dnaInsights.skin_tone?.category} tone with a distinct {dnaInsights.skin_tone?.undertone} undertone. 
                            Your seasonal profile ({dnaInsights.skin_tone?.color_season}) responds best to high-contrast combinations. 
                            Prioritize {dnaInsights.best_shirt_colors?.[0]?.name || 'Neutral'} and {dnaInsights.best_pant_colors?.[0]?.name || 'Dark'} fabrics for maximum facial interaction."
                         </p>
                    </div>

                    <button 
                      onClick={() => setShowBlueprint(false)} 
                      className="w-full py-5 bg-white text-black rounded-3xl text-[10px] font-black uppercase tracking-widest"
                    >
                        Close Blueprint
                    </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
