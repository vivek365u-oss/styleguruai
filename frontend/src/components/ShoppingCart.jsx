// ============================================================
// StyleGuru — Shopping Cart Component
// Display cart items and checkout
// ============================================================
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { usePlan } from '../context/PlanContext';

function ShoppingCart({ onClose, onProceedToCheckout, isOpen }) {
  const { theme } = useContext(ThemeContext);
  const { cart, removeFromCart, updateQuantity, totals } = useCart();
  const { isPro } = usePlan();
    const isDark = theme === 'dark';
  
  if (!onClose || !isOpen) return null; // Cart only shows in modal when isOpen is true

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (cart.length === 0) {
    return (
      <div onClick={handleBackdropClick} className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDark ? 'bg-black/50' : 'bg-white/50'} backdrop-blur-sm`}>
        <div className={`w-full max-w-md rounded-3xl p-8 text-center ${isDark ? 'bg-[#0f1123] border border-white/10' : 'bg-white border border-gray-200'}`}>
          <div className="text-5xl mb-3">🛒</div>
          <p className={`text-lg font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Your cart is empty</p>
          <p className={`text-sm mb-6 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
            Add products from your analysis results
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div onClick={handleBackdropClick} className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${isDark ? 'bg-black/50' : 'bg-white/50'} backdrop-blur-sm`}>
      <div className={`w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl ${isDark ? 'bg-[#0f1123] border border-white/10' : 'bg-white border border-gray-200'}`}>
        {/* Header */}
        <div className={`p-6 border-b ${isDark ? 'border-white/10 bg-gradient-to-r from-purple-600/20 to-pink-600/20' : 'border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>🛒 Your Cart</h2>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{totals.itemCount} item{totals.itemCount !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={onClose}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className={`overflow-y-auto max-h-96 p-6 space-y-4 ${isDark ? 'bg-[#0f1123]' : 'bg-white'}`}>
          {cart.map((item) => (
            <div key={item.id} className={`flex gap-4 p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              {/* Product Image */}
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover"
                  onError={(e) => { e.target.src = '👕'; }}
                />
              )}
              
              <div className="flex-1">
                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.name}</h3>
                <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-600'}`}>{item.brand}</p>
                {item.color && (
                  <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                    Color: <span className={isDark ? 'text-white/60' : 'text-gray-700'}>{item.color}</span>
                  </p>
                )}
                <p className={`text-xs font-semibold mt-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>₹{item.price}</p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className={`w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                >
                  −
                </button>
                <span className={`w-6 text-center font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className={`w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                >
                  +
                </button>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeFromCart(item.id)}
                className={`text-lg transition ${isDark ? 'text-white/40 hover:text-red-400' : 'text-gray-400 hover:text-red-600'}`}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        {/* Pricing Breakdown */}
        <div className={`p-6 border-t space-y-2 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex justify-between text-sm">
            <span className={isDark ? 'text-white/60' : 'text-gray-600'}>Subtotal</span>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>₹{totals.subtotal.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className={isDark ? 'text-white/60' : 'text-gray-600'}>Tax (18% GST)</span>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>₹{totals.tax.toFixed(0)}</span>
          </div>
          <div className={`border-t pt-2 flex justify-between ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <span className={`font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Total</span>
            <span className="text-lg font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ₹{totals.total.toFixed(0)}
            </span>
          </div>
          <div className={`text-xs p-3 rounded-xl mt-4 text-center border animate-pulse-slow ${isDark ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-purple-50' + ' border-purple-100 text-purple-700'}`}>
            ✨ <span className="font-bold">StyleGuru AI is now completely free!</span> Enjoy unlimited style analysis.
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`p-6 border-t flex gap-3 ${isDark ? 'border-white/10 bg-[#0f1123]' : 'border-gray-200 bg-white'}`}>
          <button
            onClick={onClose}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${isDark ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
          >
            Continue Shopping
          </button>
          <button
            onClick={() => {
              onProceedToCheckout?.(totals);
            }}
            disabled={cart.length === 0}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105 transition-transform active:scale-95 disabled:opacity-50"
          >
            <span>💳 Checkout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCart;
