import React, { useState, useEffect, useRef } from 'react';
import { logEvent, EVENTS } from '../utils/analytics';
import { useLanguage } from '../i18n/LanguageContext';
import { auth } from '../api/styleApi';
import axios from 'axios';

const API = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000
});

// Add auth interceptor
API.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      console.error('[PaywallModal] Token fetch failed:', e);
    }
  }
  return config;
});

function PaywallModal({ isOpen, onClose, onUpgrade, isDark }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [tab, setTab] = useState('coins');
  const [selectedPlan, setSelectedPlan] = useState('coins_25');
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (isOpen) {
      logEvent(EVENTS.PAYWALL_VIEW);
      setPaymentError(null);
      // Load Razorpay script once when modal opens
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handlePayment = async (plan, retryCount = 0) => {
    if (!isMountedRef.current) return;
    
    logEvent(EVENTS.UPGRADE_CLICK, { plan });
    setLoading(true);
    setPaymentError(null);
    
    const user = auth.currentUser;
    if (!user) {
      if (isMountedRef.current) {
        setPaymentError('Please log in first to upgrade.');
        setLoading(false);
      }
      return;
    }

    // Wait for Razorpay to be available
    if (!window.Razorpay) {
      if (retryCount > 6) {
         setPaymentError('Payment gateway blocked. Please disable AdBlocker or try another browser.');
         setLoading(false);
         return;
      }
      setTimeout(() => handlePayment(plan, retryCount + 1), 500);
      return;
    }

    try {
      // 1. Create Order on Backend first
      const orderRes = await API.post('/api/subscriptions/create-checkout', { plan });
      if (!orderRes.data.success) {
        throw new Error('Failed to create order');
      }

      const { order_id, amount, currency } = orderRes.data;
      const planName = plan === 'monthly' ? '₹59/month' : '₹499/year';
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_BKnG5mzHD4nH0p', // Using correct env var config
        amount: amount,
        currency: currency,
        order_id: order_id, // CRITICAL: Pass order_id to enable signature verification later
        name: 'StyleGuru Premium',
        description: `Premium Subscription - ${planName}`,
        prefill: {
          email: user.email || '',
          name: user.displayName || 'User',
        },
        handler: async (response) => {
          try {
            console.log('[Payment] Processing payment response...');
            
            // 2. Call backend to verify and activate
            const res = await API.post('/api/subscriptions/activate', {
              uid: user.uid,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan: plan,
            });
            
            console.log('[Payment] ✅ Subscription activated:', res.data);
            if (isMountedRef.current) setLoading(false);
            // Wait briefly before invoking success callback
            setTimeout(() => onUpgrade?.(), 500);
          } catch (err) {
            console.error('[Payment] ❌ Error:', err.response?.data || err.message);
            if (isMountedRef.current) {
               setPaymentError('Payment verification failed. If money was deducted, contact support.');
               setLoading(false);
            }
          }
        },
        modal: {
          ondismiss: () => {
            console.log('[Payment] Modal dismissed by user');
            if (isMountedRef.current) setLoading(false);
          }
        }
      };
      
      const razorpay = new window.Razorpay(options);
      
      // Handle edge cases where Razorpay fails to open
      razorpay.on('payment.failed', function (response){
        console.error('[Payment] Failed event:', response.error.description);
        if (isMountedRef.current) {
           setPaymentError(`Payment failed: ${response.error.description}`);
           setLoading(false);
        }
      });
      
      razorpay.open();
    } catch (err) {
      console.error('Payment initialization error:', err);
      if (isMountedRef.current) {
         setPaymentError('Could not initialize payment. Server may be starting, try again in 30 seconds.');
         setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-fade-in z-10 ${
        isDark ? 'bg-[#0f1123] border border-white/10' : 'bg-white border border-gray-200'
      }`}>
        
        {/* Header Graphic */}
        <div className={`relative h-40 flex flex-col items-center justify-center overflow-hidden transition-all duration-500 ${
          tab === 'coins' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-purple-600 to-pink-600'
        }`}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/20 rounded-full blur-3xl animate-pulse" />
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/40 transition"
          >
            ✕
          </button>
          
          <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-2 z-10 rotate-3">
            <span className={`text-3xl font-black text-transparent bg-clip-text ${
              tab === 'coins' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-purple-600 to-pink-600'
            }`}>
              {tab === 'coins' ? '🪙' : 'PRO'}
            </span>
          </div>
          <h2 className="text-white text-xl font-black tracking-widest z-10 drop-shadow-md">
            {tab === 'coins' ? 'TOP-UP COINS' : t('proTitle')}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 relative z-10 bg-inherit">
          {/* Main Tab Switcher */}
          <div className={`flex p-1 rounded-xl mb-6 shadow-inner ${isDark ? 'bg-[#1a1c30]' : 'bg-gray-100'}`}>
            <button
              onClick={() => { setTab('coins'); setSelectedPlan('coins_25'); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                tab === 'coins' ? 'bg-white text-orange-600 shadow-sm' : isDark ? 'text-white/50' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🪙 Pay-as-you-go
            </button>
            <button
              onClick={() => { setTab('subs'); setSelectedPlan('weekly'); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                tab === 'subs' ? 'bg-white text-purple-600 shadow-sm' : isDark ? 'text-white/50' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              👑 Unlimited Sub
            </button>
          </div>

          <div className="text-center mb-6">
            
            {/* Plan Selectors */}
            {tab === 'coins' ? (
              <div className="flex gap-2 justify-center mb-4">
                <button
                  onClick={() => setSelectedPlan('coins_10')}
                  className={`px-3 py-2 rounded-lg font-bold text-xs transition-all ${
                    selectedPlan === 'coins_10'
                      ? 'bg-orange-500 text-white'
                      : isDark ? 'bg-white/5 text-white/50' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  10 Coins
                </button>
                <button
                  onClick={() => setSelectedPlan('coins_25')}
                  className={`px-3 py-2 rounded-lg font-bold text-xs transition-all relative ${
                    selectedPlan === 'coins_25'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                      : isDark ? 'bg-white/5 text-white/50' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  25 Coins
                  <span className="absolute -top-2 -right-2 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-yellow-400 text-yellow-900 border border-yellow-200">Bonus</span>
                </button>
              </div>
            ) : (
              <div className="flex gap-1.5 justify-center mb-4">
                <button
                  onClick={() => setSelectedPlan('weekly')}
                  className={`px-2 py-2 rounded-lg font-bold text-[10px] transition-all ${
                    selectedPlan === 'weekly' ? 'bg-purple-600 text-white' : isDark ? 'bg-white/5 text-white/50' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setSelectedPlan('monthly')}
                  className={`px-2 py-2 rounded-lg font-bold text-[10px] transition-all ${
                    selectedPlan === 'monthly' ? 'bg-purple-600 text-white' : isDark ? 'bg-white/5 text-white/50' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSelectedPlan('yearly')}
                  className={`px-2 py-2 rounded-lg font-bold text-[10px] transition-all relative ${
                    selectedPlan === 'yearly' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : isDark ? 'bg-white/5 text-white/50' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Yearly
                  <span className={`absolute -top-2 right-0 text-[8px] font-black px-1 py-0.5 rounded-full ${selectedPlan === 'yearly' ? 'bg-yellow-400 text-yellow-900' : 'bg-yellow-100 text-yellow-800'}`}>Save 16%</span>
                </button>
              </div>
            )}
            
            {/* Price Display */}
            <div className="mt-3 flex items-end justify-center gap-1 leading-none">
              <span className={`text-5xl tracking-tighter font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {selectedPlan === 'coins_10' || selectedPlan === 'weekly' ? '₹29' :
                 selectedPlan === 'coins_25' ? '₹49' :
                 selectedPlan === 'monthly' ? '₹59' : '₹499'}
              </span>
              <span className={`text-sm mb-1 font-bold ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                {tab === 'coins' ? 'once' : selectedPlan === 'weekly' ? '/week' : selectedPlan === 'monthly' ? '/month' : '/year'}
              </span>
            </div>
            {selectedPlan === 'yearly' && (
              <p className={`text-xs mt-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>₹41/month billed annually</p>
            )}
          </div>

          {/* Features */}
          <div className="space-y-4 mb-6">
            {tab === 'coins' ? (
              <>
                <FeatureItem icon="✅" title="No Subscriptions" desc="Pay once, use whenever you like" isDark={isDark} />
                <FeatureItem icon="📸" title="1 Coin = 1 Solo Scan" desc="Analyze skin to get color palettes" isDark={isDark} />
                <FeatureItem icon="👩‍❤️‍👨" title="2 Coins = Couple Match" desc="Compare colors with your partner" isDark={isDark} />
                <FeatureItem icon="♾️" title="No Expiry" desc="Your coins last forever" isDark={isDark} />
              </>
            ) : (
              <>
                <FeatureItem icon="♾️" title="Unlimited Analyses" desc="Analyze colors as many times as you need" isDark={isDark} />
                <FeatureItem icon="🛍️" title="Full Ad-Free Shopping" desc="Zero interruptions anywhere" isDark={isDark} />
                <FeatureItem icon="📚" title="Unlimited History" desc="Access all your past analyses forever" isDark={isDark} />
              </>
            )}
          </div>

          {/* Inline Error Message */}
          {paymentError && (
            <div className={`mb-4 p-2.5 rounded-lg text-xs font-bold text-center border animate-bounce-short ${
              isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              ⚠️ {paymentError}
            </div>
          )}

          {/* Checkout Button */}
          <button 
            onClick={() => handlePayment(selectedPlan)}
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${
              loading 
                ? 'bg-gray-500 text-white cursor-wait opacity-80'
                : tab === 'coins'
                   ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-orange-500/50'
                   : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-purple-500/50'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              `Get ${tab === 'coins' ? 'Coins' : 'PRO'} with Razorpay`
            )}
          </button>
          
          <p className={`text-[9px] text-center mt-3 font-medium leading-relaxed ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
            Secure payment powered by Razorpay • Cancel anytime • No hidden charges
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, desc, isDark }) {
  return (
    <div className="flex gap-4 items-start">
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-base shadow-sm ${isDark ? 'bg-white/10 border border-white/20' : 'bg-purple-50 border border-purple-100'}`}>
        {icon}
      </div>
      <div>
        <h4 className={`text-sm font-black ${isDark ? 'text-white/90' : 'text-gray-800'}`}>{title}</h4>
        <p className={`text-[10px] leading-tight mt-0.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{desc}</p>
      </div>
    </div>
  );
}

export default PaywallModal;
