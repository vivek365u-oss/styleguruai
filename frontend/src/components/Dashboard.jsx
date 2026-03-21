import { useState } from 'react';
import UploadSection from './UploadSection';
import ResultsDisplay from './ResultsDisplay';
import HistoryPanel from './HistoryPanel';

function Dashboard({ user, onLogout }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('analyze');

  const handleReset = () => {
    setResults(null);
    setError(null);
    setUploadedImage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">

      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500 rounded-full opacity-5 blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-white/10 bg-white/5 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
          <span className="text-white font-black text-sm tracking-tight">SG</span>
         </div>
            <div>
            <h1 className="text-white font-black text-xl tracking-tight">StyleGuru</h1>
            <p className="text-purple-300 text-xs">AI Fashion Advisor</p>
            </div>
          </div>

          {/* Nav tabs */}
          <div className="hidden md:flex bg-white/10 rounded-xl p-1 gap-1">
            {[
              { id: 'analyze', label: '📸 Analyze', },
              { id: 'history', label: '📋 History', },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); handleReset(); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-900 shadow'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-white text-sm font-semibold">{user.name}</p>
              <p className="text-white/40 text-xs">{user.email}</p>
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-xl text-sm transition-all border border-white/10"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-5xl mx-auto px-4 py-8">

        {activeTab === 'analyze' && (
          <>
            {!results && !loading && (
              <UploadSection
                onLoadingStart={() => { setLoading(true); setError(null); }}
                onAnalysisComplete={(data) => { setResults(data); setLoading(false); }}
                onError={(msg) => { setError(msg); setLoading(false); }}
                onImageSelected={setUploadedImage}
              />
            )}

            {loading && <LoadingScreen />}

            {error && (
              <div className="mt-8 bg-red-500/10 border border-red-500/30 rounded-3xl p-8 text-center">
                <div className="text-5xl mb-4">😕</div>
                <p className="text-red-300 text-lg font-medium mb-2">Oops!</p>
                <p className="text-red-400/80 whitespace-pre-line text-sm max-w-md mx-auto">{error}</p>
                <button
                  onClick={handleReset}
                  className="mt-6 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition font-medium border border-red-500/20"
                >
                  Dobara Try Karo
                </button>
              </div>
            )}

            {results && (
              <ResultsDisplay
                data={results}
                uploadedImage={uploadedImage}
                onReset={handleReset}
              />
            )}
          </>
        )}

        {activeTab === 'history' && <HistoryPanel />}
      </main>
    </div>
  );
}

function LoadingScreen() {
  const [step, setStep] = useState(0);
  const steps = [
    { emoji: '🔍', text: 'Photo scan ho rahi hai...', sub: 'Quality check kar rahe hain' },
    { emoji: '👤', text: 'Chehra dhundh rahe hain...', sub: 'Face detection running' },
    { emoji: '🎨', text: 'Skin tone analyze ho raha hai...', sub: '5 regions se color sample kar rahe hain' },
    { emoji: '👔', text: 'Outfit recommendations ban rahi hain...', sub: '25+ fashion rules apply ho rahe hain' },
    { emoji: '✨', text: 'Almost done...', sub: 'Tumhara personal style guide tayar ho raha hai' },
  ];

  useState(() => {
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
        <div className="absolute inset-2 rounded-full border-2 border-pink-500/30 border-b-transparent animate-spin" style={{animationDirection:'reverse', animationDuration:'1.5s'}}></div>
        <div className="absolute inset-0 flex items-center justify-center text-4xl">
          {steps[step].emoji}
        </div>
      </div>

      <h3 className="text-white text-xl font-bold mb-1">{steps[step].text}</h3>
      <p className="text-purple-300/70 text-sm">{steps[step].sub}</p>

      <div className="flex justify-center gap-2 mt-6">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i <= step ? 'bg-purple-500 w-6' : 'bg-white/20 w-2'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;