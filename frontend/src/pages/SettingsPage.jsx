import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../App';
import { useLanguage } from '../i18n/LanguageContext';
import { auth, logout } from '../api/styleApi';

function SettingsPage() {
  const { theme, setTheme } = useContext(ThemeContext);
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [notifications, setNotifications] = useState({
    push: JSON.parse(localStorage.getItem('sg_notif_push') || 'true'),
    email: JSON.parse(localStorage.getItem('sg_notif_email') || 'false'),
    tips: JSON.parse(localStorage.getItem('sg_notif_tips') || 'true'),
  });

  const [user, setUser] = useState(null);

  useEffect(() => {
    if (auth.currentUser) {
      setUser(auth.currentUser);
    }
  }, []);

  const handleThemeChange = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('sg_language', lang);
  };

  const handleNotificationChange = (key) => {
    const newValue = !notifications[key];
    setNotifications(prev => ({ ...prev, [key]: newValue }));
    localStorage.setItem(`sg_notif_${key}`, JSON.stringify(newValue));
  };

  const handleRateApp = () => {
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.styleguruai';
    window.open(playStoreUrl, '_blank');
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
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        alert('Share link copied to clipboard!');
      } catch (err) {
        console.error('Error copying to clipboard:', err);
      }
    }
  };

  const handleContactUs = () => {
    const email = 'support@styleguruai.com';
    const subject = 'StyleGuru App - Contact Us';
    const body = `Hi StyleGuru Team,\n\nI would like to contact you regarding:\n\n[Please describe your query here]\n\n---\nUser Email: ${user?.email || 'Not logged in'}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logout();
        localStorage.clear();
        navigate('/');
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
  };

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
          <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
          <button
            onClick={() => navigate('/profile')}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
          >
            ❤️ Profile
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Appearance */}
        <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h3 className={`text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>🌙 Appearance</h3>
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
              <label className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Dark Mode</label>
              <button
                onClick={handleThemeChange}
                className={`relative w-14 h-8 rounded-full transition-all ${
                  isDark ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                    isDark ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className={`flex items-center justify-between p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
              <label className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Language</label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className={`px-3 py-2 rounded-lg border font-semibold ${
                  isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="en">English 🇺🇸</option>
                <option value="hi">हिंदी 🇮🇳</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h3 className={`text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>🔔 Notifications</h3>
          <div className="space-y-4">
            {[
              { key: 'push', label: 'Push Notifications', emoji: '🔔' },
              { key: 'email', label: 'Email Updates', emoji: '📧' },
              { key: 'tips', label: 'Daily Fashion Tips', emoji: '💡' },
            ].map(({ key, label, emoji }) => (
              <div key={key} className={`flex items-center justify-between p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <label className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{emoji} {label}</label>
                <button
                  onClick={() => handleNotificationChange(key)}
                  className={`relative w-14 h-8 rounded-full transition-all ${
                    notifications[key] ? 'bg-purple-600' : isDark ? 'bg-white/20' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                      notifications[key] ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Support */}
        <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h3 className={`text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>👥 Support</h3>
          <div className="space-y-2">
            <button
              onClick={() => window.open('https://styleguruai.com/faq', '_blank')}
              className={`w-full text-left p-4 rounded-2xl transition-all ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>❓ Help & FAQ</p>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Frequently asked questions</p>
            </button>

            <button
              onClick={handleContactUs}
              className={`w-full text-left p-4 rounded-2xl transition-all ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>📧 Contact Us</p>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Email us your questions</p>
            </button>

            <button
              onClick={() => window.open('https://styleguruai.com/report-bug', '_blank')}
              className={`w-full text-left p-4 rounded-2xl transition-all ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>🐛 Report Issue</p>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Report bugs and problems</p>
            </button>

            <button
              onClick={() => window.open('https://styleguruai.com/features', '_blank')}
              className={`w-full text-left p-4 rounded-2xl transition-all ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>💡 Request Feature</p>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Suggest new features</p>
            </button>

            <button
              onClick={handleRateApp}
              className={`w-full text-left p-4 rounded-2xl transition-all ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>⭐ Rate Us on Play Store</p>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Love StyleGuru? Rate us!</p>
            </button>

            <button
              onClick={handleShareApp}
              className={`w-full text-left p-4 rounded-2xl transition-all ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>📱 Share App</p>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Tell friends about StyleGuru</p>
            </button>
          </div>
        </div>

        {/* Account */}
        <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h3 className={`text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>🔐 Account</h3>
          <div className="space-y-2">
            <button
              onClick={() => window.open('https://styleguruai.com/security', '_blank')}
              className={`w-full text-left p-4 rounded-2xl transition-all ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>🔑 Security Settings</p>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Change password, 2FA</p>
            </button>

            <button
              onClick={() => window.open('https://styleguruai.com/download-data', '_blank')}
              className={`w-full text-left p-4 rounded-2xl transition-all ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>📥 Download My Data</p>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>GDPR - Export your data</p>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  window.open('https://styleguruai.com/delete-account', '_blank');
                }
              }}
              className={`w-full text-left p-4 rounded-2xl transition-all ${
                isDark ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30' : 'bg-red-50 hover:bg-red-100 border border-red-200'
              }`}
            >
              <p className={`font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>🗑️ Delete Account</p>
              <p className={`text-sm ${isDark ? 'text-red-400/70' : 'text-red-600/70'}`}>Permanently delete your account</p>
            </button>
          </div>
        </div>

        {/* About */}
        <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h3 className={`text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>ℹ️ About</h3>
          <div className="space-y-3">
            <div>
              <p className={`text-xs uppercase tracking-widest ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Version</p>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>1.0.0</p>
            </div>
            <div>
              <p className={`text-xs uppercase tracking-widest ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Build</p>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>001</p>
            </div>
            <div>
              <p className={`text-xs uppercase tracking-widest ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Last Updated</p>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{new Date().toLocaleDateString('en-IN')}</p>
            </div>
            <button
              onClick={() => window.open('https://styleguruai.com', '_blank')}
              className={`w-full mt-4 p-3 rounded-lg font-semibold transition-all ${
                isDark ? 'bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/40' : 'bg-purple-100 border border-purple-300 text-purple-700 hover:bg-purple-200'
              }`}
            >
              🌐 Visit Website
            </button>
          </div>
        </div>

        {/* Legal */}
        <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h3 className={`text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>⚖️ Legal</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/privacy')}
              className={`w-full text-left p-4 rounded-2xl transition-all ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>📄 Privacy Policy</p>
            </button>
            <button
              onClick={() => navigate('/terms')}
              className={`w-full text-left p-4 rounded-2xl transition-all ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>⚖️ Terms of Service</p>
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full mb-8 px-6 py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-black rounded-2xl transition-all shadow-lg"
        >
          🚪 Logout
        </button>

        {/* Spacing */}
        <div className="h-4" />
      </div>
    </div>
  );
}

export default SettingsPage;
