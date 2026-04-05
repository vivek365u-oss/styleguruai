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

  const handleDownloadData = async () => {
    try {
      const userData = {
        email: user?.email,
        displayName: user?.displayName,
        exportedAt: new Date().toISOString(),
        preferences: {
          theme,
          language,
          notifications,
        }
      };
      const json = JSON.stringify(userData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `styleguruai-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('✅ Your data has been downloaded!');
    } catch (err) {
      console.error('Error downloading data:', err);
      alert('Error downloading data');
    }
  };

  const handleHelpFAQ = () => {
    const email = 'support@styleguruai.com';
    const subject = 'StyleGuru App - Help & FAQ';
    const body = `Hi StyleGuru Team,\n\nI have a question about StyleGuru:\n\n[Please describe your question here]\n\n---\nUser Email: ${user?.email || 'Not logged in'}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleReportIssue = () => {
    const email = 'support@styleguruai.com';
    const subject = 'StyleGuru App - Report Issue';
    const body = `Hi StyleGuru Team,\n\nI'm reporting an issue:\n\nProblem Description:\n[Please describe the issue here]\n\nSteps to Reproduce:\n[How can we repeat this issue?]\n\nExpected Behavior:\n[What should happen?]\n\n---\nUser Email: ${user?.email || 'Not logged in'}\nDevice: ${navigator.userAgent}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleRequestFeature = () => {
    const email = 'support@styleguruai.com';
    const subject = 'StyleGuru App - Feature Request';
    const body = `Hi StyleGuru Team,\n\nI would like to request a new feature:\n\nFeature Description:\n[What feature would you like to see?]\n\nWhy would this be useful:\n[Explain how this feature would help you]\n\n---\nUser Email: ${user?.email || 'Not logged in'}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSecuritySettings = () => {
    const email = 'support@styleguruai.com';
    const subject = 'StyleGuru App - Security & Password Help';
    const body = `Hi StyleGuru Team,\n\nI need help with security settings or password reset:\n\n[Please describe what you need]\n\n---\nUser Email: ${user?.email || 'Not logged in'}`;
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

        {/* Support & Feedback - All Email Based */}
        <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h3 className={`text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>💬 Help & Support</h3>
          <div className="space-y-2">
            <button
              onClick={handleHelpFAQ}
              className={`w-full text-left p-4 rounded-2xl transition-all ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>❓ Help & FAQ</p>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Email us your questions</p>
            </button>

            <button
              onClick={handleReportIssue}
              className={`w-full text-left p-4 rounded-2xl transition-all ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>🐛 Report Issue</p>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Report bugs and problems</p>
            </button>

            <button
              onClick={handleRequestFeature}
              className={`w-full text-left p-4 rounded-2xl transition-all ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>💡 Request Feature</p>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Suggest new features</p>
            </button>
          </div>
        </div>

        {/* Account & Security */}
        <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h3 className={`text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>🔐 Account & Security</h3>
          <div className="space-y-2">
            <button
              onClick={handleSecuritySettings}
              className={`w-full text-left p-4 rounded-2xl transition-all ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>🔑 Security Settings</p>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Password & account security</p>
            </button>

            <button
              onClick={handleDownloadData}
              className={`w-full text-left p-4 rounded-2xl transition-all ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>📥 Download My Data</p>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Export your data (JSON)</p>
            </button>
          </div>
        </div>

        {/* About */}
        <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h3 className={`text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>ℹ️ About</h3>
          <div className="space-y-3">
            <button
              onClick={() => window.open('https://styleguruai.com', '_blank')}
              className={`w-full p-3 rounded-lg font-semibold transition-all ${
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
