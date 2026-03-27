import OutfitChecker from './OutfitChecker';
import { useState, useEffect, useContext } from 'react';
import UploadSection from './UploadSection';
import ResultsDisplay from './ResultsDisplay';
import HistoryPanel from './HistoryPanel';
import { ThemeContext } from '../App';
import { useLanguage } from '../i18n/LanguageContext';

function LoadingScreen() {
  const [step, setStep] = useState(0);
  const steps = [
    { emoji: '🔍', text: 'Scanning photo...', sub: 'Checking quality' },
    { emoji: '👤', text: 'Detecting face...', sub: 'Face detection running' },
    { emoji: '🎨', text: 'Analyzing skin tone...', sub: 'ITA + Lab color space' },
    { emoji: '👔', text: 'Building recommendations...', sub: '25+ fashion rules' },
    { emoji: '✨', text: 'Almost done...', sub: 'Preparing your style guide' },
  ];
  useEffect(() => {
    const interval = setInterval(() => setStep(p => p < steps.length - 1 ? p + 1 : p), 900);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
        <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-pink-500/30 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">{steps[step].emoji}</div>
      </div>
      <p className="text-white font-bold text-lg mb-1">{steps[step].text}</p>
      <p className="text-purple-300/70 text-sm">{steps[step].sub}</p>
      <div className="flex gap-2 mt-5">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-purple-500 w-6' : 'bg-white/20 w-2'}`} />
        ))}
      </div>
    </div>
  );
}

function HomeScreen({ user, onAnalyze, onTabChange }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const quickCards = [
    { icon: '🎨', label: 'Best Colors', tab: 'analyze' },
    { icon: '👔', label: 'Outfit Ideas', tab: 'analyze' },
    { icon: '✨', label: 'Accessories', tab: 'analyze' },
    { icon: '🌍', label: 'Seasonal', tab: 'analyze' },
  ];
  const trendingStyles = [
    { emoji: '👕', label: 'Oversized Tee', tag: 'Trending' },
    { emoji: '👖', label: 'Cargo Pants', tag: 'Hot' },
    { emoji: '💃', label: 'Coord Sets', tag: 'New' },
    { emoji: '🥻', label: 'Ethnic Fusion', tag: 'Popular' },
    { emoji: '🧥', label: 'Hoodies', tag: 'Trending' },
    { emoji: '👗', label: 'Maxi Dress', tag: 'Hot' },
  ];
  const firstName = user?.name?.split(' ')[0] || 'there';
  return (
    <div className="pb-4 space-y-6">
      <div className="pt-2">
        <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Good day,</p>
        <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Hey {firstName} 👋</h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Discover your perfect style with AI</p>
      </div>

      <button
        onClick={onAnalyze}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl text-white font-black text-base shadow-lg shadow-purple-900/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        ✨ Analyze Your Style
      </button>

      <div>
        <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Explore</p>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {quickCards.map((c) => (
            <button
              key={c.label}
              onClick={() => onTabChange(c.tab)}
              className={`flex-shrink-0 flex flex-col items-center gap-2 border rounded-2xl px-5 py-4 transition-all min-w-[90px] ${isDark ? 'bg-white/5 border-white/10 hover:border-purple-500/50 hover:bg-white/10' : 'bg-white border-purple-100 hover:border-purple-400 shadow-sm'}`}
            >
              <span className="text-2xl">{c.icon}</span>
              <span className={`text-xs font-medium text-center ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Trending Now 🔥</p>
        <div className="grid grid-cols-3 gap-3">
          {trendingStyles.map((s) => (
            <button
              key={s.label}
              onClick={onAnalyze}
              className={`flex flex-col items-center gap-2 border rounded-2xl p-3 transition-all active:scale-95 ${isDark ? 'bg-white/5 border-white/10 hover:border-purple-500/40 hover:bg-white/10' : 'bg-white border-purple-100 hover:border-purple-400 shadow-sm'}`}
            >
              <span className="text-3xl">{s.emoji}</span>
              <span className={`text-xs font-semibold text-center leading-tight ${isDark ? 'text-white/80' : 'text-gray-700'}`}>{s.label}</span>
              <span className="text-purple-400 text-[10px] font-bold bg-purple-500/10 px-2 py-0.5 rounded-full">{s.tag}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        onClick={() => onTabChange('outfit')}
        className="cursor-pointer bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-700/30 rounded-2xl p-4 flex items-center gap-4 hover:border-blue-500/50 transition-all"
      >
        <span className="text-4xl">👔</span>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">Outfit Compatibility Check</p>
          <p className="text-white/40 text-xs mt-0.5">Upload selfie + outfit → AI checks if it suits you</p>
        </div>
        <span className="text-white/30 text-lg">→</span>
      </div>
    </div>
  );
}

function SettingsScreen({ user, onLogout }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { t, language, changeLanguage } = useLanguage();
  const isDark = theme === 'dark';
  return (
    <div className="space-y-4 pt-2">
      <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>⚙️ Settings</h2>

      {/* User card */}
      <div className={`rounded-2xl p-4 flex items-center gap-4 border ${isDark ? 'bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-purple-700/30' : 'bg-white border-purple-100 shadow-sm'}`}>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{user?.email}</p>
        </div>
      </div>

      {/* Language */}
      <div className={`rounded-2xl p-4 flex items-center justify-between border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
        <div>
          <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>🌐 Language</p>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>App language</p>
        </div>
        <div className={`flex rounded-xl p-1 gap-1 ${isDark ? 'bg-white/10' : 'bg-gray-100 border border-gray-200'}`}>
          <button onClick={() => changeLanguage('hinglish')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'hinglish' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow' : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>🇮🇳</button>
          <button onClick={() => changeLanguage('en')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'en' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow' : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>🇬🇧</button>
        </div>
      </div>

      {/* Theme */}
      <div className={`rounded-2xl p-4 flex items-center justify-between border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
        <div>
          <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}</p>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Switch theme</p>
        </div>
        <button onClick={toggleTheme} className="relative w-14 h-7 rounded-full bg-purple-500 transition-all">
          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${isDark ? 'left-8' : 'left-1'}`} />
        </button>
      </div>

      {/* Logout */}
      <button onClick={onLogout} className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-2xl border border-red-500/20 transition">
        🚪 Logout
      </button>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { t } = useLanguage();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [currentGender, setCurrentGender] = useState('male');

  const handleReset = () => { setResults(null); setError(null); setUploadedImage(null); };
  const handleAnalysisComplete = (data) => { setResults({ ...data, gender: data.gender || currentGender }); setLoading(false); };

  const navItems = [
    { id: 'home',     emoji: '🏠', label: 'Home' },
    { id: 'analyze',  emoji: '📸', label: 'Analyze' },
    { id: 'outfit',   emoji: '👔', label: 'Outfit' },
    { id: 'history',  emoji: '📋', label: 'History' },
    { id: 'settings', emoji: '⚙️', label: 'Profile' },
  ];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== 'analyze') handleReset();
  };

  return (
    <div className={`min-h-screen text-white ${theme === 'dark' ? 'bg-[#050816]' : 'bg-gradient-to-br from-slate-200 via-purple-100/50 to-slate-200'}`} style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      <div className="fixed top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-purple-700/20 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-pink-700/20 blur-[120px] pointer-events-none z-0" />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <header className={`relative z-10 flex items-center justify-between px-4 py-4 border-b backdrop-blur-xl sticky top-0 ${theme === 'dark' ? 'border-white/10 bg-[#050816]/80' : 'border-purple-200 bg-slate-100/90 shadow-sm'}`}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-black text-white">SG</div>
          <span className={`font-black text-base bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent`}>StyleGuru AI</span>
        </div>
        <div className="flex items-center gap-2">
          {results && activeTab === 'analyze' && (
            <button onClick={handleReset} className="text-xs text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-full hover:bg-purple-500/10 transition">
              ← New
            </button>
          )}
          <button onClick={toggleTheme} className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sm">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 pt-4 pb-24">
        {activeTab === 'home' && (
          <HomeScreen user={user} onAnalyze={() => setActiveTab('analyze')} onTabChange={handleTabChange} />
        )}
        {activeTab === 'analyze' && (
          <>
            {!results && !loading && (
              <UploadSection
                onLoadingStart={() => { setLoading(true); setError(null); }}
                onAnalysisComplete={handleAnalysisComplete}
                onError={(msg) => { setError(msg); setLoading(false); }}
                onImageSelected={setUploadedImage}
                onGenderChange={setCurrentGender}
              />
            )}
            {loading && <LoadingScreen />}
            {error && (
              <div className="mt-8 rounded-2xl p-6 text-center border bg-red-500/10 border-red-500/30">
                <div className="text-4xl mb-3">😕</div>
                <p className="text-red-300 font-medium mb-1">Oops!</p>
                <p className="text-red-400/80 text-sm whitespace-pre-line">{error}</p>
                <button onClick={handleReset} className="mt-4 px-5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/20 text-sm font-medium transition">
                  {t('tryAgain')}
                </button>
              </div>
            )}
            {results && <ResultsDisplay data={results} uploadedImage={uploadedImage} onReset={handleReset} />}
          </>
        )}
        {activeTab === 'outfit' && <OutfitChecker />}
        {activeTab === 'history' && <HistoryPanel />}
        {activeTab === 'settings' && <SettingsScreen user={user} onLogout={onLogout} />}
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t ${theme === 'dark' ? 'bg-[#050816]/95 border-white/10' : 'bg-slate-100/95 border-purple-200 shadow-lg'}`}>
        <div className="max-w-lg mx-auto flex justify-around px-2 py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${activeTab === item.id ? 'text-purple-500' : theme === 'dark' ? 'text-white/30 hover:text-white/60' : 'text-gray-400 hover:text-gray-700'}`}
            >
              <span className={`text-xl transition-transform ${activeTab === item.id ? 'scale-110' : ''}`}>{item.emoji}</span>
              <span className={`text-[10px] font-semibold ${activeTab === item.id ? 'text-purple-400' : 'text-white/30'}`}>{item.label}</span>
              {activeTab === item.id && <div className="w-1 h-1 rounded-full bg-purple-400" />}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default Dashboard;
