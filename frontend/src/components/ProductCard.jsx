// ============================================================
// StyleGuru — Product Card
// Individual product with Add to Cart button
// ============================================================
import { useContext } from 'react';
import { ThemeContext } from '../App';
import { useCart } from '../context/CartContext';

function ProductCard({ product }) {
  const { theme } = useContext(ThemeContext);
  const { addToCart } = useCart();
  const isDark = theme === 'dark';

  if (!product) return null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product);
  };

  return (
    <div className={`rounded-2xl overflow-hidden border transition-all hover:shadow-lg ${
      isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-gray-50'
    }`}>
      {/* Product Image */}
      <div className="relative w-full h-32 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <span className="text-3xl">👕</span>
        )}
        
        {/* Rating Badge */}
        {product.rating && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full flex items-center gap-1 text-xs font-bold">
            <span>⭐</span>{product.rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-3 space-y-2">
        <div>
          <p className={`text-xs font-semibold opacity-60 ${isDark ? 'text-white' : 'text-gray-600'}`}>
            {product.brand}
          </p>
          <h3 className={`font-bold text-sm line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {product.name}
          </h3>
        </div>

        {/* Category & Color */}
        <div className="flex gap-1.5 flex-wrap">
          <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
            isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
          }`}>
            {product.category}
          </span>
          {product.best_for_tone && product.best_for_tone.length > 0 && (
            <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
              isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'
            }`}>
              {product.best_for_tone.slice(0, 2).join(', ')}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            ₹{product.price}
          </span>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className={`w-full py-2 rounded-lg font-bold text-xs transition-all transform hover:scale-105 active:scale-95 ${
            isDark
              ? 'bg-purple-600 hover:bg-purple-500 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          <span>🛒</span> Add to Cart
        </button>

        {/* Affiliate Link (Optional) */}
        {product.affiliate_link && (
          <a
            href={product.affiliate_link}
            target="_blank"
            rel="noopener noreferrer"
            className={`block w-full py-1.5 rounded-lg text-center text-[10px] font-semibold transition-all ${
              isDark
                ? 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            🔗 Shop Direct
          </a>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
