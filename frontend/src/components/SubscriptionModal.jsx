import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlan } from '../context/PlanContext';
import { createRazorpayOrder, verifyRazorpayPayment, auth, verifyAmazonOrder } from '../api/styleApi';
import { trackSubscriptionView, trackUpgradeClick, trackSubscriptionPurchase } from '../utils/analytics';

export default function SubscriptionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingTier, setLoadingTier] = useState(null);
  const [onSuccessCallback, setOnSuccessCallback] = useState(null);
  const [amazonOrderId, setAmazonOrderId] = useState('');
  const [verifyingAmazon, setVerifyingAmazon] = useState(false);
  const adWatchedRef = useRef(false);
  const { isPro, refreshPlan } = usePlan();

  useEffect(() => {
    const handleOpen = (e) => {
      adWatchedRef.current = false;
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

    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
    return () => window.removeEventListener('open_subscription_modal', handleOpen);
  }, []);

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
      const res = await createRazorpayOrder(tier);
      if (!res.success) throw new Error("Order creation failed");

      const options = {
        key: res.key,
        amount: res.order.amount,
        currency: res.order.currency,
        name: "StyleGuruAI",
        description: `Upgrade to StyleGuruAI ${tier.toUpperCase()}`,
        image: "https://StyleGuruAI.in/favicon.svg",
        order_id: res.order.id,
        handler: async function (response) {
          try {
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              tier: tier
            });
            alert("Payment Successful! Welcome to StyleGuruAI PRO.");
            adWatchedRef.current = true;
            setIsOpen(false);
            const prices = { yearly: 299, monthly: 99, couple: 149, event_pass: 49 };
            trackSubscriptionPurchase(tier, prices[tier] || 0);
            await refreshPlan();
            if (onSuccessCallback) {
              setTimeout(() => { onSuccessCallback(true); }, 500);
            }
          } catch (verifyError) {
            alert("Payment Verification Failed. Please contact support.");
          }
        },
        prefill: {
          name: auth?.currentUser?.displayName || "StyleGuruAI User",
          email: auth?.currentUser?.email || "user@StyleGuruAI.in"
        },
        theme: { color: "#8B5CF6" }
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

  const handleAmazonSubmit = async () => {
    if (!amazonOrderId || amazonOrderId.length < 10) {
      alert("Please enter a valid Amazon Order ID.");
      return;
    }
    setVerifyingAmazon(true);
    try {
      await verifyAmazonOrder(amazonOrderId);
      alert("Amazon order submitted! You have been granted 1-Month PRO while we verify.");
      adWatchedRef.current = true;
      setIsOpen(false);
      await refreshPlan();
      if (onSuccessCallback) onSuccessCallback(true);
    } catch (err) {
      alert("Failed to verify order. Please try again.");
    } finally {
      setVerifyingAmazon(false);
      setAmazonOrderId('');
    }
  };

  const handleWatchAd = () => {
    setLoadingTier('ad');
    window.open('https://omg10.com/4/10863757', '_blank');
    const adStartTime = Date.now();
    let hiddenOnce = false;

    const visibilityHandler = () => {
      if (document.visibilityState === 'hidden') hiddenOnce = true;
      else if (document.visibilityState === 'visible') {
        if (hiddenOnce && (Date.now() - adStartTime) > 5000) cleanupAndSuccess();
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
      if (onSuccessCallback) onSuccessCallback(true);
    };

    document.addEventListener('visibilitychange', visibilityHandler);
    failsafeTimeout = setTimeout(() => { cleanupAndSuccess(); }, 15000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={handleClose} className="absolute inset-0 bg-slate-950/95"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-[#0A0F1C] border border-white/10 w-full max-w-lg rounded-[2.5rem] p-6 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto hide-scrollbar"
        >
          <button onClick={handleClose} className="absolute top-6 right-6 w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">✕</button>

          <div className="text-center mb-6 mt-2">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl">✨</div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">StyleGuruAI Pro</h2>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Unlock Your Full Style Potential</p>
          </div>

          <div className="space-y-3">
            
            {/* TIER 1: YEARLY (Highlight) */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl opacity-30 group-hover:opacity-60 transition duration-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]" />
              <div className="relative border border-purple-500/50 bg-[#131024] rounded-3xl p-5">
                <div className="absolute top-0 right-6 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full shadow-lg">Best Value</div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Yearly Master</h3>
                <div className="flex items-end gap-1 mt-1 mb-3">
                  <span className="text-3xl font-black text-white">₹299</span>
                  <span className="text-xs font-bold text-white/40 mb-1">/year</span>
                </div>
                <button
                  onClick={() => handleCheckout('yearly')} disabled={loadingTier === 'yearly'}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-xl disabled:opacity-50"
                >
                  {loadingTier === 'yearly' ? 'Processing...' : 'Get Yearly Access'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* TIER 2: COUPLES PRO */}
              <div className="border border-white/10 bg-white/5 rounded-3xl p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-rose-400 uppercase tracking-tight">Couples PRO</h3>
                  <div className="flex items-end gap-1 mt-1 mb-3">
                    <span className="text-xl font-black text-white">₹149</span>
                    <span className="text-[10px] font-bold text-white/40 mb-1">/mo</span>
                  </div>
                  <p className="text-[9px] text-white/50 mb-3 leading-snug">Unlimited Couple Mode matching & shared profiles.</p>
                </div>
                <button
                  onClick={() => handleCheckout('couple')} disabled={loadingTier === 'couple'}
                  className="w-full py-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-black uppercase text-[9px] tracking-wider transition-colors disabled:opacity-50"
                >
                  {loadingTier === 'couple' ? '...' : 'Upgrade Couple'}
                </button>
              </div>

              {/* TIER 3: MONTHLY */}
              <div className="border border-white/10 bg-white/5 rounded-3xl p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-indigo-400 uppercase tracking-tight">Monthly</h3>
                  <div className="flex items-end gap-1 mt-1 mb-3">
                    <span className="text-xl font-black text-white">₹99</span>
                    <span className="text-[10px] font-bold text-white/40 mb-1">/mo</span>
                  </div>
                  <p className="text-[9px] text-white/50 mb-3 leading-snug">Unlimited styling, no ads, full DNA compass.</p>
                </div>
                <button
                  onClick={() => handleCheckout('monthly')} disabled={loadingTier === 'monthly'}
                  className="w-full py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 font-black uppercase text-[9px] tracking-wider transition-colors disabled:opacity-50"
                >
                  {loadingTier === 'monthly' ? '...' : 'Subscribe'}
                </button>
              </div>
            </div>

            {/* EVENT PASS */}
            <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-tight">🎟️ 24-Hour Event Pass</h3>
                <p className="text-[10px] font-medium text-white/60 mt-0.5">Perfect for a quick shopping trip or party styling.</p>
              </div>
              <button
                onClick={() => handleCheckout('event_pass')} disabled={loadingTier === 'event_pass'}
                className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase text-[10px] tracking-wider flex-shrink-0 shadow-lg shadow-amber-500/20"
              >
                ₹49 Only
              </button>
            </div>

            {/* AMAZON UNLOCK */}
            <div className="border border-white/10 bg-gradient-to-br from-blue-950/40 to-cyan-950/40 rounded-3xl p-5 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🛍️</span>
                <h4 className="text-xs font-black text-white/90 tracking-tight">Shop & Unlock (100% FREE PRO)</h4>
              </div>
              <p className="text-[10px] text-blue-200/70 font-medium mb-3 leading-relaxed">
                Buy any item worth <b>₹1,500 or more</b> from our Amazon links. Paste your Amazon Order ID below to instantly unlock 1-Month PRO!
              </p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Amazon Order ID (e.g. 404-1234567-8901234)" 
                  value={amazonOrderId}
                  onChange={(e) => setAmazonOrderId(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-blue-500/50"
                />
                <button 
                  onClick={handleAmazonSubmit}
                  disabled={verifyingAmazon || !amazonOrderId}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
                >
                  {verifyingAmazon ? '...' : 'Verify'}
                </button>
              </div>
            </div>

            {/* FREE FALLBACK (Watch Ad) */}
            <button
              onClick={handleWatchAd}
              disabled={loadingTier !== null}
              className="w-full mt-2 py-3 px-2 rounded-xl border border-white/5 bg-transparent text-white/40 hover:text-white/80 hover:bg-white/5 text-[9px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              📺 Watch a Video Ad to Unlock 1 Scan Free
            </button>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
