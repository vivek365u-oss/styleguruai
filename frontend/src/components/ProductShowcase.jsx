// ============================================================
// StyleGuru — Product Showcase Component
// Fetch and display products from /api/products/by-color
// ============================================================
import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../App';
import ProductCard from './ProductCard';
import axios from 'axios';

const API = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000
});

function ProductShowcase({ colorName, category = "shirt", gender = "male", count = 10 }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const handleSeedProducts = async () => {
    try {
      setSeeding(true);
      console.log('[Products] Starting seed process...');
      
      const res = await API.post(`/api/products/seed`);
      
      if (res.data.success) {
        console.log('[Products] ✅ Seeding successful!', res.data);
        alert(`✅ ${res.data.message}\nTotal: ${res.data.total_products} products\n\nRefresh the page to see products!`);
        // Reload products
        window.location.reload();
      }
    } catch (err) {
      console.error('[Products] Seeding error:', err.message);
      alert(`❌ Seeding failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    if (!colorName) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log(`[Products] Fetching products for color: ${colorName}`);
        
        const res = await API.get(`/api/products/by-color/${colorName.toLowerCase()}`, {
          params: { limit: count }
        });

        if (res.data.success) {
          console.log(`[Products] ✅ Loaded ${res.data.products.length} products`);
          setProducts(res.data.products.slice(0, count));
          setError(null);
        } else {
          throw new Error(res.data.detail || 'Failed to fetch products');
        }
      } catch (err) {
        console.error('[Products] ❌ Error:', err.message);
        setError(err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [colorName, count]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className={`h-8 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-200'} animate-pulse`} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-40 rounded-xl ${isDark ? 'bg-white/10' : 'bg-gray-200'} animate-pulse`} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 rounded-xl text-center ${
        isDark ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-red-50 border border-red-200 text-red-600'
      }`}>
        <p className="font-bold text-sm">❌ Products not available</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={`p-8 rounded-xl text-center ${
        isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
      }`}>
        <p className={`text-sm font-bold ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
          📦 No products found for this color
        </p>
        <p className={`text-xs mt-2 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
          Products database is empty. Seed it to get started!
        </p>
        <button
          onClick={handleSeedProducts}
          disabled={seeding}
          className={`mt-4 px-4 py-2 rounded-lg font-bold text-sm transition ${
            seeding
              ? isDark ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : isDark ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
          }`}
        >
          {seeding ? '🌱 Seeding...' : '🌱 Seed Products'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`font-black text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
          🛍️ Perfect Picks for {colorName.charAt(0).toUpperCase() + colorName.slice(1)}
        </h3>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
          isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
        }`}>
          {products.length} available
        </span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default ProductShowcase;
