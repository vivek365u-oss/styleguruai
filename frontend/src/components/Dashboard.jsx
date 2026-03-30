import OutfitChecker from './OutfitChecker';
import { useState, useEffect, useContext } from 'react';

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

function DailyDropModal({ lastAnalysis, isDark, onClose }) {
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
              <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-purple-700'}`}>Your Daily Drop is Ready!</h2>
              <p className={`text-sm mt-2 font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>We prepared today's perfect outfit based on the weather and your {lastAnalysis?.skinTone} skin tone.</p>
            </div>
            <button 
              onClick={handleReveal}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl text-white font-black text-lg shadow-lg pulse-glow"
            >
              Unlock Outfit 🔓
            </button>
            <button onClick={() => { localStorage.setItem('sg_daily_drop_date', new Date().toLocaleDateString('en-CA')); onClose(); }} className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Skip for today</button>
          </div>
        ) : (
          <div className="scale-in space-y-4">
            <span className="text-5xl">✨</span>
            <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Unlocking your wardrobe...</h2>
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
  const { language } = useLanguage();
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

  // Daily Drop Logic 🎁
  const [showDailyDrop, setShowDailyDrop] = useState(() => {
    const today = new Date().toLocaleDateString('en-CA');
    const lastDrop = localStorage.getItem('sg_daily_drop_date');
    const hasAnalysis = !!lastAnalysis;
    return hasAnalysis && lastDrop !== today;
  });

  const gndr = lastAnalysis?.fullData?.gender || 'male';
  const tone = lastAnalysis?.skinTone?.toLowerCase() || 'medium';
  const todayTip = getLocalizedTip(gndr, tone, language);
  const firstName = user?.name?.split(' ')[0] || 'there';
  return (
    <div className="pb-4 space-y-6">
      {showDailyDrop && <DailyDropModal lastAnalysis={lastAnalysis} isDark={isDark} onClose={() => setShowDailyDrop(false)} />}
      <div className="pt-2 flex justify-between items-start">
        <div>
          <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Good day,</p>
          <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Hey {firstName} 👋</h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Discover your perfect style with AI</p>
        </div>
        {streak > 0 && (
          <div className="flex flex-col items-center justify-center animate-bounce-slow">
            <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">🔥</span>
            <span className={`text-[10px] font-black mt-1 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{streak} Day{streak > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <button
        onClick={onAnalyze}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl text-white font-black text-base shadow-lg shadow-purple-900/50 transition-all hover:scale-[1.02] active:scale-[0.98] pulse-glow"
      >
        ✨ Analyze Your Style
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
          </span> style profiles created
        </p>
      </div>

      {/* First-visit onboarding */}
      {showOnboarding && (
        <div className={`tooltip-in rounded-2xl p-4 border-2 border-purple-500/50 relative ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
          <button onClick={dismissOnboarding} className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-lg ${isDark ? 'text-white/40 hover:text-white bg-white/5' : 'text-gray-400 hover:text-gray-700 bg-gray-100'}`}>✕</button>
          <p className={`font-black text-sm mb-2 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>👋 Welcome to StyleGuru AI!</p>
          <div className="space-y-1.5">
            {[
              { step: '1', text: 'Tap "Analyze Your Style" and upload a selfie' },
              { step: '2', text: 'AI detects your skin tone in seconds' },
              { step: '3', text: 'Get your personal color palette + outfit ideas' },
            ].map(s => (
              <div key={s.step} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{s.step}</span>
                <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{s.text}</p>
              </div>
            ))}
          </div>
          <button onClick={() => { dismissOnboarding(); onAnalyze(); }}
            className="mt-3 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl transition-all">
            Get Started →
          </button>
        </div>
      )}

      {/* Daily Style Tip */}
      <div className={`rounded-2xl p-4 border flex items-start gap-3 ${isDark ? 'bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-700/30' : 'bg-purple-50 border-purple-200'}`}>
        <span className="text-2xl flex-shrink-0">{todayTip.emoji}</span>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>💡 Style Tip of the Day</p>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-gray-700'}`}>{todayTip.tip}</p>
        </div>
      </div>

      {/* OOTD & Hook — Outfit of the Day */}
      {lastAnalysis && (
        <div className="space-y-3">
          <OOTDCard
            skinTone={lastAnalysis.skinTone}
            gender={lastAnalysis.fullData?.gender || 'male'}
            isDark={isDark}
          />
          
          {/* Rate My Fit - Hook mechanics */}
          <div className={`rounded-2xl p-4 border flex items-center gap-3 justify-between ${isDark ? 'bg-gradient-to-r from-orange-900/40 to-red-900/40 border-orange-700/30' : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200'}`}>
            <div>
              <p className={`text-sm font-black uppercase tracking-wide ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>📸 Rate My Fit</p>
              <p className={`text-[10px] mt-0.5 leading-tight ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Wear your Outfit & get your daily Style Score 🔥</p>
            </div>
            <button
              onClick={onAnalyze}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg hover:scale-105 flex-shrink-0 heartbeat ${isDark ? 'bg-orange-500 text-white shadow-orange-900/50' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/30'}`}
            >
              Scan Fit
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
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
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

  const analysisCount = parseInt(localStorage.getItem('sg_analysis_count') || '0');
  const savedCount = (() => { try { return JSON.parse(localStorage.getItem('sg_saved_colors') || '[]').length; } catch { return 0; } })();

  return (
    <div className="space-y-4 pt-2">
      <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>⚙️ Settings</h2>

      {/* User card moved to top */}
      <div className={`rounded-2xl p-4 flex items-center gap-4 border ${isDark ? 'bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-purple-700/30' : 'bg-white border-purple-100 shadow-sm'}`}>
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-lg">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{user?.email}</p>
        </div>
      </div>

      {/* Stats Row */}
      {analysisCount > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Analyses', value: analysisCount, emoji: '📸' },
            { label: 'Saved Colors', value: savedCount, emoji: '❤️' },
            { label: 'Style Score', value: '92', emoji: '💯' },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-2xl p-3 text-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
              <p className="text-xl mb-1">{stat.emoji}</p>
              <p className={`font-black text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
              <p className={`text-[10px] uppercase tracking-wide font-bold ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Plan Status */}
      <div className={`rounded-2xl p-4 border ${isPro ? (isDark ? 'bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-purple-500/30' : 'bg-purple-50 border-purple-300') : (isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm')}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className={`font-black text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {isPro ? '⚡ Pro Member ✓' : '🆓 Free Plan'}
            </p>
            {isPro && validUntil && (
              <p className={`text-xs mt-0.5 ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
                Valid until {new Date(validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
          {!isPro && (
            <button
              onClick={() => setPaywallOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-black px-4 py-2 rounded-xl hover:from-purple-500 hover:to-pink-500 transition"
            >
              Upgrade ₹31/mo
            </button>
          )}
        </div>
        {!isPro && (
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className={isDark ? 'text-white/50' : 'text-gray-500'}>Analyses</span>
                <span className={isDark ? 'text-white/70' : 'text-gray-700'}>{usage.analyses_count || 0}/6</span>
              </div>
              <div className={`h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all" style={{ width: `${Math.min(100, ((usage.analyses_count || 0) / 6) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className={isDark ? 'text-white/50' : 'text-gray-500'}>Outfit checks</span>
                <span className={isDark ? 'text-white/70' : 'text-gray-700'}>{usage.outfit_checks_count || 0}/10</span>
              </div>
              <div className={`h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all" style={{ width: `${Math.min(100, ((usage.outfit_checks_count || 0) / 10) * 100)}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>
      <PaywallModal isOpen={paywallOpen} onClose={() => setPaywallOpen(false)} triggerMessage="" />

      <PaywallModal isOpen={paywallOpen} onClose={() => setPaywallOpen(false)} triggerMessage="" />

      {/* Language */}
      <div className={`rounded-2xl p-4 flex items-center justify-between border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
        <div>
          <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>🌐 Language</p>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>App language</p>
        </div>
        <div className={`flex rounded-xl p-1 gap-1 ${isDark ? 'bg-white/10' : 'bg-gray-100 border border-gray-200'}`}>
          <button onClick={() => changeLanguage('hinglish')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'hinglish' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow' : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>🇮🇳</button>
          <button onClick={() => changeLanguage('en')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'en' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow' : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>🇬🇧</button>
          <button onClick={() => changeLanguage('hi')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'hi' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow' : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>अ</button>
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

      {/* Push Notifications */}
      {notifStatus !== 'unsupported' && (
        <div className={`rounded-2xl p-4 flex items-center justify-between border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
          <div>
            <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>🔔 Notifications</p>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
              {notifStatus === 'granted' ? 'Enabled ✓' : notifStatus === 'denied' ? 'Blocked in browser' : 'Weekly style tips'}
            </p>
          </div>
          {notifStatus === 'granted' ? (
            <button
              onClick={disableNotification}
              className="text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full hover:bg-red-500/20 transition"
            >
              Disable
            </button>
          ) : notifStatus === 'denied' ? (
            <a
              href="https://support.google.com/chrome/answer/3220216"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 text-xs font-bold underline"
            >
              Unblock →
            </a>
          ) : (
            <button
              onClick={requestNotification}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:from-purple-500 hover:to-pink-500 transition"
            >
              Enable
            </button>
          )}
        </div>
      )}

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
  const { isPro, usage, setUsage } = usePlan();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [currentGender, setCurrentGender] = useState('male');
  const [toast, setToast] = useState(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const showToast = (msg) => setToast(msg);

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
    const enriched = { ...data, gender: data.gender || currentGender };
    setResults(enriched);
    setLoading(false);
    // Save to history (last 5) + increment count
    try {
      const count = parseInt(localStorage.getItem('sg_analysis_count') || '0') + 1;
      localStorage.setItem('sg_analysis_count', count.toString());
      const newEntry = {
        id: Date.now(),
        skinTone: enriched.analysis?.skin_tone?.category,
        undertone: enriched.analysis?.skin_tone?.undertone,
        season: enriched.analysis?.skin_tone?.color_season,
        confidence: enriched.analysis?.skin_tone?.confidence,
        skinHex: enriched.analysis?.skin_color?.hex || '#C68642',
        date: new Date().toLocaleDateString('en-IN'),
        timestamp: Date.now(),
        fullData: enriched,
      };
      localStorage.setItem('sg_last_analysis', JSON.stringify(newEntry));
      // Keep last 5 analyses
      const history = JSON.parse(localStorage.getItem('sg_analysis_history') || '[]');
      const updated = [newEntry, ...history].slice(0, 5);
      localStorage.setItem('sg_analysis_history', JSON.stringify(updated));
    } catch {}

    // Save profile to Firestore
    const uid = auth.currentUser?.uid;
    if (uid) {
      // Increment usage for free users
      if (!isPro) {
        incrementUsage(uid, 'analyses_count').then(() => {
          setUsage(prev => ({ ...prev, analyses_count: (prev.analyses_count || 0) + 1 }));
        });
      }
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
    { id: 'home',      emoji: '🏠', label: 'Home' },
    { id: 'analyze',   emoji: '📸', label: 'Analyze' },
    { id: 'wardrobe',  emoji: '👗', label: 'Wardrobe' },
    { id: 'tools',     emoji: '🛠️', label: 'Tools' },
    { id: 'settings',  emoji: '⚙️', label: 'Profile' }
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
                    setPaywallOpen(true);
                    return false; // signal blocked
                  }
                  setLoading(true); setError(null);
                  return true;
                }}
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
        {activeTab === 'settings' && <SettingsScreen user={user} onLogout={onLogout} />}
        </div>
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t ${theme === 'dark' ? 'bg-[#050816]/95 border-white/10' : 'bg-slate-100/95 border-purple-200 shadow-lg'}`}>
        <div className="max-w-lg mx-auto flex gap-2 sm:justify-around overflow-x-auto scrollbar-hide px-3 py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${activeTab === item.id ? 'text-purple-500' : theme === 'dark' ? 'text-white/30 hover:text-white/60' : 'text-gray-400 hover:text-gray-700'}`}
            >
              <span className={`text-xl transition-transform ${activeTab === item.id ? 'scale-110' : ''}`}>{item.emoji}</span>
              <span className={`text-[10px] font-semibold ${activeTab === item.id ? 'text-purple-400' : 'text-white/30'}`}>{item.label}</span>
              {activeTab === item.id && <div className="w-1 h-1 rounded-full bg-purple-400 nav-dot" />}
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
