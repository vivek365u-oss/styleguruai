import { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { usePlan } from '../context/PlanContext';
import { auth, loadProfile, logout, getHistory, getSavedColors, saveUserPreferences, loadUserPreferences } from '../api/styleApi';
import { updateProfile, deleteUser } from 'firebase/auth';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export default function ProfilePanel({ hideHeader = false }) {
  const { theme, setTheme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const { isPro, usage, validUntil } = usePlan();
  const { language, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); // overview, wardrobe, preferences, support
  const [userPrefs, setUserPrefs] = useState({ height: '', build: '', fit: '', aesthetic: '' });
  const [stats, setStats] = useState({ analyses: 0, colors: 0, score: 0, level: 1, xp: 0 });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [wardrobeStats, setWardrobeStats] = useState(null);

  // Notification State
  const [notifStatus, setNotifStatus] = useState(() => {
    if (typeof Notification === 'undefined' || !('PushManager' in window)) return 'unsupported';
    return Notification.permission;
  });
  const [subId, setSubId] = useState(() => localStorage.getItem('sg_push_sub_id') || null);

  useEffect(() => {
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
        const [profile, historyRes, colorsRes, prefsRes] = await Promise.all([
          loadProfile(currentUser.uid),
          getHistory(),
          getSavedColors(currentUser.uid),
          loadUserPreferences(currentUser.uid)
        ]);

        if (prefsRes) setUserPrefs(prefsRes);

        const historyCount = historyRes?.data?.total || 0;
        const savedColorsCount = colorsRes?.length || 0;
        
        // Dynamic Style Score & XP Calculation (Simple logic for now)
        const lastAnalysis = JSON.parse(localStorage.getItem('sg_last_analysis') || 'null');
        let calculatedScore = 0;
        let xp = (historyCount * 20) + (savedColorsCount * 10);
        let level = Math.floor(xp / 100) + 1;
        
        if (lastAnalysis) {
          setWardrobeStats({
            skinTone: lastAnalysis.skinTone,
            undertone: lastAnalysis.undertone,
            season: lastAnalysis.season,
            skinHex: lastAnalysis.skinHex,
            date: lastAnalysis.date,
          });
          calculatedScore = lastAnalysis.confidence === 'high' ? 95 : 82;
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

    loadData();
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

  const cardCls = isDark ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-gray-100 shadow-xl shadow-gray-200/50';
  const labelCls = isDark ? 'text-white/40' : 'text-gray-400';
  const headingCls = isDark ? 'text-white' : 'text-gray-900';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full shadow-lg" />
      </div>
    );
  }

  const TABS = [
    { id: 'overview', label: 'Overview', icon: '✨' },
    { id: 'wardrobe', label: 'Wardrobe', icon: '👕' },
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
                  <p className={`text-xs ${labelCls} font-bold opacity-60 tracking-tight`}>{user?.email}</p>
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
            className={`flex-1 min-w-[90px] py-3.5 rounded-[1.5rem] flex flex-col items-center gap-1 transition-all duration-300 relative ${activeTab === tab.id ? 'text-purple-500 scale-[1.02]' : 'text-gray-500 opacity-40 hover:opacity-100'}`}
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
      <div className="min-h-[400px]">
        
        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-slide-up">
            <div className="grid grid-cols-2 gap-4">
               <div className={`rounded-3xl p-6 border text-center ${cardCls} bg-gradient-to-br from-purple-500/5 to-transparent`}>
                  <div className="text-3xl mb-2">📸</div>
                  <div className={`text-2xl font-black ${headingCls}`}>{stats.analyses}</div>
                  <div className={`text-[10px] uppercase font-black tracking-widest opacity-60 ${labelCls}`}>Analyses</div>
               </div>
               <div className={`rounded-3xl p-6 border text-center ${cardCls} bg-gradient-to-br from-pink-500/5 to-transparent`}>
                  <div className="text-3xl mb-2">🎨</div>
                  <div className={`text-2xl font-black ${headingCls}`}>{stats.colors}</div>
                  <div className={`text-[10px] uppercase font-black tracking-widest opacity-60 ${labelCls}`}>Items Saved</div>
               </div>
            </div>

            {wardrobeStats ? (
              <div className={`rounded-[2.5rem] p-8 border relative overflow-hidden group transition-all duration-500 ${isDark ? 'bg-[#0f1123] border-indigo-500/20' : 'bg-white border-indigo-100 shadow-xl shadow-indigo-500/5'}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-50" />
                <h3 className={`text-[11px] font-black uppercase mb-8 tracking-[0.2em] opacity-40 ${headingCls}`}>Your Style DNA</h3>
                
                <div className="flex flex-col sm:flex-row items-center gap-10">
                  <div className="space-y-6 flex-1 w-full">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-xl shadow-inner">👤</div>
                      <div>
                        <p className={`text-[10px] uppercase font-black opacity-40 leading-none mb-1 ${labelCls}`}>Tone & Season</p>
                        <p className={`text-lg font-black tracking-tight ${headingCls}`}>{wardrobeStats.skinTone} <span className="opacity-20 mx-1">•</span> {wardrobeStats.season}</p>
                      </div>
                    </div>
                    
                    {/* HARMONY MINI CHART */}
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-xl shadow-inner">📈</div>
                      <div className="flex-1">
                        <p className={`text-[10px] uppercase font-black opacity-40 leading-none mb-2 ${labelCls}`}>Harmony Insights</p>
                        <div className="flex gap-1 items-end h-8">
                           {[40, 70, 45, 90, 65, 80].map((v, i) => (
                             <div key={i} className="flex-1 bg-gradient-to-t from-pink-500 to-purple-500 rounded-t-sm opacity-60 hover:opacity-100 transition-all cursor-crosshair" style={{ height: `${v}%` }} title={`Trait ${i}: ${v}%`} />
                           ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative group/swatch">
                    <div className="w-32 h-32 rounded-[2.5rem] shadow-2xl border-8 border-white p-2 swatch-pop relative z-10 overflow-hidden" style={{ backgroundColor: wardrobeStats.skinHex }}>
                       <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-2xl z-20 group-hover/swatch:scale-110 transition-transform">💅</div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/5">
                   <div className="flex justify-between items-end mb-3">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${labelCls}`}>Overall Harmony</p>
                      <p className={`text-xl font-black text-indigo-400`}>{stats.score}%</p>
                   </div>
                   <div className={`h-3 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                      <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000" style={{ width: `${stats.score}%` }} />
                   </div>
                </div>
              </div>
            ) : (
              <div className={`rounded-[2.5rem] p-12 border text-center border-dashed ${cardCls}`}>
                 <div className="text-4xl mb-4 opacity-40">📸</div>
                 <p className={`text-sm font-bold opacity-60 max-w-[200px] mx-auto ${labelCls}`}>Run your first analysis to unlock your Style DNA profile</p>
              </div>
            )}
          </div>
        )}

        {/* TAB: WARDROBE */}
        {activeTab === 'wardrobe' && (
          <div className="space-y-6 animate-slide-up">
            <div className={`rounded-3xl p-8 border ${cardCls}`}>
               <div className="flex items-center justify-between mb-8">
                  <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] opacity-40 ${headingCls}`}>Wardrobe Hub</h3>
                  <button onClick={() => navigate('/dashboard')} className="text-[10px] font-black text-purple-500 uppercase tracking-widest">History</button>
               </div>
               <div className="flex flex-col items-center justify-center py-10 opacity-40">
                  <div className="text-5xl mb-6">👔</div>
                  <p className="text-sm font-bold text-center">Your personalized wardrobe is synced and ready</p>
               </div>
            </div>
          </div>
        )}

        {/* TAB: PREFERENCES */}
        {activeTab === 'preferences' && (
          <div className="space-y-6 animate-slide-up">
            <div className={`rounded-3xl p-8 border ${cardCls}`}>
              <h3 className={`text-[11px] font-black uppercase mb-8 tracking-[0.2em] opacity-40 ${headingCls}`}>App Personalization</h3>
              
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>🌐</div>
                    <span className={`font-black text-sm tracking-tight ${headingCls}`}>Language</span>
                  </div>
                  <div className={`flex rounded-2xl p-1.5 gap-1.5 ${isDark ? 'bg-white/10' : 'bg-gray-100 border border-black/5'}`}>
                    {['en', 'hi', 'hinglish'].map(lang => (
                      <button
                        key={lang}
                        onClick={() => handleLanguageChange(lang)}
                        className={`w-12 h-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${language === lang ? 'bg-white text-purple-600 shadow-md' : 'text-gray-500 opacity-40'}`}
                      >
                        {lang.toUpperCase().slice(0, 2)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>🌓</div>
                    <span className={`font-black text-sm tracking-tight ${headingCls}`}>Visual Theme</span>
                  </div>
                  <button onClick={handleThemeToggle} className={`w-14 h-8 rounded-full relative transition-all duration-300 ${isDark ? 'bg-purple-600' : 'bg-gray-200'}`}>
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-xl ${isDark ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                {notifStatus !== 'unsupported' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>🔔</div>
                      <div>
                        <span className={`font-black text-sm block tracking-tight ${headingCls}`}>Alerts</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${notifStatus === 'granted' ? 'text-green-500' : 'opacity-40'}`}>
                          {notifStatus === 'granted' ? 'Enabled' : 'Paused'}
                        </span>
                      </div>
                    </div>
                    <button onClick={notifStatus === 'granted' ? disableNotification : requestNotification} className={`w-14 h-8 rounded-full relative transition-all duration-300 ${notifStatus === 'granted' ? 'bg-purple-600' : 'bg-gray-200'}`}>
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-xl ${notifStatus === 'granted' ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={`rounded-3xl p-8 border ${cardCls} bg-gradient-to-r from-purple-500/5 to-pink-500/5`}>
               <h3 className={`text-[11px] font-black uppercase mb-8 tracking-[0.2em] opacity-40 ${headingCls}`}>Physical Profile</h3>
               <div className="space-y-10">
                 <div>
                   <p className={`text-[10px] font-black uppercase mb-4 tracking-widest ${labelCls}`}>Height Group</p>
                   <div className="grid grid-cols-3 gap-3">
                     {[{id:'petite',i:'📐'},{id:'regular',i:'📏'},{id:'tall',i:'🚀'}].map(h => (
                       <button key={h.id} onClick={() => handleUpdatePreference('height', h.id)} className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${userPrefs.height === h.id ? 'bg-purple-500 border-purple-500 text-white' : isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                         <span className="text-xl">{h.i}</span>
                         <span className="text-[10px] font-black uppercase">{h.id}</span>
                       </button>
                     ))}
                   </div>
                 </div>
                 
                 <div>
                   <p className={`text-[10px] font-black uppercase mb-4 tracking-widest ${labelCls}`}>Body Build</p>
                   <div className="grid grid-cols-3 gap-3">
                     {[{id:'slim',i:'🧘'},{id:'athletic',i:'💪'},{id:'broad',i:'🏛'}].map(b => (
                       <button key={b.id} onClick={() => handleUpdatePreference('build', b.id)} className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${userPrefs.build === b.id ? 'bg-purple-500 border-purple-500 text-white' : isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                         <span className="text-xl">{b.i}</span>
                         <span className="text-[10px] font-black uppercase">{b.id}</span>
                       </button>
                     ))}
                   </div>
                 </div>

                 <div>
                   <p className={`text-[10px] font-black uppercase mb-4 tracking-widest ${labelCls}`}>Style Aesthetic</p>
                   <div className="grid grid-cols-2 gap-3">
                     {[{id:'casual',i:'☕'},{id:'corporate',i:'💼'},{id:'streetwear',i:'🛹'},{id:'ethnic',i:'🕌'}].map(a => (
                       <button key={a.id} onClick={() => handleUpdatePreference('aesthetic', a.id)} className={`p-4 rounded-2xl border transition-all flex items-center gap-3 ${userPrefs.aesthetic === a.id ? 'bg-purple-500 border-purple-500 text-white' : isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                         <span className="text-xl">{a.i}</span>
                         <span className="text-[10px] font-black uppercase">{a.id}</span>
                       </button>
                     ))}
                   </div>
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* TAB: SUPPORT */}
        {activeTab === 'support' && (
          <div className="space-y-6 animate-slide-up">
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
                      <span className="opacity-20 text-xs">→</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`rounded-3xl p-2 border ${cardCls}`}>
                <div className="space-y-1">
                  <button onClick={handleDownloadData} className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-5">
                      <span className="text-2xl">💾</span>
                      <span className={`font-black text-sm tracking-tight ${headingCls}`}>Export Profile</span>
                    </div>
                    <span className="text-[10px] font-black opacity-30 tracking-widest uppercase">JSON</span>
                  </button>
                </div>
              </div>
          </div>
        )}
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
    </div>
  );
}
