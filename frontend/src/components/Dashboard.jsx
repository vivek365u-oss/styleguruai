import OutfitChecker from './OutfitChecker';
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadSection from './UploadSection';
import ResultsDisplay from './ResultsDisplay';
import CoupleResults from './CoupleResults';
import HistoryPanel from './HistoryPanel';
import { ThemeContext } from '../App';
import { useLanguage } from '../i18n/LanguageContext';
import AdSense from '../AdSense';
import { saveProfile, auth, incrementUsage } from '../api/styleApi';
import WardrobePanel from './WardrobePanel';
import { saveWardrobeItem, activateProSubscription } from '../api/styleApi';
import { usePlan } from '../context/PlanContext';
import PaywallModal from './PaywallModal';
import OOTDCard from './OOTDCard';
import WeatherTip from './WeatherTip';
import ColorScanner from './ColorScanner';
import StyleBot from './StyleBot';
import ToolsTab from './ToolsTab';
import { getLocalizedTip } from '../data/localTips';
import { logEvent, EVENTS } from '../utils/analytics';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-white/10 animate-fade-in">
      {message}
    </div>
  );
}

function LoadingScreen() {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const steps = [
    { emoji: '🔍', text: t('loadingScan'), sub: t('loadingQuality') },
    { emoji: '👤', text: t('loadingFace'), sub: t('loadingFaceSub') },
    { emoji: '🎨', text: t('loadingSkin'), sub: t('loadingSkinSub') },
    { emoji: '👔', text: t('loadingRecs'), sub: t('loadingRecsSub') },
    { emoji: '✨', text: t('loadingDone'), sub: t('loadingDoneSub') },
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

function DailyDropModal({ lastAnalysis, isDark, onClose }) {
  const { t } = useLanguage();
  const [revealed, setRevealed] = useState(false);
  const handleReveal = () => {
    setRevealed(true);
    setTimeout(() => {
      localStorage.setItem('sg_daily_drop_date', new Date().toLocaleDateString('en-CA'));
      onClose();
    }, 2500); // closes after reading 
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className={`w-full max-w-sm rounded-3xl p-6 text-center border-2 border-purple-500/50 shadow-2xl relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-purple-900 to-slate-900' : 'bg-white'}`}>
        {!revealed ? (
          <div className="space-y-6 scale-in">
            <div className="text-6xl animate-bounce-slow">🎁</div>
            <div>
              <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-purple-700'}`}>{t('dailyDropReady')}</h2>
              <p className={`text-sm mt-2 font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{t('dailyDropSub').replace('{skinTone}', lastAnalysis?.skinTone)}</p>
            </div>
            <button 
              onClick={handleReveal}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl text-white font-black text-lg shadow-lg pulse-glow"
            >
              {t('unlockOutfit')}
            </button>
            <button onClick={() => { localStorage.setItem('sg_daily_drop_date', new Date().toLocaleDateString('en-CA')); onClose(); }} className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{t('skipToday')}</button>
          </div>
        ) : (
          <div className="scale-in space-y-4">
            <span className="text-5xl">✨</span>
            <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('unlockingWardrobe')}</h2>
            <div className="flex gap-2 justify-center">
              {[1,2,3].map(i => <div key={i} className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{animationDelay: `${i*0.15}s`}}/>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------

function HomeScreen({ user, onAnalyze, onTabChange, onShowResult, isPro }) {
  const { theme } = useContext(ThemeContext);
  const { t, language } = useLanguage();
  const isDark = theme === 'dark';
  const lastAnalysis = (() => { try { return JSON.parse(localStorage.getItem('sg_last_analysis') || 'null'); } catch { return null; } })();
  const analysisCount = parseInt(localStorage.getItem('sg_analysis_count') || '0');
  const savedCount = (() => { try { return JSON.parse(localStorage.getItem('sg_saved_colors') || '[]').length; } catch { return 0; } })();
  const toneColors = { fair: "#F5DEB3", light: "#D2A679", medium: "#C68642", olive: "#A0724A", brown: "#7B4F2E", dark: "#4A2C0A" };

  // First visit onboarding
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('sg_onboarded');
  });
  const dismissOnboarding = () => {
    localStorage.setItem('sg_onboarded', '1');
    setShowOnboarding(false);
  };

  // Animated social proof counter
  const [displayCount, setDisplayCount] = useState(0);
  const TARGET_COUNT = 52847;
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(TARGET_COUNT / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= TARGET_COUNT) { setDisplayCount(TARGET_COUNT); clearInterval(timer); }
      else setDisplayCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, []);

  // Daily Streak Logic 🔥
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA');
    const lastCheckin = localStorage.getItem('sg_last_checkin');
    let currentStreak = parseInt(localStorage.getItem('sg_streak_count') || '0');
    if (lastCheckin !== today) {
      if (lastCheckin) {
        const lastDate = new Date(lastCheckin);
        const currDate = new Date(today);
        const diffDays = Math.round((currDate - lastDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) currentStreak += 1;
        else if (diffDays > 1) currentStreak = 1;
      } else {
        currentStreak = 1;
      }
      localStorage.setItem('sg_streak_count', currentStreak.toString());
      localStorage.setItem('sg_last_checkin', today);
    }
    setStreak(currentStreak);
  }, []);

  // Gender Preference Logic
  const [genderPref, setGenderPref] = useState(() => localStorage.getItem('sg_gender_pref') || 'male');
  const toggleGenderPref = () => {
    const next = genderPref === 'male' ? 'female' : 'male';
    setGenderPref(next);
    localStorage.setItem('sg_gender_pref', next);
  };

  // Daily Drop Logic 🎁
  const [showDailyDrop, setShowDailyDrop] = useState(() => {
    const today = new Date().toLocaleDateString('en-CA');
    const lastDrop = localStorage.getItem('sg_daily_drop_date');
    const hasAnalysis = !!lastAnalysis;
    return hasAnalysis && lastDrop !== today;
  });

  const gndr = lastAnalysis?.fullData?.gender || genderPref;
  const tone = (typeof lastAnalysis?.skinTone === 'string' ? lastAnalysis?.skinTone : lastAnalysis?.skinTone?.category || 'medium')?.toLowerCase();
  const todayTip = getLocalizedTip(gndr, tone, language);
  const isLoggedIn = user && !user.isAnonymous;

  return (
    <div className="pb-4 space-y-6">
      {/* Guest Hero — Prominent Login Call-to-Action */}
      {!isLoggedIn && (
        <div className={`rounded-3xl p-6 border-2 border-dashed animate-pulse-slow ${isDark ? 'bg-purple-900/20 border-purple-500/30' : 'bg-purple-50 border-purple-200'}`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg">✨</div>
            <div className="flex-1">
              <h3 className={`font-black text-lg ${isDark ? 'text-white' : 'text-purple-900'}`}>Unlock Full Features</h3>
              <p className={`text-xs ${isDark ? 'text-purple-300/70' : 'text-purple-700/70'}`}>Save your history, wardrobe & get a pro style score.</p>
            </div>
          </div>
          <button 
            onClick={() => onTabChange('profile')}
            className="mt-4 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-black text-sm shadow-lg transition-transform active:scale-95"
          >
            Join StyleGuru Now
          </button>
        </div>
      )}

      {showDailyDrop && <DailyDropModal lastAnalysis={lastAnalysis} isDark={isDark} onClose={() => setShowDailyDrop(false)} />}
        <div className="pt-2 flex justify-between items-start">
        <div>
          <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{t('goodDay')}</p>
          <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {isLoggedIn ? t('welcomeHey').replace('{name}', firstName) : t('welcomeNew')}
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{t('discoverPerfect')}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* Gender Toggle */}
          {!lastAnalysis && (
            <button 
              onClick={toggleGenderPref}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white/60 hover:text-white' : 'bg-white border-purple-100 text-purple-600 shadow-sm'}`}
            >
              <span>{genderPref === 'male' ? '🧔' : '👩'}</span>
              <span>{t(genderPref)}</span>
            </button>
          )}
          {streak > 0 && (
            <div className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 border ${isDark ? 'bg-orange-500/10 border-orange-500/20' : 'bg-orange-50 border-orange-200'}`}>
              <span className="text-sm">🔥</span>
              <span className={`text-[10px] font-black ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{streak}</span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onAnalyze}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl text-white font-black text-base shadow-lg shadow-purple-900/50 transition-all hover:scale-[1.02] active:scale-[0.98] pulse-glow"
      >
        {t('analyzeBtn')}
      </button>

      {/* Social proof */}
      <div className={`flex items-center justify-center gap-2 py-2 rounded-xl ${isDark ? 'bg-white/5' : 'bg-purple-50'}`}>
        <div className="flex -space-x-1.5">
          {['#F5DEB3','#C68642','#7B4F2E','#4A2C0A'].map((c,i) => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-white/30" style={{backgroundColor: c}} />
          ))}
        </div>
        <p className={`text-xs font-semibold ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
          <span className={`font-black ${isDark ? 'text-purple-300' : 'text-purple-600'} count-up`}>
            {displayCount.toLocaleString('en-IN')}
          </span> {t('profilesCreated')}
        </p>
      </div>

      {/* First-visit onboarding */}
      {showOnboarding && (
        <div className={`tooltip-in rounded-2xl p-4 border-2 border-purple-500/50 relative ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
          <button onClick={dismissOnboarding} className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-lg ${isDark ? 'text-white/40 hover:text-white bg-white/5' : 'text-gray-400 hover:text-gray-700 bg-gray-100'}`}>✕</button>
          <p className={`font-black text-sm mb-2 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{t('welcomeGuru')}</p>
          <div className="space-y-1.5">
            {[
              { step: '1', text: t('step1') },
              { step: '2', text: t('step2') },
              { step: '3', text: t('step3') },
            ].map(s => (
              <div key={s.step} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{s.step}</span>
                <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{s.text}</p>
              </div>
            ))}
          </div>
          <button onClick={() => { dismissOnboarding(); onAnalyze(); }}
            className="mt-3 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl transition-all">
            {t('getStarted')}
          </button>
        </div>
      )}

      {/* Daily Style Tip */}
      <div className={`rounded-2xl p-4 border flex items-start gap-3 ${isDark ? 'bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-700/30' : 'bg-purple-50 border-purple-200'}`}>
        <span className="text-2xl flex-shrink-0">{todayTip.emoji}</span>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>{t('styleTipDay')}</p>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-gray-700'}`}>{todayTip.tip}</p>
        </div>
      </div>

      {/* OOTD & Hook — Outfit of the Day */}
      {lastAnalysis && (
        <div className="space-y-3">
          <OOTDCard
            skinTone={lastAnalysis.skinTone}
            gender={lastAnalysis.fullData?.gender || genderPref}
            isDark={isDark}
          />
          
          {/* Rate My Fit - Hook mechanics */}
          <div className={`rounded-2xl p-4 border flex items-center gap-3 justify-between ${isDark ? 'bg-gradient-to-r from-orange-900/40 to-red-900/40 border-orange-700/30' : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200'}`}>
            <div>
              <p className={`text-sm font-black uppercase tracking-wide ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{t('rateMyFit')}</p>
              <p className={`text-[10px] mt-0.5 leading-tight ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{t('rateMyFitSub')}</p>
            </div>
            <button
              onClick={onAnalyze}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg hover:scale-105 flex-shrink-0 heartbeat ${isDark ? 'bg-orange-500 text-white shadow-orange-900/50' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/30'}`}
            >
              {t('scanFit')}
            </button>
          </div>
        </div>
      )}

      {/* Weather-Based Style Tip */}
      <WeatherTip isDark={isDark} />

      {/* AdSense Ad */}
      {!isPro && (
        <div className="mt-2">
          <AdSense />
        </div>
      )}
    </div>
  );
}

function ProfileScreenComponent({ user, isDark, analysisCount, savedCount, isPro, usage, onShowSettings, navigate }) {
  const { t } = useLanguage();
  const lastAnalysis = (() => { try { return JSON.parse(localStorage.getItem('sg_last_analysis') || 'null'); } catch { return null; } })();
  const wardrobeStats = lastAnalysis ? {
    skinTone: lastAnalysis.skinTone,
    undertone: lastAnalysis.undertone,
    season: lastAnalysis.season,
    skinHex: lastAnalysis.skinHex,
    date: lastAnalysis.date,
  } : null;

  // Check if user is logged in
  const isLoggedIn = user && !user.isAnonymous;

  return (
    <div className="space-y-4 pt-2">
      {/* Authentication Status */}
      {isLoggedIn ? (
        <div className={`rounded-2xl p-3 text-center border ${isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'}`}>
          <p className={`text-xs font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>✅ Logged In</p>
        </div>
      ) : (
        <div className={`rounded-2xl p-3 text-center border ${isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
          <p className={`text-xs font-bold mb-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>👤 Guest Mode</p>
          <button
            onClick={() => navigate('/login')}
            className={`w-full px-3 py-2 rounded-lg font-bold text-xs transition-all ${isDark ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg' : 'bg-purple-500 hover:bg-purple-600 text-white shadow-sm'}`}
          >
            Login to Save Progress
          </button>
        </div>
      )}

      {/* Profile Header */}
      <div className={`rounded-3xl p-6 border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="inline-block mb-4 relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <span className="text-5xl text-white font-black">
              {isLoggedIn ? (user?.name?.charAt(0).toUpperCase() || 'U') : '👤'}
            </span>
          </div>
          {!isLoggedIn && (
            <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white text-[8px] font-black px-2 py-1 rounded-full border-2 border-[#050816] uppercase tracking-tighter">
              Guest
            </div>
          )}
        </div>
        <h2 className={`text-2xl font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {isLoggedIn ? user?.name : 'Guest Mode'}
        </h2>
        <p className={`text-sm mb-4 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
          {isLoggedIn ? user?.email : 'Login to sync your profile'}
        </p>
        
        {isLoggedIn ? (
          <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold transition-all text-sm">
            ✏️ Edit Profile
          </button>
        ) : (
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-black text-sm shadow-lg transition-transform active:scale-95 pulse-glow"
          >
            Login to Save Progress
          </button>
        )}
      </div>

      {/* Stats */}
      {isLoggedIn ? (
        <div className="grid grid-cols-3 gap-3">
          <div className={`rounded-2xl p-3 text-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
            <p className="text-2xl mb-1">📸</p>
            <p className={`font-black text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{analysisCount}</p>
            <p className={`text-[10px] uppercase font-bold ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Analyses</p>
          </div>
          <div className={`rounded-2xl p-3 text-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
            <p className="text-2xl mb-1">❤️</p>
            <p className={`font-black text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{savedCount}</p>
            <p className={`text-[10px] uppercase font-bold ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Saved Colors</p>
          </div>
          <div className={`rounded-2xl p-3 text-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white  border-gray-200 shadow-sm'}`}>
            <p className="text-2xl mb-1">⭐</p>
            <p className={`font-black text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>92%</p>
            <p className={`text-[10px] uppercase font-bold ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Score</p>
          </div>
        </div>
      ) : (
        <div className={`rounded-3xl p-8 text-center border-2 border-dashed ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-300'}`}>
          <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📊</span>
          </div>
          <p className={`font-black text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Unlock Your Style Stats</p>
          <p className={`text-sm mb-6 ${isDark ? 'text-white/50' : 'text-gray-600'}`}>Login to see your analysis history, saved colors, and personalized style score.</p>
          <button 
            onClick={() => navigate('/login')}
            className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all ${isDark ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg' : 'bg-purple-500 hover:bg-purple-600 text-white shadow-sm'}`}
          >
            Show My Stats
          </button>
        </div>
      )}

      {/* Skin Tone Analysis */}
      {isLoggedIn && wardrobeStats ? (
        <div className={`rounded-3xl p-6 border ${isDark ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'}`}>
          <h3 className={`text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>🎨 Color Analysis</h3>
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
      ) : !isLoggedIn && (
        <div className={`rounded-3xl p-6 text-center border border-dashed ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-300'}`}>
          <p className="text-3xl mb-2">👗</p>
          <p className={`font-bold text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>Login to save your wardrobe & color profile</p>
        </div>
      )}

      {/* Plan Status */}
      {isLoggedIn && (
        <div className={`rounded-3xl p-6 border ${isPro ? (isDark ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30' : 'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300') : (isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm')}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className={`text-lg font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{isPro ? '⚡ PRO' : '🆓 Free'}</h3>
              {isPro && (
                <p className={`text-sm ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>Premium unlocked ✓</p>
              )}
            </div>
          </div>
          {!isPro && (
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className={isDark ? 'text-white/50' : 'text-gray-500'}>Analyses</span>
                  <span className={isDark ? 'text-white/70' : 'text-gray-700'}>{usage?.analyses_count || 0}/6</span>
                </div>
                <div className={`h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                  <div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${Math.min(100, ((usage?.analyses_count || 0) / 6) * 100)}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings Button */}
      <button
        onClick={onShowSettings}
        className={`w-full p-4 rounded-2xl font-black border transition-all text-base ${isDark ? 'bg-purple-600/20 border-purple-500/30 hover:bg-purple-600/40 text-purple-300' : 'bg-purple-100 border-purple-300 hover:bg-purple-200 text-purple-700'}`}
      >
        ⚙️ Settings & Preferences
      </button>

    </div>
  );
}

function SettingsScreen({ user, onLogout }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { t, language, changeLanguage } = useLanguage();
  const { isPro, plan, usage, validUntil } = usePlan();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const isDark = theme === 'dark';
  const [notifStatus, setNotifStatus] = useState(() => {
    if (typeof Notification === 'undefined' || !('PushManager' in window)) return 'unsupported';
    return Notification.permission;
  });

  const [subId, setSubId] = useState(() => localStorage.getItem('sg_push_sub_id') || null);

  const requestNotification = async () => {
    if (typeof Notification === 'undefined') {
      alert("This browser doesn't support notifications.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      setNotifStatus(permission);
      if (permission !== 'granted') return;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY || undefined,
      });
      const subJson = sub.toJSON();

      // Get skin tone + season from localStorage
      const lastAnalysis = (() => { try { return JSON.parse(localStorage.getItem('sg_last_analysis') || 'null'); } catch { return null; } })();
      const skinTone = lastAnalysis?.skinTone || '';
      const colorSeason = lastAnalysis?.season || '';

      // Save to Firestore via API
      try {
        const { savePushSubscription } = await import('../api/styleApi');
        const uid = auth.currentUser?.uid;
        if (uid) {
          const id = await savePushSubscription(uid, subJson, skinTone, colorSeason);
          if (id) {
            setSubId(id);
            localStorage.setItem('sg_push_sub_id', id);
          }
        }
      } catch (e) {
        console.error('Failed to save push subscription:', e);
        return;
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

  // Support functions
  const handleHelpFAQ = () => {
    const email = 'StyleGuruAI.in@gmail.com';
    const subject = 'Help & FAQ - StyleGuru AI';
    const body = `Hi StyleGuru Team,\n\nI have a question about StyleGuru:\n\n[Please describe your question here]\n\n---\nUser Email: ${user?.email || 'Not logged in'}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleReportIssue = () => {
    const email = 'StyleGuruAI.in@gmail.com';
    const subject = 'Report Issue - StyleGuru AI';
    const body = `Hi StyleGuru Team,\n\nI'm reporting an issue:\n\nProblem Description:\n[Please describe the issue here]\n\nSteps to Reproduce:\n[How can we repeat this issue?]\n\nExpected Behavior:\n[What should happen?]\n\n---\nUser Email: ${user?.email || 'Not logged in'}\nDevice: ${navigator.userAgent}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleRequestFeature = () => {
    const email = 'StyleGuruAI.in@gmail.com';
    const subject = 'Feature Request - StyleGuru AI';
    const body = `Hi StyleGuru Team,\n\nI would like to request a new feature:\n\nFeature Description:\n[What feature would you like to see?]\n\nWhy would this be useful:\n[Explain how this feature would help you]\n\n---\nUser Email: ${user?.email || 'Not logged in'}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleDownloadData = async () => {
    try {
      const userData = {
        email: user?.email,
        displayName: user?.name,
        exportedAt: new Date().toISOString(),
        preferences: {
          theme,
          language,
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

  const analysisCount = user ? parseInt(localStorage.getItem('sg_analysis_count') || '0') : 0;
  const savedCount = user ? (() => { try { return JSON.parse(localStorage.getItem('sg_saved_colors') || '[]').length; } catch { return 0; } })() : 0;

  return (
    <div className="space-y-4 pt-2 text-left">
      <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>⚙️ {t('settings')}</h2>

      {/* User card */}
      <div className={`rounded-2xl p-4 flex items-center gap-4 border ${isDark ? 'bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-purple-700/30' : 'bg-white border-purple-100 shadow-sm'}`}>
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-lg">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{user?.email}</p>
        </div>
      </div>

      {/* Stats */}
      {analysisCount > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t('analyses'), value: analysisCount, emoji: '📸' },
            { label: t('savedColors'), value: savedCount, emoji: '❤️' },
            { label: t('styleScore'), value: '92', emoji: '💯' },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-2xl p-3 text-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
              <p className="text-xl mb-1">{stat.emoji}</p>
              <p className={`font-black text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
              <p className={`text-[10px] uppercase tracking-wide font-bold ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{stat.label}</p>
            </div>
          ))}
        </div>
      )}



      {/* Appearance - Theme & Language */}
      <div className={`rounded-2xl p-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
        <h3 className={`text-sm font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>🌙 {t('appearance')}</h3>
        <div className="space-y-3">
          {/* Theme Toggle */}
          <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <div>
              <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{isDark ? '🌙 Dark' : '☀️ Light'}</p>
              <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{t('switchTheme')}</p>
            </div>
            <button onClick={toggleTheme} className="relative w-12 h-6 rounded-full bg-purple-500 transition-all">
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${isDark ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {/* Language Selector */}
          <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>🌐 {t('languageLabel')}</p>
            <div className={`flex rounded-lg p-1 gap-1 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
              <button onClick={() => changeLanguage('en')} className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${language === 'en' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow' : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500'}`}>🇬🇧</button>
              <button onClick={() => changeLanguage('hi')} className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${language === 'hi' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow' : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500'}`}>अ</button>
              <button onClick={() => changeLanguage('hinglish')} className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${language === 'hinglish' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow' : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500'}`}>🇮🇳</button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifStatus !== 'unsupported' && (
        <div className={`rounded-2xl p-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
          <h3 className={`text-sm font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>🔔 {t('notifications')}</h3>
          <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <div>
              <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('notifications')}</p>
              <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                {notifStatus === 'granted' ? t('notifEnabled') : notifStatus === 'denied' ? t('notifBlocked') : t('notifWeekly')}
              </p>
            </div>
            {notifStatus === 'granted' ? (
              <button
                onClick={disableNotification}
                className="text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full hover:bg-red-500/20 transition"
              >
                {t('disable')}
              </button>
            ) : notifStatus === 'denied' ? (
              <a
                href="https://support.google.com/chrome/answer/3220216"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 text-xs font-bold underline"
              >
                {t('unblock')}
              </a>
            ) : (
              <button
                onClick={requestNotification}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full hover:from-purple-500 hover:to-pink-500 transition"
              >
                {t('enable')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Help & Support */}
      <div className={`rounded-2xl p-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
        <h3 className={`text-sm font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>💬 Help & Support</h3>
        <div className="space-y-2">
          <button
            onClick={handleHelpFAQ}
            className={`w-full text-left p-3 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
          >
            <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>❓ Help & FAQ</p>
            <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Email us your questions</p>
          </button>

          <button
            onClick={handleReportIssue}
            className={`w-full text-left p-3 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
          >
            <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>🐛 Report Issue</p>
            <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Report bugs and problems</p>
          </button>

          <button
            onClick={handleRequestFeature}
            className={`w-full text-left p-3 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
          >
            <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>💡 Request Feature</p>
            <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Suggest new features</p>
          </button>
        </div>
      </div>

      {/* Account & Data */}
      <div className={`rounded-2xl p-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
        <h3 className={`text-sm font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>👤 Account</h3>
        <button
          onClick={handleDownloadData}
          className={`w-full text-left p-3 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
        >
          <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>📥 Download My Data</p>
          <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Export your data (JSON)</p>
        </button>
      </div>

      {/* About */}
      <div className={`rounded-2xl p-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
        <h3 className={`text-sm font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>ℹ️ About</h3>
        <button
          onClick={() => window.open('https://styleguruai.in', '_blank')}
          className={`w-full p-3 rounded-xl font-bold transition-all ${isDark ? 'bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/40' : 'bg-purple-100 border border-purple-300 text-purple-700 hover:bg-purple-200'}`}
        >
          🌐 Visit Website
        </button>
      </div>

      {/* Legal */}
      <div className={`rounded-2xl p-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
        <h3 className={`text-sm font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>⚖️ Legal</h3>
        <div className="space-y-2">
          <button
            onClick={() => window.open('/privacy', '_blank')}
            className={`w-full text-left p-3 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
          >
            <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>📄 Privacy Policy</p>
          </button>
          <button
            onClick={() => window.open('/terms', '_blank')}
            className={`w-full text-left p-3 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
          >
            <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>⚖️ Terms of Service</p>
          </button>
        </div>
      </div>

      {/* Logout */}
      <button onClick={onLogout} className={`w-full py-3 rounded-2xl font-black border transition ${isDark ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20' : 'bg-red-100 hover:bg-red-200 text-red-700 border-red-300'}`}>
        {user?.isAnonymous ? '🚪 Exit Guest Mode' : `🚪 ${t('logout')}`}
      </button>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { t } = useLanguage();
  const { isPro, usage, setUsage } = usePlan();
  const isDark = theme === 'dark';
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [currentGender, setCurrentGender] = useState('male');
  const [toast, setToast] = useState(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const showToast = (msg) => setToast(msg);

  // Define analysisCount and savedCount for profile tab display
  const analysisCount = user ? parseInt(localStorage.getItem('sg_analysis_count') || '0') : 0;
  const savedCount = user ? (() => { try { return JSON.parse(localStorage.getItem('sg_saved_colors') || '[]').length; } catch { return 0; } })() : 0;

  const handleUpgradeSuccess = async () => {
    try {
      if (auth.currentUser) {
        await activateProSubscription(auth.currentUser.uid);
        // Refresh the context to unlock the app
        window.location.reload(); // Quickest way to hard refresh React context states for Pro bounds
      }
    } catch (e) {
      showToast('❌ Upgrade failed to sync');
    }
  };

  // Offline wardrobe queue retry
  useEffect(() => {
    if (!auth.currentUser || !navigator.onLine) return;
    try {
      const queue = JSON.parse(localStorage.getItem('sg_wardrobe_queue') || '[]');
      if (queue.length === 0) return;
      const uid = auth.currentUser.uid;
      Promise.all(queue.map(item => saveWardrobeItem(uid, item)))
        .then(() => localStorage.removeItem('sg_wardrobe_queue'))
        .catch(() => {}); // silently fail, will retry next time
    } catch {}
  }, []);

  const handleReset = () => { setResults(null); setError(null); setUploadedImage(null); };
  const handleAnalysisComplete = (data) => {
    if (!data) return;
    
    // Normalize: Ensure skin_tone is accessible either at root or inside analysis
    const skinToneObj = data.analysis?.skin_tone || data.skin_tone;
    const skinColorObj = data.analysis?.skin_color || data.skin_color;
    const recsObj = data.recommendations || data.analysis?.recommendations;
    
    const enriched = { 
      ...data, 
      gender: data.gender || currentGender,
      // Ensure the structure matches what the UI expects
      analysis: data.analysis || { 
        skin_tone: skinToneObj, 
        skin_color: skinColorObj 
      },
      recommendations: recsObj
    };
    
    setResults(enriched);
    setLoading(false);
    
    // Save to history (last 5) + increment count
    try {
      const count = parseInt(localStorage.getItem('sg_analysis_count') || '0') + 1;
      localStorage.setItem('sg_analysis_count', count.toString());
      
      const newEntry = {
        id: Date.now(),
        skinTone: skinToneObj?.category || 'medium',
        undertone: skinToneObj?.undertone || 'neutral',
        season: skinToneObj?.color_season || 'Spring',
        confidence: skinToneObj?.confidence || 'medium',
        skinHex: skinColorObj?.hex || '#C68642',
        date: new Date().toLocaleDateString('en-IN'),
        timestamp: Date.now(),
        fullData: enriched,
      };
      localStorage.setItem('sg_last_analysis', JSON.stringify(newEntry));
      
      // Keep last 5 analyses
      const history = JSON.parse(localStorage.getItem('sg_analysis_history') || '[]');
      const updated = [newEntry, ...history].slice(0, 5);
      localStorage.setItem('sg_analysis_history', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving analysis to local history:', e);
    }

    // Save profile to Firestore
    const uid = auth.currentUser?.uid;
    if (uid) {
      // Increment usage for free users
      if (!isPro) {
        incrementUsage(uid, 'analyses_count').then(() => {
          setUsage(prev => ({ ...prev, analyses_count: (prev.analyses_count || 0) + 1 }));
        });
      }
      logEvent(EVENTS.STYLE_ANALYSIS_SUCCESS, {
        skin_tone: enriched.analysis?.skin_tone?.category,
        color_season: enriched.analysis?.skin_tone?.color_season,
        gender: enriched.gender || currentGender,
        is_pro: isPro,
      });
      const profileData = {
        skin_tone: enriched.analysis?.skin_tone?.category,
        undertone: enriched.analysis?.skin_tone?.undertone,
        color_season: enriched.analysis?.skin_tone?.color_season,
        skin_hex: enriched.analysis?.skin_color?.hex || '#C68642',
        confidence: enriched.analysis?.skin_tone?.confidence,
        best_colors: enriched.recommendations?.best_shirt_colors?.slice(0, 5) || [],
        gender_mode: enriched.gender || currentGender,
        language: localStorage.getItem('sg_language') || 'en',
        analyzed_at: new Date().toISOString(),
      };
      saveProfile(uid, profileData).catch(() => {
        showToast('Profile not synced — will retry on next login');
      });
    }
  };

  const navItems = [
    { id: 'home',      emoji: '🏠', label: t('navHome') },
    { id: 'analyze',   emoji: '📸', label: t('navAnalyze') },
    { id: 'wardrobe',  emoji: '👗', label: t('navWardrobe') },
    { id: 'tools',     emoji: '🛠️', label: t('navTools') },
    { id: 'profile',   emoji: '❤️', label: t('navProfile') }
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
              {t('navNew')}
            </button>
          )}
          {!isPro ? (
            <button onClick={() => setPaywallOpen(true)} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1.5 rounded-xl shadow-md transition hover:scale-105 active:scale-95">
              <span>✨</span> PRO
            </button>
          ) : (
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider border border-purple-500/30 text-purple-600 px-3 py-1.5 rounded-xl shadow-sm bg-purple-50/50">
              <span className="text-purple-500">✨</span> PRO
            </div>
          )}
          <button onClick={toggleTheme} className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sm">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 pt-4 pb-24">
        <div className="tab-content" key={activeTab}>
        {activeTab === 'home' && (
          <HomeScreen
            user={user}
            onAnalyze={() => setActiveTab('analyze')}
            onTabChange={handleTabChange}
            isPro={isPro}
            onShowResult={(data) => {
              setResults(data);
              setActiveTab('analyze');
            }}
          />
        )}
        {activeTab === 'analyze' && (
          <>
            {!results && !loading && (
              <UploadSection
                onLoadingStart={() => {
                  if (!isPro && usage.analyses_count >= 6) {
                    logEvent(EVENTS.PAYWALL_VIEW, { reason: 'limit_reached' });
                    setPaywallOpen(true);
                    return false; // signal blocked
                  }
                  logEvent(EVENTS.STYLE_ANALYSIS_START, { gender: currentGender });
                  setLoading(true); setError(null);
                  return true;
                }}
                onAnalysisComplete={handleAnalysisComplete}
                onError={(msg) => { 
                  logEvent(EVENTS.STYLE_ANALYSIS_ERROR, { message: msg });
                  setError(msg); setLoading(false); 
                }}
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
            {results && results.type === 'couple' ? (
              <CoupleResults data={results} uploadedImages={uploadedImage} onReset={handleReset} />
            ) : results ? (
              <ResultsDisplay data={results} uploadedImage={uploadedImage} onReset={handleReset} />
            ) : null}
          </>
        )}
        {activeTab === 'wardrobe' && <WardrobePanel user={user} onShowResult={(data) => { setResults(data); setActiveTab('analyze'); }} />}
        {activeTab === 'tools' && <ToolsTab uploadedImage={uploadedImage} analysisData={results} onShowResult={(data) => { setResults(data); setActiveTab('analyze'); }} onOpenScanner={() => setActiveTab('scanner')} />}
        {activeTab === 'scanner' && (
          <ColorScanner
            savedPalette={(() => {
              try {
                const lastA = JSON.parse(localStorage.getItem('sg_last_analysis') || 'null');
                return lastA?.fullData?.recommendations?.best_shirt_colors ||
                       lastA?.fullData?.recommendations?.best_dress_colors || [];
              } catch { return []; }
            })()}
            skinTone={(() => { try { return JSON.parse(localStorage.getItem('sg_last_analysis') || '{}').skinTone; } catch { return ''; } })()}
            onClose={() => setActiveTab('home')}
          />
        )}
        {activeTab === 'profile' && (
          <>
            {!showProfileSettings ? (
              <ProfileScreenComponent 
                user={user} 
                isDark={isDark} 
                analysisCount={analysisCount}
                savedCount={savedCount}
                isPro={isPro}
                usage={usage}
                onShowSettings={() => setShowProfileSettings(true)}
                navigate={navigate}
              />
            ) : (
              <div>
                <button
                  onClick={() => setShowProfileSettings(false)}
                  className={`mb-4 p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                >
                  ← Back to Profile
                </button>
                <SettingsScreen user={user} onLogout={onLogout} />
              </div>
            )}
          </>
        )}
        </div>
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t ${theme === 'dark' ? 'bg-[#050816]/95 border-white/10' : 'bg-slate-100/95 border-purple-200 shadow-lg'}`}>
        <div className="max-w-lg mx-auto flex gap-2 sm:justify-around overflow-x-auto scrollbar-hide px-3 py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all ${
                activeTab === item.id 
                  ? (isDark ? 'text-purple-400 bg-white/5' : 'text-purple-600 bg-purple-100') 
                  : (isDark ? 'text-white/40 hover:text-white/60 hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200')
              }`}
            >
              <span className={`text-xl transition-transform ${activeTab === item.id ? 'scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]' : ''}`}>{item.emoji}</span>
              <span className={`text-[10px] uppercase tracking-tighter font-black ${
                activeTab === item.id ? (isDark ? 'text-purple-400' : 'text-purple-700') : (isDark ? 'text-white/30' : 'text-slate-500')
              }`}>{item.label}</span>
              {activeTab === item.id && <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 nav-dot shadow-[0_0_8px_rgba(168,85,247,0.6)]" />}
            </button>
          ))}
        </div>
      </nav>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <PaywallModal isOpen={paywallOpen} onClose={() => setPaywallOpen(false)} onUpgrade={handleUpgradeSuccess} isDark={theme === 'dark'} />
      <StyleBot />
    </div>
  );
}

export default Dashboard;
