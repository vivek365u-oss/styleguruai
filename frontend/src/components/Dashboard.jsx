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
import { saveProfile, auth } from '../api/styleApi';
import WardrobePanel from './WardrobePanel';
import { saveWardrobeItem, activateProSubscription, consumeCoin } from '../api/styleApi';
import { usePlan } from '../context/PlanContext';
import PaywallModal from './PaywallModal';
import { PlansUpgradeScreen } from './PlansUpgradeScreen';
import OOTDCard from './OOTDCard';
import WeatherTip from './WeatherTip';
import ColorScanner from './ColorScanner';
import StyleBot from './StyleBot';
import ToolsTab from './ToolsTab';
import { getLocalizedTip } from '../data/localTips';
import { logEvent, EVENTS } from '../utils/analytics';
import { useCart } from '../context/CartContext';
import ShoppingCart from './ShoppingCart';
import ProfilePanel from './ProfilePanel';

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
              {[1, 2, 3].map(i => <div key={i} className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
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
  const firstName = user?.name?.split(' ')[0] || '';
  return (
    <div className="pb-4 space-y-6">
      {showDailyDrop && <DailyDropModal lastAnalysis={lastAnalysis} isDark={isDark} onClose={() => setShowDailyDrop(false)} />}
      <div className="pt-2 flex justify-between items-start">
        <div>
          <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{t('goodDay')}</p>
          <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('welcomeHey').replace('{name}', firstName)}
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
          {['#F5DEB3', '#C68642', '#7B4F2E', '#4A2C0A'].map((c, i) => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-white/30" style={{ backgroundColor: c }} />
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



// ── Cart Button Component ────────────────────────────────────
function CartButton({ setCartOpen }) {
  const { cart } = useCart();
  const itemCount = cart.length;

  return (
    <button
      onClick={() => setCartOpen(true)}
      className="relative w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg hover:bg-white/10 transition"
    >
      🛒
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
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
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [showPlansScreen, setShowPlansScreen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const lastAnalysis = (() => { try { return JSON.parse(localStorage.getItem('sg_last_analysis') || 'null'); } catch { return null; } })();
  const showToast = (msg) => setToast(msg);

  const handleUpgradeSuccess = async () => {
    try {
      if (auth.currentUser) {
        await activateProSubscription(auth.currentUser.uid);
        // Refresh the context to unlock the app
        window.location.reload(); // Quickest way to hard refresh React context states for Pro bounds
      }
    } catch {
      showToast('❌ Upgrade failed to sync');
    }
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

    // Save profile and Deduct Coins to Firestore
    const uid = auth.currentUser?.uid;
    if (uid) {
      // Deduct usage constraint for free users dynamically
      if (!isPro) {
        const cost = enriched.type === 'couple' ? 2 : 1;
        consumeCoin(cost).then((res) => {
          if (res.data && res.data.success) {
            setCoins(res.data.remaining_coins);
          }
        }).catch((err) => console.log('Coin sink failed to flush', err));
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
    { id: 'home', emoji: '🏠', label: t('navHome') },
    { id: 'analyze', emoji: '📸', label: t('navAnalyze') },
    { id: 'wardrobe', emoji: '👗', label: t('navWardrobe') },
    { id: 'tools', emoji: '🛠️', label: t('navTools') },
    { id: 'profile', emoji: '❤️', label: t('navProfile') }
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
          <CartButton cartOpen={cartOpen} setCartOpen={setCartOpen} />
          {!isPro && (
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider border border-orange-500/30 text-amber-500 px-3 py-1.5 rounded-xl shadow-sm bg-orange-900/10 hover:bg-orange-900/20 transition cursor-pointer" onClick={() => setShowPlansScreen(true)}>
              <span>🪙</span> {coins}
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
                  onCoinEmpty={() => setShowPlansScreen(true)}
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

          {activeTab === 'wardrobe' && <WardrobePanel user={user} onShowResult={(data) => { setResults(data); setActiveTab('analyze'); }} />}

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
            <ProfilePanel hideHeader onOpenUpgrade={() => setShowPlansScreen(true)} />
          )}
        </div>
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t ${theme === 'dark' ? 'bg-[#050816]/95 border-white/10' : 'bg-slate-100/95 border-purple-200 shadow-lg'}`}>
        {/* Nav Container: Perfect equal distribution — each item gets exact 20% */}
        <div className="max-w-lg mx-auto px-2 py-2">
          <div className="flex w-full">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                style={{ flex: '1 1 0', minWidth: 0 }}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all min-h-[56px] ${activeTab === item.id
                    ? 'text-purple-500 bg-purple-500/10'
                    : theme === 'dark'
                      ? 'text-white/40 hover:text-white/70 hover:bg-white/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                  }`}
              >
                <span className={`text-[22px] leading-none transition-transform duration-200 ${activeTab === item.id ? 'scale-110' : ''}`}>{item.emoji}</span>
                <span className={`text-[9px] font-bold leading-tight text-center truncate w-full px-1 ${activeTab === item.id ? 'text-purple-400' : theme === 'dark' ? 'text-white/40' : 'text-gray-600'
                  }`}>{item.label}</span>
                {activeTab === item.id && <div className="w-4 h-0.5 rounded-full bg-purple-400 mt-0.5" />}
              </button>
            ))}
          </div>
        </div>
      </nav>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {showPlansScreen && (
        <PlansUpgradeScreen
          isDark={theme === 'dark'}
          onSelectPlan={() => {
            setShowPlansScreen(false);
            // Open payment modal
            setPaywallOpen(true);
          }}
          onClose={() => setShowPlansScreen(false)}
        />
      )}
      <PaywallModal isOpen={paywallOpen} onClose={() => setPaywallOpen(false)} onUpgrade={handleUpgradeSuccess} isDark={theme === 'dark'} />
      <ShoppingCart isOpen={cartOpen} onClose={() => setCartOpen(false)} onProceedToCheckout={handleCheckoutClick} isDark={isDark} />
      <StyleBot />
    </div>
  );
}

export default Dashboard;
