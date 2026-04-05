import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../App';
import { useLanguage } from '../i18n/LanguageContext';
import { usePlan } from '../context/PlanContext';
import { auth, loadProfile } from '../api/styleApi';
import { updateProfile } from 'firebase/auth';

function ProfilePage() {
  const { theme } = useContext(ThemeContext);
  const { t } = useLanguage();
  const { isPro, usage } = usePlan();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
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

        // Load profile data
        const profileData = await loadProfile(currentUser.uid);
        if (profileData) {
          setProfile(profileData);
        }

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
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-white to-gray-50'}`}>
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
          <button
            onClick={() => navigate('/settings')}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* User Info Card */}
        <div className={`rounded-3xl p-8 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-4xl text-white font-black">{user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <button className={`absolute bottom-0 right-0 p-2 rounded-full ${isDark ? 'bg-purple-600' : 'bg-purple-500'} text-white shadow-lg hover:scale-110 transition-transform`}>
                📷
              </button>
            </div>

            {/* Name & Email */}
            <div className="flex-1 text-center md:text-left">
              {editing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter your name"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveName}
                      disabled={saving}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setEditName(user.name);
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg border ${isDark ? 'border-white/20 text-white' : 'border-gray-300 text-gray-900'}`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</h2>
                  <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{user.email}</p>
                  <p className={`text-xs mt-2 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Member since {new Date(user.uid).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}</p>
                  <button
                    onClick={() => setEditing(true)}
                    className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-colors"
                  >
                    ✏️ Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Skin Tone Analysis */}
        {wardrobeStats && (
          <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
            <h3 className={`text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>🎨 My Color Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-xs uppercase tracking-widest mb-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Skin Tone</p>
                <p className={`font-black text-lg capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{wardrobeStats.skinTone}</p>
              </div>
              <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-xs uppercase tracking-widest mb-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Undertone</p>
                <p className={`font-black text-lg capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{wardrobeStats.undertone}</p>
              </div>
              <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-xs uppercase tracking-widest mb-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Season</p>
                <p className={`font-black text-lg capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{wardrobeStats.season}</p>
              </div>
              <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'} flex flex-col items-center`}>
                <p className={`text-xs uppercase tracking-widest mb-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Color</p>
                <div className="w-12 h-12 rounded-lg border-2 border-white/20 shadow-lg" style={{ backgroundColor: wardrobeStats.skinHex }} />
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-colors"
            >
              🔄 Retake Test
            </button>
          </div>
        )}

        {/* Subscription Status */}
        <div className={`rounded-3xl p-6 border ${isDark ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'}`}>
          <h3 className={`text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-purple-900'}`}>🆚 Subscription Status</h3>
          <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/10' : 'bg-white/50'} mb-4`}>
            <p className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-purple-900'}`}>{isPro ? 'PRO' : 'FREE'} Plan</p>
            <div className="space-y-2 text-sm">
              {isPro ? (
                <>
                  <p className={`${isDark ? 'text-white/80' : 'text-purple-800'}`}>✅ Unlimited Outfit Checks</p>
                  <p className={`${isDark ? 'text-white/80' : 'text-purple-800'}`}>✅ Advanced Color Analytics</p>
                  <p className={`${isDark ? 'text-white/80' : 'text-purple-800'}`}>✅ Priority Support</p>
                  <p className={`${isDark ? 'text-white/80' : 'text-purple-800'}`}>✅ Ad-free Experience</p>
                </>
              ) : (
                <>
                  <p className={`${isDark ? 'text-white/80' : 'text-purple-800'}`}>📊 Used: {usage?.outfit_checks_count || 0}/10 checks this month</p>
                  <p className={`${isDark ? 'text-white/80' : 'text-purple-800'}`}>⬆️ Upgrade to PRO for unlimited</p>
                </>
              )}
            </div>
          </div>
          <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-colors">
            {isPro ? '♻️ Renew Subscription' : '⬆️ Upgrade to Pro'}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className={`p-4 rounded-2xl border font-semibold transition-all ${
              isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
            }`}
          >
            👗 View Wardrobe
          </button>
          <button
            onClick={handleShareApp}
            className="p-4 rounded-2xl border font-semibold transition-all bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-500 hover:from-purple-700 hover:to-pink-700"
          >
            📱 Share App
          </button>
        </div>

        {/* Spacing */}
        <div className="h-4" />
      </div>
    </div>
  );
}

export default ProfilePage;
