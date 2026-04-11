import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlan } from '../context/PlanContext';
import { createRazorpayOrder, verifyRazorpayPayment, auth } from '../api/styleApi';
import { FashionIcons, IconRenderer } from './Icons';

export default function SubscriptionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingTier, setLoadingTier] = useState(null);
  const [onSuccessCallback, setOnSuccessCallback] = useState(null);
  const { isPro, refreshPlan } = usePlan();

  useEffect(() => {
    const handleOpen = (e) => {
      setIsOpen(true);
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

  const handleCheckout = async (tier) => {
    if (!window.Razorpay) {
      alert("Payment gateway failed to load. Please check your internet connection.");
      return;
    }

    setLoadingTier(tier);
    try {
      // 1. Ask backend to create the Order
      const res = await createRazorpayOrder(tier);
      if (!res.success) throw new Error("Order creation failed");

      // 2. Open Razorpay Checklout
      const options = {
        key: res.key, // Use test key sent from backend
        amount: res.order.amount,
        currency: res.order.currency,
        name: "ToneFit AI",
        description: `Upgrade to ToneFit ${tier.toUpperCase()}`,
        image: "https://styleguruai.in/favicon.svg",
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
            alert("Payment Successful! Welcome to ToneFit PRO.");
            setIsOpen(false);
            await refreshPlan(); // Refresh limits state globally
            if (onSuccessCallback) {
              setTimeout(() => {
                onSuccessCallback();
              }, 500);
            }
          } catch (verifyError) {
            alert("Payment Verification Failed. Please contact support.");
          }
        },
        prefill: {
          name: auth?.currentUser?.displayName || "ToneFit User",
          email: auth?.currentUser?.email || "user@tonefit.com"
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
        
        <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }} 
            className="bg-[#0A0F1C] border border-white/10 w-full max-w-lg rounded-[2.5rem] p-6 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 w-10 h-10 bg-white/5 rounded-full flex flex-col items-center justify-center text-white/50 hover:text-white transition-colors">
            ✕
          </button>
          
          <div className="text-center mb-8 mt-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl">
                ✨
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">ToneFit Pro</h2>
              <p className="text-sm font-bold text-white/40 uppercase tracking-widest mt-2">{isPro ? 'You are currently a Pro user' : 'Unlock Your Full Style Potential'}</p>
          </div>

          <div className="space-y-4">
            
            {/* TIER 1: YEARLY (Highlight) */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative border border-purple-500/50 bg-[#131024] rounded-3xl p-6 transition-transform group-active:scale-[0.98]">
                <div className="absolute top-0 right-6 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest shadow-lg">Save 60%</div>
                
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

            {/* TIER 2: MONTHLY */}
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

            {/* TIER 3: COINS (PAYG) */}
            <div className="border border-white/5 bg-transparent rounded-3xl p-4 text-center">
              <h4 className="text-xs font-black text-white/50 uppercase tracking-widest mb-2">Need a Quick Scan?</h4>
              <button 
                onClick={() => handleCheckout('coins')}
                disabled={loadingTier === 'coins'}
                className="py-2 px-6 rounded-xl border border-white/10 text-white/70 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                {loadingTier === 'coins' ? 'Processing...' : 'Buy 50 Coins for ₹199'}
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
