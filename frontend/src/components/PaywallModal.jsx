import React, { useState, useEffect, useRef } from 'react';
import { logEvent, EVENTS } from '../utils/analytics';
import { useLanguage } from '../i18n/LanguageContext';
import { auth, API } from '../api/styleApi'; // Unified API instance

function PaywallModal({ isOpen, onClose, onUpgrade, isDark }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [tab, setTab] = useState('coins');
  const [selectedPlan, setSelectedPlan] = useState('coins_25');
  const isMountedRef = useRef(true);
  const headingCls = isDark ? 'text-white' : 'text-gray-900';
  const labelCls = isDark ? 'text-white/40' : 'text-gray-400';

  useEffect(() => {
    if (isOpen) {
      logEvent(EVENTS.PAYWALL_VIEW);
      setPaymentError(null);
      // Note: Razorpay script loading moved to handlePayment to ensure 
      // it loads only when user clicks payment button (more efficient)
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

  const handlePayment = async (plan) => {
    if (!isMountedRef.current) return;
    
    console.log(`[Payment] Starting payment for plan: ${plan}`);
    logEvent(EVENTS.UPGRADE_CLICK, { plan });
    setLoading(true);
    setPaymentError(null);
    
    const user = auth.currentUser;
    if (!user) {
      console.error('[Payment] No user logged in');
      if (isMountedRef.current) {
        setPaymentError('Please log in first to upgrade.');
        setLoading(false);
      }
      return;
    }

    try {
      // 1. Create Order on Backend first
      console.log('[Payment] Creating order on backend...');
      const orderRes = await API.post('/api/subscriptions/create-checkout', { plan });
      if (!orderRes.data.success) {
        throw new Error('Failed to create order');
      }

      const { order_id, amount, currency } = orderRes.data;
      console.log('[Payment] Order created:', { order_id, amount, currency });
      
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      console.log('[Payment] Using Razorpay key:', razorpayKey ? `${razorpayKey.substring(0, 15)}...` : 'UNDEFINED');
      
      if (!razorpayKey) {
        console.error('[Payment] ❌ VITE_RAZORPAY_KEY_ID is not set in environment');
        throw new Error('Razorpay key not configured. Contact support.');
      }
      
      const options = {
        key: razorpayKey,
        amount: amount,
        currency: currency,
        order_id: order_id,
        name: 'StyleGuru Premium',
        description: plan.startsWith('coins_') ? `Coin Purchase - ${plan}` : `Premium Subscription - ${plan}`,
        prefill: {
          email: user.email || '',
          name: user.displayName || 'User',
        },
        handler: async (response) => {
          try {
            console.log('[Payment] Processing payment response...');
            
            // Generate idempotency key to prevent duplicate charges
            const idempotencyKey = `${user.uid}_${response.razorpay_payment_id}_${Date.now()}`;
            console.log('[Payment] Idempotency Key:', idempotencyKey);
            
            // 2. Call backend to verify and activate with idempotency
            const res = await API.post('/api/subscriptions/activate', {
              uid: user.uid,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan: plan,
              idempotency_key: idempotencyKey,
            }, {
              headers: {
                'Idempotency-Key': idempotencyKey,  // Also send in headers
              }
            });
            
            console.log('[Payment] ✅ Subscription activated:', res.data);
            console.log('[Payment] Payment ID for reference:', response.razorpay_payment_id);
            
            if (isMountedRef.current) {
              setLoading(false);
              setPaymentError(null);
            }
            
            // Wait briefly before invoking success callback
            setTimeout(() => {
              onUpgrade?.();
            }, 500);
          } catch (err) {
            console.error('[Payment] ❌ Error:', err.response?.data || err.message);
            
            if (isMountedRef.current) {
              const paymentId = response?.razorpay_payment_id;
              const supportCode = paymentId ? paymentId.substring(0, 20) : 'UNKNOWN';
              const errorData = err.response?.data;
              
              if (err.response?.status === 500 || err.response?.status === 503) {
                // Server error - payment MIGHT have gone through on Razorpay side
                setPaymentError(
                  `⚠️ Payment processing issue!\n\n` +
                  `Don't worry - your money is safe.\n\n` +
                  `Status: Check in 30 seconds\n` +
                  `Support Code: ${supportCode}\n\n` +
                  `If still not working, contact support with this code.`
                );
              } else {
                setPaymentError(
                  `❌ ${errorData?.message || 'Payment failed'}\n\n` +
                  `Support Code: ${supportCode}\n\n` +
                  `Contact support if this persists.`
                );
              }
              
              setLoading(false);
            }
          }
        },
        modal: {
          ondismiss: () => {
            console.log('[Payment] Modal dismissed by user');
            if (isMountedRef.current) {
              setLoading(false);
              setPaymentError(null);
            }
          }
        }
      };

      // ✅ KEY FIX: Load Razorpay script with onload handler (same as Cart checkout)
      // Check if already loaded globally (from main.jsx)
      const loadRazorpay = () => {
        return new Promise((resolve, reject) => {
          if (window.Razorpay) {
            console.log('[Payment] ✅ Razorpay already loaded globally');
            resolve();
            return;
          }

          console.log('[Payment] Loading Razorpay script...');
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;

          script.onload = () => {
            console.log('[Payment] ✅ Razorpay script loaded');
            resolve();
          };

          script.onerror = () => {
            console.error('[Payment] ❌ Failed to load Razorpay script from CDN');
            reject(new Error('Failed to load Razorpay CDN'));
          };

          document.head.appendChild(script);
        });
      };

      // Wait for Razorpay to load, then open payment
      await loadRazorpay();

      if (!window.Razorpay) {
        throw new Error('Razorpay not available after loading');
      }

      console.log('[Payment] Creating Razorpay instance...');
      const rzp = new window.Razorpay(options);
      console.log('[Payment] Opening Razorpay modal...');
      rzp.open();
      console.log('[Payment] ✅ Razorpay modal opened');

    } catch (err) {
      console.error('[Payment] ❌ Payment error:', err);
      if (isMountedRef.current) {
         setPaymentError(`Payment error: ${err.message}`);
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
      <div className={`relative w-full max-w-sm max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl animate-fade-in z-10 ${
        isDark ? 'bg-[#0f1123] border border-white/10' : 'bg-white border border-gray-200'
      }`}>
        
        {/* Header Graphic - More compact */}
        <div className={`relative h-32 flex-shrink-0 flex flex-col items-center justify-center overflow-hidden transition-all duration-500 ${
          tab === 'coins' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-purple-600 to-pink-600'
        }`}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/20 rounded-full blur-3xl animate-pulse" />
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/40 transition z-20"
          >
            ✕
          </button>
          
          <div className="w-12 h-12 bg-white rounded-xl shadow-xl flex items-center justify-center mb-1 z-10 rotate-3">
            <span className={`text-2xl font-black text-transparent bg-clip-text ${
              tab === 'coins' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-purple-600 to-pink-600'
            }`}>
              {tab === 'coins' ? '🪙' : 'PRO'}
            </span>
          </div>
          <h2 className="text-white text-lg font-black tracking-widest z-10 drop-shadow-md">
            {tab === 'coins' ? 'TOP-UP COINS' : t('proTitle')}
          </h2>
        </div>

        {/* Content - Scrollable if needed */}
        <div className={`p-5 flex-1 overflow-y-auto scrollbar-hide relative z-10 ${isDark ? 'bg-[#0f1123]' : 'bg-white'}`}>
          {/* Main Tab Switcher */}
          <div className={`flex p-1 rounded-xl mb-5 shadow-inner ${isDark ? 'bg-[#1a1c30]' : 'bg-gray-100'}`}>
            <button
              onClick={() => { setTab('coins'); setSelectedPlan('coins_25'); }}
              className={`flex-1 py-2.5 px-1 text-[9px] font-black rounded-lg transition-all border-2 ${
                tab === 'coins' ? `border-amber-400 ${isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-50 text-amber-900'} shadow-lg` : isDark ? 'border-white/10 text-white/50 bg-white/5' : 'border-gray-200 text-gray-500'
              }`}
            >
              <span className="text-base mb-0.5 block">🪙</span>
              COINS
            </button>
            <button
              onClick={() => { setTab('subs'); setSelectedPlan('weekly'); }}
              className={`flex-1 py-2.5 px-1 text-[9px] font-black rounded-lg transition-all border-2 ${
                tab === 'subs' ? `border-purple-400 ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-50 text-purple-900'} shadow-lg` : isDark ? 'border-white/10 text-white/50 bg-white/5' : 'border-gray-200 text-gray-500'
              }`}
            >
              <span className="text-base mb-0.5 block">👑</span>
              SUBSCRIPTION
            </button>
          </div>

          <div className="text-center mb-5">
            {/* Plan Selectors - Improved tap areas */}
            {tab === 'coins' ? (
              <div className="flex gap-2 justify-center mb-3">
                <button
                  onClick={() => setSelectedPlan('coins_10')}
                  className={`flex-1 py-2 rounded-lg font-bold text-[10px] uppercase transition-all ${
                    selectedPlan === 'coins_10'
                      ? 'bg-orange-500 text-white shadow-md'
                      : isDark ? 'bg-white/5 text-white/40' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  10 Coins
                </button>
                <button
                  onClick={() => setSelectedPlan('coins_25')}
                  className={`flex-1 py-2 rounded-lg font-bold text-[10px] uppercase transition-all relative ${
                    selectedPlan === 'coins_25'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                      : isDark ? 'bg-white/5 text-white/40' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  25 Coins
                  <span className="absolute -top-2 -right-1 text-[7px] font-black px-1 py-0.5 rounded-full bg-yellow-400 text-yellow-900 border border-yellow-200">+5 Free</span>
                </button>
              </div>
            ) : (
              <div className="flex gap-1.5 justify-center mb-3">
                {['weekly', 'monthly', 'yearly'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPlan(p)}
                    className={`flex-1 py-2 rounded-lg font-bold text-[9px] uppercase transition-all relative ${
                      selectedPlan === p ? 'bg-purple-600 text-white shadow-md' : isDark ? 'bg-white/5 text-white/40' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {p}
                    {p === 'yearly' && <span className="absolute -top-2 right-0 text-[7px] font-black px-1 py-0.5 rounded-full bg-yellow-400 text-yellow-900">Save 17%</span>}
                  </button>
                ))}
              </div>
            )}
            
            {/* Price Display */}
            <div className="mt-2 flex items-end justify-center gap-1 leading-none">
              <span className={`text-4xl tracking-tighter font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {selectedPlan === 'coins_10' || selectedPlan === 'weekly' ? '₹29' :
                 selectedPlan === 'coins_25' ? '₹49' :
                 selectedPlan === 'monthly' ? '₹59' : '₹499'}
              </span>
              <span className={`text-[10px] mb-1 font-bold opacity-50 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {tab === 'coins' ? 'once' : selectedPlan === 'weekly' ? '/week' : selectedPlan === 'monthly' ? '/month' : '/year'}
              </span>
            </div>

            {/* Confirmation Box (Compact) */}
            <div className={`mt-4 p-2.5 rounded-xl border flex items-center justify-between gap-3 text-left ${
              tab === 'coins' 
                ? isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50/50 border-amber-200'
                : isDark ? 'bg-purple-500/5 border-purple-500/20' : 'bg-purple-50/50 border-purple-200'
            }`}>
              <div>
                <p className={`text-[8px] font-black uppercase opacity-60 ${headingCls}`}>Total Amount</p>
                <p className={`text-xs font-black ${headingCls}`}>
                  ₹{selectedPlan === 'coins_10' || selectedPlan === 'weekly' ? '29' :
                     selectedPlan === 'coins_25' ? '49' :
                     selectedPlan === 'monthly' ? '59' : '499'}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-[10px] font-bold ${tab === 'coins' ? 'text-amber-500' : 'text-purple-500'}`}>
                  {tab === 'coins' ? '🪙 Coin Top-up' : '👑 Pro Access'}
                </p>
              </div>
            </div>
          </div>

          {/* Features - More compact */}
          <div className="space-y-3 mb-6">
            {tab === 'coins' ? (
              <>
                <CompactFeatureItem icon="📸" title="1 Coin = 1 Scan" />
                <CompactFeatureItem icon="👩‍❤️‍👨" title="2 Coins = Couple Match" />
                <CompactFeatureItem icon="♾️" title="No Expiry" />
              </>
            ) : (
              <>
                <CompactFeatureItem icon="♾️" title="Unlimited Analyses" />
                <CompactFeatureItem icon="🛍️" title="Ad-Free Shopping" />
                <CompactFeatureItem icon="📚" title="Full Wardrobe History" />
              </>
            )}
          </div>

          {/* Inline Error Message */}
          {paymentError && (
            <div className={`mb-4 p-2 rounded-lg text-[10px] font-bold text-center border animate-bounce-short ${
              isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              ⚠️ {paymentError}
            </div>
          )}

          {/* Checkout Button */}
          <div className="space-y-2 sticky bottom-0 pt-2 pb-1 bg-inherit">
            <button 
              onClick={() => handlePayment(selectedPlan)}
              disabled={loading}
              className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${
                loading 
                  ? 'bg-gray-500 text-white cursor-wait opacity-80'
                  : tab === 'coins'
                     ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-orange-500/50'
                     : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-purple-500/50'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ₹${selectedPlan === 'coins_10' || selectedPlan === 'weekly' ? '29' : selectedPlan === 'coins_25' ? '49' : selectedPlan === 'monthly' ? '59' : '499'} with Razorpay`
              )}
            </button>

            <button 
              onClick={onClose}
              disabled={loading}
              className={`w-full py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
                isDark ? 'text-white/30 hover:text-white/50 bg-white/5' : 'text-gray-400 hover:text-gray-500 bg-gray-50'
              }`}
            >
              Cancel
            </button>
          </div>
          
          <p className={`text-[8px] text-center mt-2 font-medium opacity-40 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Secure payment powered by Razorpay • No hidden charges
          </p>
        </div>
      </div>
    </div>
  );
}

function CompactFeatureItem({ icon, title }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-base">{icon}</span>
      <span className="text-[11px] font-bold opacity-80">{title}</span>
    </div>
  );
}

export default PaywallModal;
