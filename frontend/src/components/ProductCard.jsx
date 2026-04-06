// ============================================================
// StyleGuru — Product Card
// Individual product with real shopping link
// ============================================================
import { useContext } from 'react';
import { ThemeContext } from '../App';

function ProductCard({ product }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  if (!product) return null;

  // Generate a realistic fallback search link based on product details
  const searchQuery = encodeURIComponent(`${product.color || ''} ${product.category || 'clothes'} ${product.gender || ''}`);
  let realShoppingLink = product.product_url;
  
  if (!realShoppingLink || realShoppingLink.includes('example.com')) {
    // Generate an Amazon India search link if the seeded link is fake
    realShoppingLink = `https://www.amazon.in/s?k=${searchQuery}`;
  }

  const openShop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(realShoppingLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      onClick={openShop}
      className={`rounded-2xl flex flex-col overflow-hidden border transition-all cursor-pointer hover:shadow-lg transform hover:-translate-y-1 ${
        isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
    >
      {/* Product Image */}
      <div className="relative w-full aspect-[4/5] bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
            loading="lazy"
            onError={(e) => { 
              // Better fallback for broken image
              e.target.style.display = 'none'; 
              const parent = e.target.parentElement;
              parent.classList.add('from-purple-300', 'to-indigo-300');
              parent.innerHTML = `<div class="flex flex-col items-center justify-center"><span class="text-5xl drop-shadow-md mb-2">🛍️</span><span class="text-xs font-bold text-purple-900 bg-white/50 px-2 py-1 rounded">Image Setup required</span></div>`;
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center">
            <span className="text-5xl drop-shadow-md mb-2">🛍️</span>
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

        <div className="mt-auto pt-2 flex items-center justify-between">
          {/* Price */}
          <span className="text-sm font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            ₹{product.price}
          </span>
          
          {/* Buy Button */}
          <button
            onClick={openShop}
            className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all shadow-sm ${
              isDark
                ? 'bg-white text-purple-900 hover:bg-purple-50'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-md'
            }`}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;

