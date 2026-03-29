import { useState, useContext } from 'react';
import { auth, createPaymentOrder, verifyPayment } from '../api/styleApi';
import { usePlan } from '../context/PlanContext';
import { ThemeContext } from '../App';

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.head.appendChild(script);
});

const features = [
  { label: 'Photo analyses', free: '6/month', pro: 'Unlimited' },
  { label: 'Outfit checker', free: '10/month', pro: 'Unlimited' },
  { label: 'Accessories tab', free: '🔒 Locked', pro: '✅ Full access' },
  { label: 'Makeup suggestions', free: '🔒 Locked', pro: '✅ Full access' },
  { label: 'Outfit combos', free: '2 visible', pro: 'All 5' },
  { label: 'Wardrobe items', free: '10 items', pro: '50 items' },
  { label: 'History', free: 'Last 5', pro: 'Last 20' },
  { label: 'Ads', free: '✅ Shown', pro: '❌ No ads' },
];

function PaywallModal({ isOpen, onClose, triggerMessage }) {
  const { theme } = useContext(ThemeContext);
  const { refreshPlan } = usePlan();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setError(null);
    setLoading(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { setError('Payment service unavailable. Please check your internet connection.'); setLoading(false); return; }

      const orderRes = await createPaymentOrder();
      const { order_id, amount, currency } = orderRes.data;

      const user = auth.currentUser;
      const options = {
        key: RAZORPAY_KEY_ID,
        amount,
        currency,
        order_id,
        name: 'StyleGuru AI',
        description: 'Pro Plan — ₹31/month',
        image: '/favicon.svg',
        prefill: {
          name: user?.displayName || '',
          email: user?.email || '',
        },
        theme: { color: '#a855f7' },
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await refreshPlan();
            onClose();
          } catch {
            setError('Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Could not initiate payment.';
      if (err?.response?.status === 503) {
        setError('Payment is being configured. Please try again in a few minutes.');
      } else if (err?.response?.status === 500) {
        setError('Server error. Please try again or contact support@styleguruai.in');
      } else {
        setError(msg);
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={`relative w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 shadow-2xl ${isDark ? 'bg-slate-900 border border-white/10' : 'bg-white border border-gray-200'}`}>
        {/* Header */}
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">⚡</div>
          <h2 className={`font-black text-xl mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Upgrade to Pro</h2>
          {triggerMessage && (
            <p className={`text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-600'}`}>{triggerMessage}</p>
          )}
        </div>

        {/* Feature comparison */}
        <div className={`rounded-2xl overflow-hidden border mb-5 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <div className={`grid grid-cols-3 text-xs font-bold px-3 py-2 ${isDark ? 'bg-white/5 text-white/50' : 'bg-gray-50 text-gray-500'}`}>
            <span>Feature</span>
            <span className="text-center">Free</span>
            <span className="text-center text-purple-500">Pro ✨</span>
          </div>
          {features.map((f, i) => (
            <div key={f.label} className={`grid grid-cols-3 text-xs px-3 py-2 ${i % 2 === 0 ? (isDark ? 'bg-white/3' : 'bg-white') : (isDark ? 'bg-white/5' : 'bg-gray-50')}`}>
              <span className={isDark ? 'text-white/70' : 'text-gray-700'}>{f.label}</span>
              <span className={`text-center ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{f.free}</span>
              <span className="text-center text-purple-500 font-semibold">{f.pro}</span>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-xs text-center mb-3">{error}</p>
        )}

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black rounded-2xl text-base shadow-lg transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed mb-3"
        >
          {loading ? 'Processing...' : 'Upgrade to Pro — ₹31/month'}
        </button>

        <button onClick={onClose} className={`w-full py-2 text-sm font-medium ${isDark ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-700'} transition`}>
          Maybe later
        </button>
      </div>
    </div>
  );
}

export default PaywallModal;
