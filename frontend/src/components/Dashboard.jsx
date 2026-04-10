import OutfitChecker from './OutfitChecker';
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadSection from './UploadSection';
import ResultsDisplay from './ResultsDisplay';
import CoupleResults from './CoupleResults';
import HistoryPanel from './HistoryPanel';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { LoadingScreenWithProgress } from './LoadingScreenWithProgress';
import AdSense from '../AdSense';
import { saveProfile, saveHistory, auth } from '../api/styleApi';
import WardrobePanel from './WardrobePanel';
import { saveWardrobeItem } from '../api/styleApi';
import { usePlan } from '../context/PlanContext';
import WeatherTip from './WeatherTip';
import ColorScanner from './ColorScanner';
import StyleBot from './StyleBot';
import ToolsTab from './ToolsTab';
import StyleNavigator from './StyleNavigator';
import { getLocalizedTip } from '../data/localTips';
import { logEvent, EVENTS } from '../utils/analytics';
import { useCart } from '../context/CartContext';
import ShoppingCart from './ShoppingCart';
import ProfilePanel from './ProfilePanel';
import { FashionIcons, IconRenderer } from './Icons';

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



function DailyDropModal({ lastAnalysis, isDark, onClose }) {
  const { t } = useLanguage();
  const [revealed, setRevealed] = useState(false);
  const handleReveal = () => {
    setRevealed(true);
    setTimeout(() => {
      localStorage.setItem('sg_daily_drop_date', new Date().toLocaleDateString('en-CA'));
      onClose();
    }, 2500);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className={`w-full max-w-sm rounded-[2.5rem] p-8 text-center border-2 border-purple-500/50 shadow-2xl relative overflow-hidden glass-card`}>
        {!revealed ? (
          <div className="space-y-6 scale-in">
            <div className="w-20 h-20 mx-auto bg-purple-500/10 rounded-3xl flex items-center justify-center p-4 text-purple-500">
              <IconRenderer icon={FashionIcons.Wardrobe} />
            </div>
            <div>
              <h2 className="text-2xl font-black">{t('dailyDropReady')}</h2>
              <p className="text-sm mt-2 font-medium opacity-70">{t('dailyDropSub').replace('{skinTone}', lastAnalysis?.skinTone)}</p>
            </div>
            <button
              onClick={handleReveal}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl text-white font-black text-lg shadow-lg pulse-glow"
            >
              {t('unlockOutfit')}
            </button>
            <button onClick={() => { localStorage.setItem('sg_daily_drop_date', new Date().toLocaleDateString('en-CA')); onClose(); }} className="text-xs opacity-40 hover:opacity-100">{t('skipToday')}</button>
          </div>
        ) : (
          <div className="scale-in space-y-4">
            <div className="w-12 h-12 mx-auto text-purple-500 animate-pulse">
              <IconRenderer icon={FashionIcons.AI} />
            </div>
            <h2 className="text-xl font-black">{t('unlockingWardrobe')}</h2>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3].map(i => <div key={i} className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
        {/* Bottom Ad Card */}
        <div className="mt-8 rounded-3xl p-6 border border-[var(--border-primary)] bg-[var(--bg-accent)] overflow-hidden">
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-3 text-center">Sponsored Style Content</p>
          <AdSense />
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------

function HomeScreen({ user, onAnalyze, isPro, lastAnalysis }) {
  const { theme } = useContext(ThemeContext);
  const { t, language } = useLanguage();
  const isDark = theme === 'dark';

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
  const [streak] = useState(() => {
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
    return currentStreak;
  });

  // Gender Preference Logic
  const [genderPref, setGenderPref] = useState(() => localStorage.getItem('sg_gender_pref') || 'male');
  const toggleGenderPref = () => {
    const next = genderPref === 'male' ? 'female' : 'male';
    setGenderPref(next);
    localStorage.setItem('sg_gender_pref', next);
  };

  const [lastScore, setLastScore] = useState(() => localStorage.getItem('sg_last_fit_score'));

  useEffect(() => {
    const handleScore = () => setLastScore(localStorage.getItem('sg_last_fit_score'));
    window.addEventListener('sg_score_updated', handleScore);
    return () => window.removeEventListener('sg_score_updated', handleScore);
  }, []);

  // Global Profile Lock Priority
  const primaryProfile = JSON.parse(localStorage.getItem('sg_primary_profile') || 'null');
  const activeProfile = primaryProfile || lastAnalysis;
  const hasProfile = !!activeProfile;

  // Daily Drop Logic 🎁
  const [showDailyDrop, setShowDailyDrop] = useState(() => {
    const today = new Date().toLocaleDateString('en-CA');
    const lastDrop = localStorage.getItem('sg_daily_drop_date');
    return hasProfile && lastDrop !== today;
  });

  const gndr = activeProfile?.fullData?.gender || activeProfile?.gender || genderPref;
  const tone = (typeof (activeProfile?.skinTone || activeProfile?.skin_tone?.category) === 'string'
    ? (activeProfile?.skinTone || activeProfile?.skin_tone?.category)
    : 'medium')?.toLowerCase();

  const todayTip = getLocalizedTip(gndr, tone, language);
  const firstName = user?.name?.split(' ')[0] || '';
  return (
    <div className="pb-4 space-y-6">
      {showDailyDrop && <DailyDropModal lastAnalysis={lastAnalysis} isDark={isDark} isPro={isPro} onClose={() => setShowDailyDrop(false)} />}
      <div className="pt-2 flex justify-between items-start">
        <div>
          <p className="text-sm opacity-60">{t('goodDay')}</p>
          <h2 className="text-2xl font-black">
            {t('welcomeHey').replace('{name}', firstName)}
          </h2>
          <p className="text-xs mt-1 opacity-50">{t('discoverPerfect')}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* Gender Toggle */}
          {!lastAnalysis && (
            <button
              onClick={toggleGenderPref}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight border border-[var(--border-primary)] bg-[var(--bg-accent)] transition-all hover:scale-105"
            >
              <span className="w-3 h-3 text-purple-500"><IconRenderer icon={FashionIcons.User} /></span>
              <span>{t(genderPref)}</span>
            </button>
          )}
          {streak > 0 && (
            <div className="px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-orange-500/20 bg-orange-500/10">
              <span className="w-3 h-3 text-orange-500"><IconRenderer icon={FashionIcons.Accuracy} /></span>
              <span className="text-[10px] font-black text-orange-500">{streak}</span>
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
      <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-[var(--bg-accent)]">
        <div className="flex -space-x-1.5">
          {['#F5DEB3', '#C68642', '#7B4F2E', '#4A2C0A'].map((c, i) => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-[var(--border-primary)]" style={{ backgroundColor: c }} />
          ))}
        </div>
        <p className="text-xs font-semibold opacity-70">
          <span className="font-black text-purple-500 count-up">
            {displayCount.toLocaleString('en-IN')}
          </span> {t('profilesCreated')}
        </p>
      </div>

      {/* First-visit onboarding */}
      {showOnboarding && (
        <div className="tooltip-in rounded-2xl p-4 border-2 border-purple-500/50 relative bg-purple-500/5">
          <button onClick={dismissOnboarding} className="absolute top-3 right-3 text-xs px-2 py-1 rounded-lg opacity-40 hover:opacity-100 bg-[var(--bg-accent)]">✕</button>
          <p className="font-black text-sm mb-2 text-purple-600 dark:text-purple-400">{t('welcomeGuru')}</p>
          <div className="space-y-1.5">
            {[
              { step: '1', text: t('step1') },
              { step: '2', text: t('step2') },
              { step: '3', text: t('step3') },
            ].map(s => (
              <div key={s.step} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{s.step}</span>
                <p className="text-xs opacity-70">{s.text}</p>
              </div>
            ))}
          </div>
          <button onClick={() => { dismissOnboarding(); onAnalyze(); }}
            className="mt-3 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-purple-500/20">
            {t('getStarted')}
          </button>
        </div>
      )}

      {/* Consolidated Daily Intelligence Briefing */}
      <WeatherTip
        isDark={isDark}
        profile={activeProfile}
        genderPref={genderPref}
      />

      {/* Rate My Fit - Performance Tracker */}
      <div className="rounded-3xl p-5 border flex items-center gap-4 justify-between transition-all bg-orange-500/5 border-orange-500/20 shadow-xl">
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 text-orange-500">{t('rateMyFit')}</p>
          <div className="flex items-center gap-3">
            {lastScore ? (
              <div className="flex flex-col">
                <p className="text-2xl font-black">{lastScore}%</p>
                <p className="text-[9px] font-bold uppercase opacity-40">Last Fit Performance</p>
              </div>
            ) : (
              <p className="text-xs font-medium leading-tight opacity-70">{t('rateMyFitSub')}</p>
            )}
          </div>
        </div>
        <button
          onClick={onAnalyze}
          className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:scale-105 flex-shrink-0 heartbeat bg-orange-500 text-white shadow-orange-500/30"
        >
          {t('scanFit')}
        </button>
      </div>

      {/* Daily Style Tip reasoning box */}
      <div className="rounded-2xl p-4 border border-[var(--border-primary)] bg-[var(--bg-accent)] flex items-start gap-3">
        <span className="w-6 h-6 flex-shrink-0 opacity-80 text-purple-500"><IconRenderer icon={FashionIcons.Bulb} /></span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-purple-600 dark:text-purple-400">{t('styleTipDay')}</p>
          <p className="text-[11px] leading-relaxed italic opacity-60">“{todayTip.tip}”</p>
        </div>
      </div>

      {/* AdSense Ad */}
      <div className="mt-2 text-center py-4 bg-[var(--bg-accent)] border border-[var(--border-primary)] rounded-3xl overflow-hidden backdrop-blur-sm">
        <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-2">StyleGuru AI Partner Content</p>
        <AdSense />
      </div>
    </div>
  );
}



// ── Cart Button Component ────────────────────────────────────
function ProfileHeaderButton({ onOpenProfile, isDark }) {
  return (
    <button
      onClick={onOpenProfile}
      id="header-profile-button"
      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-all z-[60] active:scale-90 border border-[var(--border-primary)] bg-[var(--bg-accent)] shadow-sm hover:bg-purple-500/10"
      aria-label="Open Profile"
    >
      <span className="w-5 h-5 text-purple-500"><IconRenderer icon={FashionIcons.Star} /></span>
    </button>
  );
}

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { t } = useLanguage();
  const { isPro, usage, coins, setCoins } = usePlan();
  const { cart, clearCart } = useCart();
  const isDark = theme === 'dark';
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [currentGender, setCurrentGender] = useState('male');
  const [toast, setToast] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const lastAnalysis = (() => { try { return JSON.parse(localStorage.getItem('sg_last_analysis') || 'null'); } catch { return null; } })();
  const showToast = (msg) => setToast(msg);

  // Keep-alive system: ping health endpoint every 10 minutes to prevent sleep
  useEffect(() => {
    const keepAlive = async () => {
      try {
        const response = await fetch('/health', { method: 'GET' });
        if (response.ok) {
          // Success ping - only log in dev or as debug
          if (import.meta.env.DEV) console.debug('[Keep-Alive] ✅ Backend is active');
        }
      } catch (err) {
        // Only log failures
        console.warn('[Keep-Alive] ⚠️ Background ping failed:', err.message);
      }
    };

    keepAlive();
    const intervalId = setInterval(keepAlive, 600000);
    return () => clearInterval(intervalId);
  }, []);

  const handleUpgradeSuccess = async () => {
    // No longer needed
  };

  // Product order checkout handler
  const handleCheckoutClick = async (totals) => {
    if (!auth.currentUser) {
      showToast('❌ Please login first');
      return;
    }

    if (!cart || cart.length === 0) {
      showToast('❌ Cart is empty');
      return;
    }

    try {
      // Get token for API request
      const token = await auth.currentUser.getIdToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      // Create order on backend
      console.log('[Checkout] Creating order at:', apiUrl);
      const response = await fetch(`${apiUrl}/api/orders/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cart_items: cart,
          total_amount: totals.total
        })
      });

      if (!response.ok) {
        const error = await response.json();
        showToast(`❌ ${error.detail || 'Checkout failed'}`);
        return;
      }

      const data = await response.json();
      const { order_id, amount, currency } = data;
      console.log('[Checkout] Order created:', { order_id, amount, currency });

      // Initialize Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_BKnG5mzHD4nH0p',
        order_id,
        amount,
        currency,
        description: 'StyleGuru AI - Product Purchase',
        prefill: {
          email: auth.currentUser.email || '',
          name: auth.currentUser.displayName || 'Guest'
        },
        handler: async (response) => {
          try {
            // Generate idempotency key to prevent duplicate charges
            const idempotencyKey = `${auth.currentUser.uid}_${response.razorpay_payment_id}_${Date.now()}`;
            console.log('[Checkout] Idempotency Key:', idempotencyKey);

            // Verify payment on backend
            console.log('[Checkout] Verifying payment...');
            const verifyResponse = await fetch(`${apiUrl}/api/orders/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Idempotency-Key': idempotencyKey,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (verifyResponse.ok) {
              const result = await verifyResponse.json();
              console.log('[Checkout] ✅ Payment verified:', result);

              // Save order data to localStorage for success page
              const orderData = {
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                items: cart,
                total: totals.total,
                commission: result.commission_earned,
                timestamp: new Date().toISOString()
              };
              localStorage.setItem('sg_last_order', JSON.stringify(orderData));

              showToast(`✅ Order placed! Commission: ₹${result.commission_earned.toFixed(0)}`);

              // Clear cart after successful purchase
              clearCart();
              setCartOpen(false);

              // Redirect to order success page after 1 second
              setTimeout(() => {
                navigate('/order-success');
              }, 1000);
            } else {
              showToast('❌ Payment verification failed');
            }
          } catch (e) {
            console.error('Payment verification error:', e);
            showToast('❌ Verification error');
          }
        },
        modal: {
          ondismiss: () => {
            showToast('❌ Payment cancelled');
          }
        }
      };

      // Load and open Razorpay
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const rzp = new window.Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);
    } catch (e) {
      console.error('Checkout error:', e);
      showToast('❌ Checkout error');
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
        .catch(() => { }); // silently fail, will retry next time
    } catch { /* ignore */ }
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

    try {
      setResults(enriched);
    } catch (err) {
      console.error('[Dashboard] Error setting results:', err);
      setError('Failed to display results. Please try again.');
    } finally {
      setLoading(false);
    }

    // Save to Firestore and Log Event
    const uid = auth.currentUser?.uid;
    if (uid) {
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
        language: localStorage.getItem('styleguru_lang') || 'en',
        analyzed_at: new Date().toISOString(),
      };

      saveProfile(uid, profileData).catch(() => {
        showToast('Profile not synced — will retry on next login');
      });

      // AUTO-SAVE TO HISTORY (FIRESTORE ONLY)
      saveHistory(enriched).catch(err => {
        console.error('[API] Auto-save history failed:', err);
      });
    }
  };

  const navItems = [
    { id: 'home', icon: FashionIcons.Formal, label: t('navHome') },
    { id: 'analyze', icon: FashionIcons.Camera, label: t('navAnalyze') },
    { id: 'history', icon: FashionIcons.Analysis, label: t('navHistory') },
    { id: 'navigator', icon: FashionIcons.Global, label: t('navNavigator') || 'Navigator' },
    { id: 'tools', icon: FashionIcons.Wardrobe, label: t('navTools') }
  ];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== 'analyze') handleReset();
  };

  return (
    <div className="min-h-screen transition-colors duration-300 overflow-x-hidden selection:bg-purple-500/30" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      {/* Background glow effects that stay subtle in both modes */}
      <div className="fixed top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-pink-500/5 blur-[120px] pointer-events-none z-0" />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <header className="relative z-[60] flex items-center justify-between px-4 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/80 backdrop-blur-xl sticky top-0 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-purple-500/20">SG</div>
          <span className="font-black text-base bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">StyleGuru AI</span>
        </div>
        <div className="flex items-center gap-2">
          {results && activeTab === 'analyze' && (
            <button onClick={handleReset} className="text-[10px] font-black uppercase tracking-widest text-purple-600 border border-purple-500/30 px-3 py-1.5 rounded-xl hover:bg-purple-500/10 transition">
              {t('navNew')}
            </button>
          )}
          <ProfileHeaderButton onOpenProfile={() => handleTabChange('profile')} isDark={isDark} />

          <button
            onClick={toggleTheme}
            className="w-11 h-11 rounded-2xl bg-[var(--bg-accent)] border border-[var(--border-primary)] flex items-center justify-center shadow-sm hover:scale-105 transition-all"
          >
            {theme === 'dark' ? (
              <IconRenderer icon={FashionIcons.Bulb} className="w-5 h-5 text-yellow-400" />
            ) : (
              <IconRenderer icon={FashionIcons.Bulb} className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 pt-4 pb-24">
        <div className="tab-content" key={activeTab}>
          {activeTab === 'home' && (
            <HomeScreen
              user={user}
              lastAnalysis={lastAnalysis}
              onAnalyze={() => setActiveTab('analyze')}
              onTabChange={handleTabChange}
              onShowResult={(data) => { setResults(data); setActiveTab('analyze'); }}
              isPro={isPro}
            />
          )}

          {activeTab === 'analyze' && (
            <>
              {!results && !loading && !error && (
                <UploadSection
                  onLoadingStart={() => setLoading(true)}
                  onAnalysisComplete={handleAnalysisComplete}
                  onError={setError}
                  onImageSelected={setUploadedImage}
                  setUploadProgress={setUploadProgress}
                  currentGender={currentGender}
                  setCurrentGender={setCurrentGender}
                  isPro={isPro}
                  usage={usage}
                  coins={coins}
                  onCoinEmpty={() => { }}
                />
              )}
              {loading && <LoadingScreenWithProgress progress={uploadProgress} />}
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

          {activeTab === 'history' && <HistoryPanel onShowResult={(data) => { setResults(data); setActiveTab('analyze'); }} />}

          {activeTab === 'navigator' && <StyleNavigator user={user} onAnalyze={() => setActiveTab('analyze')} />}

          {activeTab === 'tools' && <ToolsTab uploadedImage={uploadedImage} analysisData={results} onShowResult={(data) => { setResults(data); setActiveTab('analyze'); }} onOpenScanner={() => setActiveTab('scanner')} />}

          {activeTab === 'scanner' && (
            <ColorScanner
              savedPalette={(() => {
                try {
                  return lastAnalysis?.fullData?.recommendations?.best_shirt_colors ||
                    lastAnalysis?.fullData?.recommendations?.best_dress_colors || [];
                } catch { return []; }
              })()}
              skinTone={lastAnalysis?.skinTone || ''}
              onClose={() => setActiveTab('home')}
            />
          )}

          {activeTab === 'profile' && (
            <ProfilePanel hideHeader onOpenUpgrade={() => { }} />
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t border-[var(--border-primary)] bg-[var(--bg-primary)]/90 safe-area-bottom shadow-lg">
        {/* Nav Container */}
        <div className="max-w-md mx-auto px-1 py-1.5">
          <div className="flex w-full items-end">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                style={{ flex: '1 1 0', minWidth: 0 }}
                className={`flex flex-col items-center justify-center gap-0 px-0.5 py-1 rounded-xl transition-all min-h-[50px] ${activeTab === item.id
                  ? 'text-purple-600 bg-purple-500/10'
                  : 'opacity-40 hover:opacity-100'
                  }`}
              >
                <span className={`w-6 h-6 mb-1 transition-transform duration-200 ${activeTab === item.id ? 'scale-110 text-purple-500' : 'text-[var(--text-primary)]'}`}>
                  <IconRenderer icon={item.icon} />
                </span>
                <span className={`text-[9px] font-black uppercase tracking-tighter leading-none text-center truncate w-full px-0.5 ${activeTab === item.id ? 'text-purple-600' : 'text-[var(--text-secondary)]'}`}>{item.label}</span>
                {activeTab === item.id && <div className="w-3 h-0.5 rounded-full bg-purple-600 mt-1" />}
              </button>
            ))}
          </div>
        </div>
      </nav>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <ShoppingCart isOpen={cartOpen} onClose={() => setCartOpen(false)} onProceedToCheckout={handleCheckoutClick} isDark={isDark} />
      <StyleBot />
    </div>
  );
}

export default Dashboard;
