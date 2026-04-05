// ============================================================
// StyleGuru — Order Success Page
// Show order confirmation and product shopping links
// ============================================================
import { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../App';
import { useLanguage } from '../i18n/LanguageContext';

function OrderSuccessPage() {
  const { theme } = useContext(ThemeContext);
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    // Parse order data from localStorage (set during checkout)
    const savedOrder = localStorage.getItem('sg_last_order');
    if (savedOrder) {
      try {
        setOrderData(JSON.parse(savedOrder));
      } catch (e) {
        console.error('Error parsing order:', e);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, []);

  if (!orderData) {
    return <div className="text-center p-8">Loading...</div>;
  }

  const { order_id, payment_id, items, total, commission } = orderData;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-4`}>
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className={`rounded-3xl p-8 text-center mb-6 ${isDark ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30' : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'}`}>
          <div className="text-6xl mb-4">🎉</div>
          <h1 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Payment Successful! ✅
          </h1>
          <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            Your order has been confirmed. Now go shopping!
          </p>
        </div>

        {/* Order Details Card */}
        <div className={`rounded-2xl p-6 mb-6 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Order ID</span>
              <span className={`font-mono text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {order_id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Payment ID</span>
              <span className={`font-mono text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {payment_id.slice(0, 12)}...
              </span>
            </div>
            <div className={`border-t ${isDark ? 'border-white/10' : 'border-gray-200'} pt-3 flex justify-between`}>
              <span className={`font-bold ${isDark ? 'text-white/80' : 'text-gray-700'}`}>Total Paid</span>
              <span className="text-lg font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ₹{total.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Your Commission (4%)</span>
              <span className="text-sm font-bold text-green-500">+ ₹{commission?.toFixed(0) || (total * 0.04).toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Products to Buy */}
        <div>
          <h2 className={`text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            🛍️ Your Items to Purchase
          </h2>
          
          <div className="space-y-3">
            {items && items.map((item, idx) => (
              <div key={idx} className={`rounded-xl p-4 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div className="flex-1">
                    <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.name}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                      {item.brand} • Qty: {item.quantity}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                      ₹{item.price} each
                    </p>
                  </div>
                  <div className={`text-right font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    ₹{(item.price * item.quantity).toFixed(0)}
                  </div>
                </div>

                {/* Shopping Links */}
                <div className="flex gap-2 flex-wrap">
                  <a
                    href={`https://www.myntra.com/search?q=${encodeURIComponent(item.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    View on Myntra
                  </a>
                  <a
                    href={`https://www.flipkart.com/search?q=${encodeURIComponent(item.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 transition"
                  >
                    View on Flipkart
                  </a>
                  <a
                    href={`https://www.amazon.in/s?k=${encodeURIComponent(item.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 transition"
                  >
                    View on Amazon
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className={`mt-6 p-4 rounded-xl text-center text-sm ${isDark ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300' : 'bg-blue-50 border border-blue-200 text-blue-700'}`}>
          💡 Click the shopping links above to find and purchase these items from your favorite store!
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => navigate('/')}
            className={`flex-1 py-3 rounded-xl font-bold transition ${isDark ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
          >
            ← Back to App
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg transition"
          >
            🖨️ Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccessPage;
