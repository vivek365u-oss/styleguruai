import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';

import { usePlan } from '../context/PlanContext';
import { auth, loadProfile } from '../api/styleApi';
import { updateProfile } from 'firebase/auth';
import { logout } from '../api/styleApi';

function ProfilePage() {
  const { theme } = useContext(ThemeContext);
  const { isPro, usage } = usePlan();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [wardrobeStats, setWardrobeStats] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          navigate('/login');
          return;
        }

        setUser({
          name: currentUser.displayName || 'Anonymous User',
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          uid: currentUser.uid,
        });
        setEditName(currentUser.displayName || '');

        // Load profile data (currently unused, but kept for future fetch)
        await loadProfile(currentUser.uid);

        // Load wardrobe stats
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
  }, [navigate]);

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

  const handleShareApp = async () => {
    const text = `Check out StyleGuru! 👗 The AI-powered app that finds the perfect colors for you based on your skin tone. Download now! 🎨`;
    const url = 'https://play.google.com/store/apps/details?id=com.styleguruai';

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'StyleGuru - Your Personal Color Analyst',
          text: text,
          url: url,
        });
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        alert('Share link copied to clipboard!');
      } catch (err) {
        console.error('Error copying to clipboard:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-white'}`}>
        <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-white'}`}>
        <div className="text-center">
          <p className={isDark ? 'text-white' : 'text-gray-900'}>Please log in to view profile</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-white to-gray-50'}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'border-white/10 bg-white/5 backdrop-blur-xl' : 'border-gray-200 bg-white/80 backdrop-blur-xl'}`}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
          >
            ← Back
          </button>
          <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>My Profile</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Header - Premium Design */}
        <div className={`rounded-3xl p-8 border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-lg'}`}>
          {/* Avatar */}
          <div className="relative inline-block mb-6">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/40 border-4 border-white/20">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-6xl font-black text-white">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </div>
            <button className={`absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'}`}>
              📷
            </button>
          </div>

          {/* User Info */}
          {editing ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border text-center text-lg font-black ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                placeholder="Enter your name"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditName(user?.name || '');
                  }}
                  className={`flex-1 px-4 py-2 rounded-xl border font-semibold transition-all ${isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-900 hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4 space-y-2">
              <h2 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</h2>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{user?.email}</p>
              <p className={`text-xs mt-3 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>StyleGuru Member</p>
              <button
                onClick={() => setEditing(true)}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold transition-all"
              >
                ✏️ Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-4">
          <div className={`rounded-2xl p-4 text-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
            <p className="text-2xl mb-2">📸</p>
            <p className={`font-black text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{parseInt(localStorage.getItem('sg_analysis_count') || '0')}</p>
            <p className={`text-xs uppercase font-bold ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Analyses</p>
          </div>
          <div className={`rounded-2xl p-4 text-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
            <p className="text-2xl mb-2">❤️</p>
            <p className={`font-black text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{(() => { try { return JSON.parse(localStorage.getItem('sg_saved_colors') || '[]').length; } catch { return 0; } })()}</p>
            <p className={`text-xs uppercase font-bold ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Saved Colors</p>
          </div>
          <div className={`rounded-2xl p-4 text-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
            <p className="text-2xl mb-2">⭐</p>
            <p className={`font-black text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>92%</p>
            <p className={`text-xs uppercase font-bold ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Score</p>
          </div>
        </div>

        {/* Skin Tone Analysis Card */}
        {wardrobeStats && (
          <div className={`rounded-3xl p-6 border ${isDark ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'}`}>
            <h3 className={`text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>🎨 Your Color Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white/80'}`}>
                <p className={`text-xs uppercase font-bold mb-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Tone</p>
                <p className={`font-black capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{wardrobeStats.skinTone}</p>
              </div>
              <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white/80'}`}>
                <p className={`text-xs uppercase font-bold mb-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Undertone</p>
                <p className={`font-black capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{wardrobeStats.undertone}</p>
              </div>
              <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white/80'}`}>
                <p className={`text-xs uppercase font-bold mb-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Season</p>
                <p className={`font-black capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{wardrobeStats.season}</p>
              </div>
              <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white/80'} flex flex-col items-center justify-center`}>
                <div className="w-10 h-10 rounded-lg border-2 border-white/30 shadow-lg" style={{ backgroundColor: wardrobeStats.skinHex }} />
              </div>
            </div>
          </div>
        )}

        {/* Subscription Status */}
        <div className={`rounded-3xl p-6 border ${isPro ? (isDark ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30' : 'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300') : (isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm')}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className={`text-lg font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{isPro ? '⚡ PRO Member' : '🆓 Free Plan'}</h3>
              {isPro && (
                <p className={`text-sm ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>Premium features unlocked ✓</p>
              )}
            </div>
            {!isPro && (
              <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold text-sm">
                Upgrade
              </button>
            )}
          </div>
          {!isPro && (
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className={isDark ? 'text-white/60' : 'text-gray-600'}>Analyses Used</span>
                  <span className={isDark ? 'text-white/80' : 'text-gray-800'}>{usage?.analyses_count || 0}/6</span>
                </div>
                <div className={`h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                  <div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${Math.min(100, ((usage?.analyses_count || 0) / 6) * 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className={isDark ? 'text-white/60' : 'text-gray-600'}>Outfit Checks</span>
                  <span className={isDark ? 'text-white/80' : 'text-gray-800'}>{usage?.outfit_checks_count || 0}/10</span>
                </div>
                <div className={`h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                  <div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${Math.min(100, ((usage?.outfit_checks_count || 0) / 10) * 100)}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Menu Options */}
        <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h3 className={`text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>📋 Features</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📸</span>
                <div>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Analyze Colors</p>
                  <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Find your perfect colors</p>
                </div>
              </div>
              <span className={`text-lg ${isDark ? 'text-white/30' : 'text-gray-400'}`}>→</span>
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">👗</span>
                <div>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>My Wardrobe</p>
                  <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Organize saved items</p>
                </div>
              </div>
              <span className={`text-lg ${isDark ? 'text-white/30' : 'text-gray-400'}`}>→</span>
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🛠️</span>
                <div>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Tools</p>
                  <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>View all premium tools</p>
                </div>
              </div>
              <span className={`text-lg ${isDark ? 'text-white/30' : 'text-gray-400'}`}>→</span>
            </button>

            <button
              onClick={() => navigate('/privacy')}
              className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🔐</span>
                <div>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Privacy</p>
                  <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Your data & privacy</p>
                </div>
              </div>
              <span className={`text-lg ${isDark ? 'text-white/30' : 'text-gray-400'}`}>→</span>
            </button>

            <button
              onClick={() => navigate('/terms')}
              className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">⚖️</span>
                <div>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Terms & Conditions</p>
                  <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Legal agreements</p>
                </div>
              </div>
              <span className={`text-lg ${isDark ? 'text-white/30' : 'text-gray-400'}`}>→</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleShareApp}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black rounded-2xl transition-all shadow-lg"
          >
            📱 Share StyleGuru
          </button>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                logout().then(() => {
                  localStorage.clear();
                  navigate('/');
                }).catch(err => console.error('Logout failed:', err));
              }
            }}
            className={`w-full px-4 py-3 font-black rounded-2xl transition-all ${isDark ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
              }`}
          >
            🚪 Logout
          </button>
        </div>

        {/* Spacing */}
        <div className="h-4" />
      </div>
    </div>
  );
}

export default ProfilePage;
