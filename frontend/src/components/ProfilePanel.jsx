import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { usePlan } from '../context/PlanContext';
import { auth, loadProfile, logout } from '../api/styleApi';
import { updateProfile, deleteUser } from 'firebase/auth';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export default function ProfilePanel({ hideHeader = false, onOpenUpgrade }) {
  const { theme, setTheme } = useContext(ThemeContext);
  const { isPro, usage, validUntil } = usePlan();
  const { language, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
        if (!currentUser) {
          return;
        }

        setUser({
          name: currentUser.displayName || 'Anonymous User',
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          uid: currentUser.uid,
        });
        setEditName(currentUser.displayName || '');

        await loadProfile(currentUser.uid);

        const lastAnalysis = JSON.parse(localStorage.getItem('sg_last_analysis') || 'null');
        if (lastAnalysis) {
          setWardrobeStats({
            skinTone: lastAnalysis.skinTone,
            undertone: lastAnalysis.undertone,
            season: lastAnalysis.season,
            skinHex: lastAnalysis.skinHex,
            date: lastAnalysis.date,
          });
        }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${hideHeader ? 'pb-20' : ''}`}>
      {/* Profile Header */}
      <div className={`rounded-3xl p-8 border text-center relative overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-xl shadow-purple-500/5'}`}>
        <div className="relative z-10">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-1 mb-4 shadow-2xl">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover border-4 border-white/10" />
            ) : (
              <div className="w-full h-full rounded-full flex items-center justify-center text-3xl font-black text-white">
                {user?.name?.charAt(0)}
              </div>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl border text-center font-bold ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
              />
              <div className="flex gap-2">
                <button onClick={handleSaveName} disabled={saving} className="flex-1 py-3 bg-purple-600 text-white rounded-2xl font-bold">
                  {saving ? '...' : 'Save'}
                </button>
                <button onClick={() => setEditing(false)} className={`flex-1 py-3 rounded-2xl font-bold ${isDark ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-700'}`}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</h2>
              <p className={`opacity-60 text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{user?.email}</p>
              <button onClick={() => setEditing(true)} className="mt-4 px-6 py-2 bg-purple-600/20 text-purple-400 rounded-full text-xs font-black uppercase tracking-tighter hover:bg-purple-600/40 transition-all">
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Analyses', val: localStorage.getItem('sg_analysis_count') || '0', icon: '📸' },
          { label: 'Colors', val: (() => { try { return JSON.parse(localStorage.getItem('sg_saved_colors') || '[]').length; } catch { return 0; } })(), icon: '🎨' },
          { label: 'Score', val: '92%', icon: '🚀' },
        ].map((s, i) => (
          <div key={i} className={`rounded-3xl p-4 text-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="text-xl mb-1">{s.icon}</div>
            <div className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.val}</div>
            <div className={`text-[10px] uppercase font-bold opacity-50 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Color Analysis */}
      {wardrobeStats && (
        <div className={`rounded-3xl p-6 border overflow-hidden ${isDark ? 'bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20' : 'bg-purple-50 border-purple-100'}`}>
          <h3 className={`text-sm font-black uppercase mb-4 tracking-widest opacity-60 ${isDark ? 'text-white' : 'text-gray-900'}`}>Color Analysis</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <p className={`text-[10px] uppercase font-bold opacity-50 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Tone & Undertone</p>
                <p className={`font-bold capitalize ${isDark ? 'text-white' : 'text-gray-800'}`}>{wardrobeStats.skinTone} • {wardrobeStats.undertone}</p>
              </div>
              <div>
                <p className={`text-[10px] uppercase font-bold opacity-50 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Season</p>
                <p className={`font-bold capitalize ${isDark ? 'text-white' : 'text-gray-800'}`}>{wardrobeStats.season}</p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl shadow-2xl border-4 border-white/20" style={{ backgroundColor: wardrobeStats.skinHex }} />
            </div>
          </div>
        </div>
      )}

      {/* Plan Section */}
      <div className={`rounded-3xl p-6 border ${isPro ? (isDark ? 'bg-gradient-to-br from-yellow-500/20 to-transparent border-yellow-500/30' : 'bg-yellow-50 border-yellow-200') : (isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200')}`}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{isPro ? '💎 PRO Member' : '🆓 FREE Plan'}</h3>
            <p className={`text-xs opacity-60 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>{isPro ? `Valid until ${validUntil ? new Date(validUntil).toLocaleDateString() : '...'}` : 'Limited Features'}</p>
          </div>
          {!isPro && (
            <button onClick={onOpenUpgrade} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-[10px] font-black uppercase text-white">
              Upgrade
            </button>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <div className={`flex justify-between text-[10px] uppercase font-bold mb-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              <span>Analyses Used</span>
              <span className={isDark ? 'text-white' : 'text-gray-900'}>{usage?.analyses_count || 0} / 6</span>
            </div>
            <div className={`h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'} overflow-hidden`}>
              <div className="h-full bg-purple-500" style={{ width: `${(usage?.analyses_count / 6) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className={`flex justify-between text-[10px] uppercase font-bold mb-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              <span>Outfit Checks</span>
              <span className={isDark ? 'text-white' : 'text-gray-900'}>{usage?.outfit_checks_count || 0} / 10</span>
            </div>
            <div className={`h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'} overflow-hidden`}>
              <div className="h-full bg-pink-500" style={{ width: `${(usage?.outfit_checks_count / 10) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* App Settings */}
      <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
        <h3 className={`text-sm font-black uppercase mb-4 tracking-widest opacity-60 ${isDark ? 'text-white/60' : 'text-gray-900'}`}>App Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🌐</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Language</span>
            </div>
            <div className={`flex rounded-lg p-1 gap-1 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
              {[
                { id: 'en', l: '🇬🇧' },
                { id: 'hi', l: 'अ' },
                { id: 'hinglish', l: '🇮🇳' },
              ].map(lang => (
                <button
                  key={lang.id}
                  onClick={() => handleLanguageChange(lang.id)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${language === lang.id ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow' : isDark ? 'text-white/40 hover:text-white' : 'text-gray-500'}`}
                >
                  {lang.l}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🌙</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Dark Mode</span>
            </div>
            <button 
              onClick={handleThemeToggle}
              className={`w-12 h-6 rounded-full relative transition-all ${isDark ? 'bg-purple-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDark ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          {notifStatus !== 'unsupported' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔔</span>
                <div>
                  <span className={`font-bold block ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</span>
                  <span className="text-[10px] opacity-60 uppercase font-black uppercase tracking-tighter transition-all">
                    {notifStatus === 'granted' ? 'Enabled' : notifStatus === 'denied' ? 'Blocked' : 'Weekly Tips'}
                  </span>
                </div>
              </div>
              <button 
                onClick={notifStatus === 'granted' ? disableNotification : requestNotification}
                className={`w-12 h-6 rounded-full relative transition-all ${notifStatus === 'granted' ? 'bg-purple-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifStatus === 'granted' ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Help & Support */}
      <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
        <h3 className={`text-sm font-black uppercase mb-4 tracking-widest opacity-60 ${isDark ? 'text-white/60' : 'text-gray-900'}`}>Help & Support</h3>
        <div className="space-y-2">
          {[
            { l: 'Help & FAQ', i: '❓', act: () => handleSupportEmail('help') },
            { l: 'Report Issue', i: '🐛', act: () => handleSupportEmail('issue') },
            { l: 'Request Feature', i: '💡', act: () => handleSupportEmail('feature') },
            { l: 'Share App', i: '📱', act: handleShare },
            { l: 'Rate Us', i: '⭐', act: () => window.open('https://play.google.com/store/apps/details?id=com.tonefit', '_blank') },
          ].map((sub, idx) => (
            <button key={idx} onClick={sub.act} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
              <span className="text-xl">{sub.i}</span>
              <span className={`font-bold flex-1 text-left ${isDark ? 'text-white' : 'text-gray-900'}`}>{sub.l}</span>
              <span className="opacity-30">→</span>
            </button>
          ))}
        </div>
      </div>

      {/* Account Section */}
      <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
        <h3 className={`text-sm font-black uppercase mb-4 tracking-widest opacity-60 ${isDark ? 'text-white/60' : 'text-gray-900'}`}>Account</h3>
        <div className="space-y-2">
          <button onClick={handleDownloadData} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
            <span className="text-xl">📥</span>
            <span className={`font-bold flex-1 text-left ${isDark ? 'text-white' : 'text-gray-900'}`}>Download My Data</span>
          </button>
          <button onClick={() => window.open('https://styleguruai.in', '_blank')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
            <span className="text-xl">🌐</span>
            <span className={`font-bold flex-1 text-left ${isDark ? 'text-white' : 'text-gray-900'}`}>Visit My Website</span>
          </button>
        </div>
      </div>

      {/* Legal */}
      <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
        <h3 className={`text-sm font-black uppercase mb-4 tracking-widest opacity-60 ${isDark ? 'text-white/60' : 'text-gray-900'}`}>Legal</h3>
        <div className="space-y-2">
          <button onClick={() => window.open('/privacy', '_blank')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
            <span className="text-xl">📄</span>
            <span className={`font-bold flex-1 text-left ${isDark ? 'text-white' : 'text-gray-900'}`}>Privacy Policy</span>
          </button>
          <button onClick={() => window.open('/terms', '_blank')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
            <span className="text-xl">⚖️</span>
            <span className={`font-bold flex-1 text-left ${isDark ? 'text-white' : 'text-gray-900'}`}>Terms of Service</span>
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="space-y-3 pb-10">
        <button 
          onClick={async () => { if(window.confirm('Logout?')) { await logout(); localStorage.clear(); navigate('/'); } }} 
          className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-3xl font-black uppercase shadow-lg shadow-red-500/20"
        >
          🚪 Logout
        </button>
        <button onClick={handleDeleteAccount} className="w-full py-4 text-red-500 font-bold text-sm">
          Delete Account
        </button>
      </div>

      <div className={`text-center opacity-30 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
        Version 2.4.0 • ToneFit AI
      </div>
    </div>
  );
}
