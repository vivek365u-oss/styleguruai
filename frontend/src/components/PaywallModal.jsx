import React, { useState, useEffect } from 'react';
import { logEvent, EVENTS } from '../utils/analytics';
import { useLanguage } from '../i18n/LanguageContext';
import { auth } from '../api/styleApi';

function PaywallModal({ isOpen, onClose, onUpgrade, isDark }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly'); // 'monthly' or 'yearly'

  if (!isOpen) return null;

  useEffect(() => {
    if (isOpen) {
      logEvent(EVENTS.PAYWALL_VIEW);
    }
  }, [isOpen]);

  const handlePayment = async (plan) => {
    logEvent(EVENTS.UPGRADE_CLICK, { plan });
    setLoading(true);
    
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Initialize Razorpay
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const amount = plan === 'monthly' ? 5900 : 49900; // in paise
        const planName = plan === 'monthly' ? '₹59/month' : '₹499/year';
        
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_live_12345',
          amount: amount,
          currency: 'INR',
          description: `StyleGuru AI Premium - ${planName}`,
          prefill: {
            email: user.email || '',
            name: user.displayName || 'User',
          },
          handler: async (response) => {
            try {
              const res = await fetch('/api/subscriptions/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  uid: user.uid,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  plan: plan,
                })
              });
              if (res.ok) {
                setLoading(false);
                onUpgrade();
              } else {
                alert('Payment verified but subscription activation failed. Contact support.');
                setLoading(false);
              }
            } catch (err) {
              console.error('Subscription activation error:', err);
              setLoading(false);
            }
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
            }
          }
        };
        
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };
    } catch (err) {
      console.error('Payment initialization error:', err);
      setLoading(false);
    }
  };

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
        <div className="relative h-40 bg-gradient-to-br from-purple-600 to-pink-600 flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/20 rounded-full blur-3xl animate-pulse" />
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/40 transition"
          >
            ✕
          </button>
          
          <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-2 z-10 rotate-3">
            <span className="text-2xl font-black bg-gradient-to-br from-purple-600 to-pink-600 text-transparent bg-clip-text">PRO</span>
          </div>
          <h2 className="text-white text-xl font-black tracking-widest z-10 drop-shadow-md">{t('proTitle')}</h2>
        </div>

        {/* Content */}
        <div className="p-6 relative z-10 bg-inherit">
          <div className="text-center mb-6">
            <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Unlock Unlimited Analyses</p>
            
            {/* Plan Selector Tabs */}
            <div className="flex gap-2 justify-center mt-4 mb-4">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                  selectedPlan === 'monthly'
                    ? 'bg-purple-600 text-white'
                    : isDark ? 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80' : 'bg-gray-100 border border-gray-200 text-gray-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedPlan('yearly')}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all relative ${
                  selectedPlan === 'yearly'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : isDark ? 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80' : 'bg-gray-100 border border-gray-200 text-gray-600'
                }`}
              >
                Yearly
                <span className={`absolute -top-2 right-0 text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                  selectedPlan === 'yearly' ? 'bg-yellow-400 text-yellow-900' : 'bg-yellow-100 text-yellow-800'
                }`}>Save 16%</span>
              </button>
            </div>
            
            {/* Price Display */}
            <div className="mt-3 flex items-end justify-center gap-1 leading-none">
              <span className={`text-5xl tracking-tighter font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {selectedPlan === 'monthly' ? '₹59' : '₹499'}
              </span>
              <span className={`text-sm mb-1 font-bold ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                {selectedPlan === 'monthly' ? '/month' : '/year'}
              </span>
            </div>
            {selectedPlan === 'yearly' && (
              <p className={`text-xs mt-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>₹41/month billed annually</p>
            )}
          </div>

          {/* Features */}
          <div className="space-y-4 mb-8">
            <FeatureItem icon="♾️" title="Unlimited Analyses" desc="Analyze colors as many times as you need" isDark={isDark} />
            <FeatureItem icon="🛍️" title="Full Shopping" desc="50+ product suggestions per color" isDark={isDark} />
            <FeatureItem icon="📥" title="Download Outfits" desc="Save outfits as PNG images" isDark={isDark} />
            <FeatureItem icon="🚫" title="No Ads" desc="Clean, distraction-free experience" isDark={isDark} />
          </div>

          {/* Checkout Button */}
          <button 
            onClick={() => handlePayment(selectedPlan)}
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
              loading 
                ? 'bg-gray-500 text-white cursor-wait'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-500/30'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing Payment...
              </span>
            ) : (
              `Upgrade Now with Razorpay`
            )}
          </button>
          
          <p className={`text-[9px] text-center mt-4 font-medium leading-relaxed ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
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
