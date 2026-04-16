import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlan } from '../context/PlanContext';
import { createRazorpayOrder, verifyRazorpayPayment, auth } from '../api/styleApi';
import { FashionIcons, IconRenderer } from './Icons';
import { trackSubscriptionView, trackUpgradeClick, trackSubscriptionPurchase } from '../utils/analytics';

export default function SubscriptionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingTier, setLoadingTier] = useState(null);
  const [onSuccessCallback, setOnSuccessCallback] = useState(null);
  const adWatchedRef = useRef(false);
  const { isPro, refreshPlan } = usePlan();

  useEffect(() => {
    const handleOpen = (e) => {
      adWatchedRef.current = false; // reset on every open
      setIsOpen(true);
      const source = e.detail?.source || 'unknown';
      trackSubscriptionView(source);
      if (e.detail && e.detail.onSuccess) {
        setOnSuccessCallback(() => e.detail.onSuccess);
      } else {
        setOnSuccessCallback(null);
      }
    };
    window.addEventListener('open_subscription_modal', handleOpen);

    // Load Razorpay Script dynamically if not already loaded
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => window.removeEventListener('open_subscription_modal', handleOpen);
  }, []);

  // Called when user closes without watching ad
  const handleClose = () => {
    setIsOpen(false);
    if (!adWatchedRef.current && onSuccessCallback) {
      onSuccessCallback('skipped');
    }
  };

  const handleCheckout = async (tier) => {
    if (!window.Razorpay) {
      alert("Payment gateway failed to load. Please check your internet connection.");
      return;
    }

    setLoadingTier(tier);
    trackUpgradeClick(tier);
    try {
      // 1. Ask backend to create the Order
      const res = await createRazorpayOrder(tier);
      if (!res.success) throw new Error("Order creation failed");

      // 2. Open Razorpay Checkout
      const options = {
        key: res.key,
        amount: res.order.amount,
        currency: res.order.currency,
        name: "StyleGuruAI",
        description: `Upgrade to StyleGuruAI ${tier.toUpperCase()}`,
        image: "https://StyleGuruAI.in/favicon.svg",
        order_id: res.order.id,
        handler: async function (response) {
          // 3. Verify Payment
          try {
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              tier: tier
            });
            alert("Payment Successful! Welcome to StyleGuruAI PRO.");
            adWatchedRef.current = true; // payment counts as success
            setIsOpen(false);
            const prices = { yearly: 2499, monthly: 499, coins: 199 };
            trackSubscriptionPurchase(tier, prices[tier] || 0);
            await refreshPlan();
            if (onSuccessCallback) {
              setTimeout(() => {
                onSuccessCallback(true);
              }, 500);
            }
          } catch (verifyError) {
            alert("Payment Verification Failed. Please contact support.");
          }
        },
        prefill: {
          name: auth?.currentUser?.displayName || "StyleGuruAI User",
          email: auth?.currentUser?.email || "user@StyleGuruAI.in"
        },
        theme: {
          color: "#8B5CF6"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert(`Payment Failed: ${response.error.description}`);
      });
      rzp.open();

    } catch (err) {
      console.error(err);
      alert("Failed to initiate checkout. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  const handleWatchAd = () => {
    setLoadingTier('ad');
    // Open Monetag Direct Link in new tab
    window.open('https://omg10.com/4/10863757', '_blank');

    const adStartTime = Date.now();
    let hiddenOnce = false;

    const visibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        hiddenOnce = true;
      } else if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - adStartTime;
        if (hiddenOnce && elapsed > 2000) {
          // User returned after at least 2 seconds
          cleanupAndSuccess();
        }
      }
    };

    let failsafeTimeout;

    const cleanupAndSuccess = () => {
      document.removeEventListener('visibilitychange', visibilityHandler);
      clearTimeout(failsafeTimeout);
      adWatchedRef.current = true;
      setIsOpen(false);
      setLoadingTier(null);
      trackSubscriptionPurchase('ad_watch', 0);
      if (onSuccessCallback) {
        onSuccessCallback(true);
      }
    };

    // Attach listener
    document.addEventListener('visibilitychange', visibilityHandler);

    // Fallback in case the browser doesn't fire visibilitychange (e.g. desktop split view)
    failsafeTimeout = setTimeout(() => {
       cleanupAndSuccess();
    }, 12000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        {/* Backdrop — signals skip on click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-slate-950/95"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-[#0A0F1C] border border-white/10 w-full max-w-lg rounded-[2.5rem] p-6 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Close button — signals skip */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
            title="Close"
          >
            ✕
          </button>

          {/* Header */}
          <div className="text-center mb-8 mt-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl">
              ✨
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">StyleGuruAI Pro</h2>
            <p className="text-sm font-bold text-white/40 uppercase tracking-widest mt-2">
              {isPro ? 'You are currently a Pro user' : 'Unlock Your Full Style Potential'}
            </p>
          </div>

          <div className="space-y-4">

            {/* ─────────────── TIER 1: YEARLY (Highlight) ─────────────── */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl opacity-30 group-hover:opacity-60 transition duration-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]" />
              <div className="relative border border-purple-500/50 bg-[#131024] rounded-3xl p-6 transition-transform group-active:scale-[0.98]">
                <div className="absolute top-0 right-6 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest shadow-lg">
                  Save 60%
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Yearly Master</h3>
                <div className="flex items-end gap-1 mt-1 mb-4">
                  <span className="text-4xl font-black text-white">₹2,499</span>
                  <span className="text-xs font-bold text-white/40 mb-1">/year</span>
                </div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-xs font-bold text-white/70"><span className="text-purple-400">✓</span> Unlimited DNA Analysis</li>
                  <li className="flex items-center gap-2 text-xs font-bold text-white/70"><span className="text-purple-400">✓</span> Zero Ads Experience</li>
                  <li className="flex items-center gap-2 text-xs font-bold text-white/70"><span className="text-purple-400">✓</span> Unlimited Wardrobe Size</li>
                  <li className="flex items-center gap-2 text-xs font-bold text-white/70"><span className="text-purple-400">✓</span> Advanced Face/Body Analytics</li>
                </ul>
                <button
                  onClick={() => handleCheckout('yearly')}
                  disabled={loadingTier === 'yearly'}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-xl disabled:opacity-50"
                >
                  {loadingTier === 'yearly' ? 'Processing...' : 'Get Yearly Access'}
                </button>
              </div>
            </div>

            {/* ─────────────── AD SECTION (between Yearly and Monthly) ─────────────── */}
            <div className="relative">
              {/* Divider label */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em]">Or try for free</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="border border-white/10 bg-gradient-to-br from-blue-950/40 to-indigo-950/40 rounded-3xl p-5">
                {/* Helper label */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">📺</span>
                  <div>
                    <h4 className="text-sm font-black text-white/90 tracking-tight">Watch Ad to Unlock</h4>
                    <p className="text-[10px] text-blue-400/80 font-semibold">Watch a short ad to unlock your result for free</p>
                  </div>
                  <div className="ml-auto px-2 py-1 rounded-lg bg-blue-500/15 border border-blue-500/20">
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Free</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Buy Coins */}
                  <button
                    onClick={() => handleCheckout('coins')}
                    disabled={loadingTier !== null}
                    className="py-3 px-2 rounded-xl border border-yellow-500/20 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {loadingTier === 'coins' ? 'Processing...' : '🪙 Buy 50 Coins (₹199)'}
                  </button>

                  {/* Watch Ad */}
                  <button
                    onClick={handleWatchAd}
                    disabled={loadingTier !== null}
                    className="py-3 px-2 rounded-xl border border-blue-500/30 bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-1 relative overflow-hidden group"
                  >
                    {/* Animated shimmer */}
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    {loadingTier === 'ad' ? (
                      <>
                        <span className="inline-block w-3 h-3 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />
                        <span>Watching…</span>
                      </>
                    ) : (
                      '📺 Watch Ad (Free)'
                    )}
                  </button>
                </div>

                {/* Helper text under ad buttons */}
                <p className="text-center text-[9px] text-white/25 font-semibold mt-2 tracking-wide">
                  ✦ Watch a short ad to unlock your analysis result for free ✦
                </p>
              </div>
            </div>

            {/* ─────────────── TIER 2: MONTHLY ─────────────── */}
            <div className="border border-white/10 bg-white/5 rounded-3xl p-6">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Monthly</h3>
              <div className="flex items-end gap-1 mt-1 mb-4">
                <span className="text-3xl font-black text-white">₹499</span>
                <span className="text-xs font-bold text-white/40 mb-1">/month</span>
              </div>
              <button
                onClick={() => handleCheckout('monthly')}
                disabled={loadingTier === 'monthly'}
                className="w-full py-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 font-black uppercase text-[10px] tracking-[0.2em] transition-colors disabled:opacity-50"
              >
                {loadingTier === 'monthly' ? 'Processing...' : 'Subscribe Monthly'}
              </button>
            </div>

          </div>

          {/* Footer note */}
          <p className="text-center text-[9px] text-white/20 font-medium mt-5 tracking-wide">
            Prices in INR • Cancel anytime • Secure payments via Razorpay
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
