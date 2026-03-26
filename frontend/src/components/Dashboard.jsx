import OutfitChecker from './OutfitChecker';
import { useState, useEffect, useContext } from 'react';
import UploadSection from './UploadSection';
import ResultsDisplay from './ResultsDisplay';
import HistoryPanel from './HistoryPanel';
import { ThemeContext } from '../App';

function LoadingScreen() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [step, setStep] = useState(0);
  const steps = [
    { emoji: '🔍', text: 'Scanning your photo...', sub: 'Checking quality' },
    { emoji: '👤', text: 'Detecting face...', sub: 'Face detection running' },
    { emoji: '🎨', text: 'Analyzing skin tone...', sub: 'ITA method + Lab color space' },
    { emoji: '👔', text: 'Building outfit recommendations...', sub: 'Applying 25+ fashion rules' },
    { emoji: '✨', text: 'Almost done...', sub: 'Preparing your personal style guide' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-16 text-center">
      <div className="relative w-28 h-28 mx-auto mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
        <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-2 border-pink-500/30 border-b-transparent animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        <div className="absolute inset-0 flex items-center justify-center text-4xl">
          {steps[step].emoji}
        </div>
      </div>
      <h3 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>{steps[step].text}</h3>
      <p className={`text-sm ${isDark ? 'text-purple-300/70' : 'text-purple-600'}`}>{steps[step].sub}</p>
      <div className="flex justify-center gap-2 mt-6">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-purple-500 w-6' : isDark ? 'bg-white/20 w-2' : 'bg-gray-200 w-2'}`} />
        ))}
      </div>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('analyze');
  const [currentGender, setCurrentGender] = useState('male');

  const handleReset = () => {
    setResults(null);
    setError(null);
    setUploadedImage(null);
  };

  const handleAnalysisComplete = (data) => {
    const enrichedData = { ...data, gender: data.gender || currentGender };
    setResults(enrichedData);
    setLoading(false);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark
      ? 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900'
      : 'bg-gradient-to-br from-slate-200 via-purple-100/50 to-slate-200'}`}>

      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-purple-500 opacity-5' : 'bg-purple-400 opacity-25'}`}></div>
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-pink-500 opacity-5' : 'bg-pink-400 opacity-20'}`}></div>
        {!isDark && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-violet-200/50 blur-3xl"></div>}
      </div>

      {/* Header */}
      <header className={`relative border-b sticky top-0 z-50 backdrop-blur-xl ${isDark
        ? 'border-white/10 bg-white/5'
        : 'border-purple-200 bg-slate-100/90 shadow-md shadow-purple-200/40'}`}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-white font-black text-sm tracking-tight">SG</span>
            </div>
            <div>
              <h1 className={`font-black text-xl tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>StyleGuru</h1>
              <p className={`text-xs font-medium ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>AI Fashion Advisor</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className={`hidden md:flex rounded-xl p-1 gap-1 ${isDark ? 'bg-white/10' : 'bg-slate-200 border border-purple-200'}`}>
            {[
              { id: 'analyze', label: '📸 Analyze' },
              { id: 'outfit', label: '👔 Outfit Check' },
              { id: 'history', label: '📋 History' },
              { id: 'settings', label: '⚙️ Settings' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); handleReset(); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? isDark
                      ? 'bg-white text-purple-900 shadow'
                      : 'bg-white text-purple-700 shadow shadow-purple-300/60 border border-purple-200'
                    : isDark
                      ? 'text-white/60 hover:text-white'
                      : 'text-purple-500 hover:text-purple-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{user.name}</p>
              <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{user.email}</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isDark
                ? 'bg-white/10 hover:bg-white/20 text-yellow-300'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-100'}`}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t px-4 py-2 ${isDark
        ? 'bg-slate-900/95 border-white/10'
        : 'bg-slate-100/95 border-purple-200 shadow-lg shadow-purple-200/30'}`}>
        <div className="flex justify-around">
          {[
            { id: 'analyze', label: 'Analyze', emoji: '📸' },
            { id: 'outfit', label: 'Outfit', emoji: '👔' },
            { id: 'history', label: 'History', emoji: '📋' },
            { id: 'settings', label: 'Settings', emoji: '⚙️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); handleReset(); }}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'text-purple-500'
                  : isDark ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <span className="text-xl">{tab.emoji}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="relative max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">

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
              <div className={`mt-8 rounded-3xl p-8 text-center border ${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50/80 border-red-200 shadow-sm shadow-red-100'}`}>
                <div className="text-5xl mb-4">😕</div>
                <p className={`text-lg font-medium mb-2 ${isDark ? 'text-red-300' : 'text-red-600'}`}>Oops!</p>
                <p className={`whitespace-pre-line text-sm max-w-md mx-auto ${isDark ? 'text-red-400/80' : 'text-red-500'}`}>{error}</p>
                <button onClick={handleReset} className={`mt-6 px-6 py-3 rounded-xl transition font-medium border ${isDark ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/20' : 'bg-red-100 hover:bg-red-200 text-red-600 border-red-200'}`}>
                  Try Again
                </button>
              </div>
            )}
            {results && <ResultsDisplay data={results} uploadedImage={uploadedImage} onReset={handleReset} />}
          </>
        )}

        {activeTab === 'outfit' && <OutfitChecker />}
        {activeTab === 'history' && <HistoryPanel />}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="mt-8 max-w-md mx-auto">
            <div className={`rounded-3xl p-8 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-purple-100 shadow-xl shadow-purple-100/30 backdrop-blur-sm'}`}>
              <h2 className={`text-2xl font-black mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>⚙️ Settings</h2>

              {/* Theme Toggle */}
              <div className={`flex items-center justify-between p-5 rounded-2xl border mb-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-purple-50/60 border-purple-100'}`}>
                <div>
                  <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Switch theme</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 bg-purple-500`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${isDark ? 'left-8' : 'left-1'}`}></div>
                </button>
              </div>

              {/* System Theme Info */}
              <div className={`p-4 rounded-2xl border mb-4 ${isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-100'}`}>
                <p className={`text-xs ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                  💡 Also switches automatically based on your system theme!
                </p>
              </div>

              {/* User Info */}
              <div className={`p-5 rounded-2xl border mb-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-purple-50/60 border-purple-100'}`}>
                <p className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>👤 Account</p>
                <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-700'}`}>{user.name}</p>
                <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{user.email}</p>
              </div>

              {/* Logout */}
              <button
                onClick={onLogout}
                className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-2xl border border-red-500/20 transition"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;