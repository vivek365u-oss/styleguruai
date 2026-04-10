// ============================================================
// StyleGuru — Product Card
// Individual product with Add to Cart button
// ============================================================
import { useState, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';

function ProductCard({ product }) {
  const { theme } = useContext(ThemeContext);
  const { addToCart } = useCart();
  const [imgError, setImgError] = useState(false);
  const isDark = theme === 'dark';

  if (!product) return null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product);
  };

  return (
    <div className={`rounded-2xl overflow-hidden border transition-all hover:shadow-lg flex flex-col ${
      isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-gray-50'
    }`}>
      {/* Product Image */}
      <div className="relative w-full aspect-[4/5] bg-gradient-to-br from-gray-900/40 to-gray-800/40 flex items-center justify-center overflow-hidden group-hover:after:absolute group-hover:after:inset-0 group-hover:after:bg-purple-500/10 transition-all">
        {!imgError && product.image_url && !product.image_url.includes('placeholder.com') && !product.image_url.includes('water-droplets') ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            loading="lazy"
            onError={() => {
              console.warn(`[ProductCard] Image failed: ${product.image_url}`);
              setImgError(true);
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-[#1a1c2e] to-[#0a0b14] relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent" />
            <svg className="w-16 h-16 text-white/10 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.62 1.96V10a12 12 0 0010 11.83 12 12 0 0010-11.83V5.42a2 2 0 00-1.62-1.96z" />
              <path d="M12 22V12" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">StyleGuru Original</span>
          </div>
        )}
        
        {/* Rating Badge */}
        {product.rating && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full flex items-center gap-1 text-[10px] font-black shadow-md backdrop-blur-sm">
            <span>⭐</span>{product.rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-3 flex flex-col flex-1 gap-2">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-wider opacity-60 ${isDark ? 'text-white' : 'text-gray-500'}`}>
            {product.brand}
          </p>
          <h3 className={`font-bold text-xs leading-snug line-clamp-2 mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {product.name}
          </h3>
        </div>

        {/* Category & Color */}
        <div className="flex gap-1.5 flex-wrap">
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
            isDark ? 'bg-purple-500/30 text-purple-200' : 'bg-purple-100 text-purple-700'
          }`}>
            {product.category}
          </span>
          {product.best_for_tone && product.best_for_tone.length > 0 && (
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              isDark ? 'bg-green-500/30 text-green-200' : 'bg-green-100 text-green-700'
            }`}>
              {product.best_for_tone[0]}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mt-auto pt-2 flex items-baseline gap-1">
          <span className="text-lg font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            ₹{product.price}
          </span>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className={`w-full mt-2 py-2 rounded-lg font-bold text-xs transition-all transform hover:scale-105 active:scale-95 shadow-sm ${
            isDark
              ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/50'
              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200'
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
            className={`block w-full mt-2 py-1.5 rounded-lg text-center text-[10px] font-semibold transition-all ${
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

