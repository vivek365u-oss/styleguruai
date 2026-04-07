import { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { usePlan } from '../context/PlanContext';
import { auth, loadProfile, logout, getHistory, getSavedColors } from '../api/styleApi';
import { updateProfile, deleteUser } from 'firebase/auth';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export default function ProfilePanel({ hideHeader = false, onOpenUpgrade }) {
  const { theme, setTheme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const { isPro, usage, validUntil } = usePlan();
  const { language, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [wardrobeStats, setWardrobeStats] = useState(null);
  const [stats, setStats] = useState({ analyses: 0, colors: 0, score: 0 });

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

        // Fetch real-time metrics
        const [profile, historyRes, colorsRes] = await Promise.all([
          loadProfile(currentUser.uid),
          getHistory(),
          getSavedColors(currentUser.uid),
        ]);

        const historyCount = historyRes?.data?.total || 0;
        const savedColorsCount = colorsRes?.length || 0;
        
        // Dynamic Style Score Calculation
        const lastAnalysis = JSON.parse(localStorage.getItem('sg_last_analysis') || 'null');
        let calculatedScore = 0;
        
        if (lastAnalysis) {
          setWardrobeStats({
            skinTone: lastAnalysis.skinTone,
            undertone: lastAnalysis.undertone,
            season: lastAnalysis.season,
            skinHex: lastAnalysis.skinHex,
            date: lastAnalysis.date,
          });
          
          // Better quality/consistency = higher score
          calculatedScore = lastAnalysis.confidence === 'high' ? 95 : 82;
        }

        setStats({
          analyses: historyCount,
          colors: savedColorsCount,
          score: calculatedScore || 0
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

  const cardCls = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-100 shadow-sm';
  const labelCls = isDark ? 'text-white/40' : 'text-gray-400';
  const headingCls = isDark ? 'text-white' : 'text-gray-900';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full shadow-lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${hideHeader ? 'pb-24' : ''} animate-fade-in`}>
      
      {/* Redesigned Profile Header (Horizontal layout) */}
      <div className={`rounded-3xl p-6 border overflow-hidden ${cardCls}`}>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-1 shadow-xl">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover border-4 border-white/10 shadow-inner" />
            ) : (
              <div className="w-full h-full rounded-full flex items-center justify-center text-3xl font-black text-white bg-inherit">
                {user?.name?.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2 max-w-sm">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full px-4 py-2 rounded-xl border font-bold text-sm ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveName} disabled={saving} className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold transition hover:scale-105 active:scale-95 disabled:opacity-50">
                    {saving ? '...' : 'Save'}
                  </button>
                  <button onClick={() => setEditing(false)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="group">
                <h2 className={`text-xl font-black tracking-tight ${headingCls}`}>{user?.name}</h2>
                <p className={`text-xs ${labelCls} font-medium truncate`}>{user?.email}</p>
                <button 
                  onClick={() => setEditing(true)} 
                  className={`mt-3 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all scale-animation ${
                    isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-purple-100 text-purple-700 hover:bg-purple-200 shadow-sm'
                  }`}
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Analyses', val: stats.analyses, icon: '📸', color: isDark ? 'text-purple-400' : 'text-purple-600' },
          { label: 'Colors', val: stats.colors, icon: '🎨', color: isDark ? 'text-pink-400' : 'text-pink-600' },
          { label: 'Style Score', val: stats.score > 0 ? `${stats.score}%` : '-', icon: '⚡', color: isDark ? 'text-orange-400' : 'text-orange-600' },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-4 text-center border transition-transform hover:scale-105 ${cardCls}`}>
            <div className={`text-2xl mb-1 ${s.color}`}>{s.icon}</div>
            <div className={`text-xl font-black ${headingCls}`}>{s.val}</div>
            <div className={`text-[9px] uppercase font-black tracking-tighter opacity-70 ${labelCls}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Color Analysis Highlights */}
      {wardrobeStats && (
        <div className={`rounded-3xl p-6 border relative overflow-hidden group ${isDark ? 'bg-gradient-to-br from-indigo-500/10 to-transparent border-white/5' : 'bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-lg shadow-indigo-500/5'}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-indigo-500/10 transition-all" />
          <h3 className={`text-[10px] font-black uppercase mb-4 tracking-widest opacity-60 ${headingCls}`}>Your Analysis</h3>
          
          <div className="flex items-center justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <div>
                  <p className={`text-[9px] uppercase font-bold opacity-50 ${labelCls}`}>Tone & Undertone</p>
                  <p className={`text-sm font-black capitalize ${headingCls}`}>{wardrobeStats.skinTone} • {wardrobeStats.undertone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                <div>
                  <p className={`text-[9px] uppercase font-bold opacity-50 ${labelCls}`}>Color Season</p>
                  <p className={`text-sm font-black capitalize ${headingCls}`}>{wardrobeStats.season}</p>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 relative">
              <div className="w-20 h-20 rounded-2xl shadow-2xl border-4 border-white swatch-pop" style={{ backgroundColor: wardrobeStats.skinHex }} />
              <div className="absolute -bottom-2 -right-2 text-xl shadow-lg rounded-lg bg-white p-1">🎨</div>
            </div>
          </div>
        </div>
      )}

      {/* My Plan Section */}
      <div className={`rounded-3xl p-6 border overflow-hidden ${isPro ? (isDark ? 'bg-gradient-to-br from-amber-600/20 to-transparent border-amber-500/30' : 'bg-gradient-to-br from-amber-50 to-white border-amber-200 shadow-lg shadow-amber-500/5') : (cardCls)}`}>
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-black tracking-tight ${isPro ? 'text-amber-500' : headingCls}`}>
                {isPro ? 'PRO SUBSCRIPTION' : 'FREE VERSION'}
              </span>
              {isPro && <span className="text-xs">💎</span>}
            </div>
            <p className={`text-[10px] font-bold opacity-60 ${labelCls}`}>
              {isPro ? `Elite access until ${validUntil ? new Date(validUntil).toLocaleDateString() : '...'}` : 'Standard features active'}
            </p>
          </div>
          {!isPro && (
            <button 
              onClick={onOpenUpgrade} 
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-[9px] font-black uppercase text-white shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-105 active:scale-95"
            >
              Unlock Pro
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className={`flex justify-between text-[9px] uppercase font-black tracking-widest ${labelCls}`}>
              <span>Analyses Used</span>
              <span className={headingCls}>{usage?.analyses_count || 0} / 6</span>
            </div>
            <div className={`h-2.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'} overflow-hidden shadow-inner`}>
              <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, (usage?.analyses_count / 6) * 100)}%` }} />
            </div>
          </div>
          <div className="space-y-2">
            <div className={`flex justify-between text-[9px] uppercase font-black tracking-widest ${labelCls}`}>
              <span>Compatibility Checks</span>
              <span className={headingCls}>{usage?.outfit_checks_count || 0} / 10</span>
            </div>
            <div className={`h-2.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'} overflow-hidden shadow-inner`}>
              <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, (usage?.outfit_checks_count / 10) * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {/* App Settings */}
        <div className={`rounded-3xl p-6 border ${cardCls}`}>
          <h3 className={`text-[10px] font-black uppercase mb-6 tracking-widest opacity-60 ${headingCls}`}>App Settings</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>🌐</div>
                <span className={`font-bold text-sm ${headingCls}`}>Language</span>
              </div>
              <div className={`flex rounded-xl p-1 gap-1 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                {[
                  { id: 'en', l: '🇬🇧' },
                  { id: 'hi', l: 'अ' },
                  { id: 'hinglish', l: '🇮🇳' },
                ].map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id)}
                    className={`w-10 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${language === lang.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 opacity-50'}`}
                  >
                    {lang.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>🌓</div>
                <span className={`font-bold text-sm ${headingCls}`}>Theme</span>
              </div>
              <button 
                onClick={handleThemeToggle}
                className={`w-12 h-6 rounded-full relative transition-all ${isDark ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${isDark ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            {notifStatus !== 'unsupported' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>🔔</div>
                  <div>
                    <span className={`font-bold text-sm block ${headingCls}`}>Notifications</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${notifStatus === 'granted' ? 'text-green-500' : labelCls}`}>
                      {notifStatus === 'granted' ? 'Enabled' : 'Paused'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={notifStatus === 'granted' ? disableNotification : requestNotification}
                  className={`w-12 h-6 rounded-full relative transition-all ${notifStatus === 'granted' ? 'bg-indigo-600' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${notifStatus === 'granted' ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Support Section */}
        <div className={`rounded-3xl p-2 border ${cardCls}`}>
          <div className="space-y-1">
            {[
              { l: 'Help & FAQ', i: '❓', act: () => handleSupportEmail('help') },
              { l: 'Report Issue', i: '🐛', act: () => handleSupportEmail('issue') },
              { l: 'Request Feature', i: '💡', act: () => handleSupportEmail('feature') },
              { l: 'Share StyleGuru', i: '📱', act: handleShare },
            ].map((sub, idx) => (
              <button key={idx} onClick={sub.act} className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center gap-4">
                  <span className="text-xl">{sub.i}</span>
                  <span className={`font-bold text-sm ${headingCls}`}>{sub.l}</span>
                </div>
                <span className="opacity-20 text-xs">→</span>
              </button>
            ))}
          </div>
        </div>

        {/* Data & Account */}
        <div className={`rounded-3xl p-2 border ${cardCls}`}>
          <div className="space-y-1">
            <button onClick={handleDownloadData} className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
              <div className="flex items-center gap-4">
                <span className="text-xl">📊</span>
                <span className={`font-bold text-sm ${headingCls}`}>Download Data</span>
              </div>
              <span className="text-[10px] font-bold opacity-30">JSON</span>
            </button>
            <button onClick={() => window.open('https://styleguruai.in', '_blank')} className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
              <div className="flex items-center gap-4">
                <span className="text-xl">🌐</span>
                <span className={`font-bold text-sm ${headingCls}`}>Official Site</span>
              </div>
              <span className="opacity-20 text-xs">↗</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logout & Danger Zone */}
      <div className="space-y-4 pt-6 pb-12">
        <button 
          onClick={async () => { if(window.confirm('Logout?')) { await logout(); localStorage.clear(); navigate('/'); } }} 
          className="w-full py-5 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-500/20 active:scale-[0.98] transition-all"
        >
          🚪 Sign Out
        </button>
        <div className="flex justify-center flex-col items-center gap-4">
          <button onClick={handleDeleteAccount} className="text-red-500/60 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors">
            Delete My Account
          </button>
          <div className={`opacity-20 text-[8px] font-black uppercase tracking-[0.2em] ${labelCls}`}>
            Verified Version 2.5.0 • © 2025 ToneFit AI
          </div>
        </div>
      </div>
    </div>
  );
}
