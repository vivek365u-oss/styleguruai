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
  const [autoSeeded, setAutoSeeded] = useState(false);

  const handleSeedProducts = async () => {
    try {
      setSeeding(true);
      console.log('[Products] Starting seed process with batch writes...');
      
      // Create a custom axios instance with longer timeout for seeding
      const seedAPI = axios.create({ 
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
        timeout: 180000  // 3 minute timeout - batch writes are fast now
      });
      
      const res = await seedAPI.post(`/api/products/seed`);
      
      if (res.data.success) {
        console.log('[Products] ✅ Seeding response:', res.data);
        setAutoSeeded(true);
        return true;
      } else {
        throw new Error(res.data.message || 'Seeding failed');
      }
    } catch (err) {
      console.error('[Products] Seeding error:', err.message);
      setSeeding(false);
      return false;
    }
  };

  useEffect(() => {
    if (!colorName) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log(`[Products] Fetching products for color: ${colorName}, gender: ${gender}`);
        
        const res = await API.get(`/api/products/by-color/${colorName.toLowerCase()}`, {
          params: { limit: count, gender: gender }
        });

        if (res.data.success && res.data.products.length > 0) {
          console.log(`[Products] ✅ Loaded ${res.data.products.length} products`);
          console.log(`[Products] Genders in response:`, res.data.products.map(p => ({ name: p.name, gender: p.gender, category: p.category })));
          setProducts(res.data.products.slice(0, count));
          setError(null);
          setSeeding(false);
        } else {
          // No products found - auto-seed silently
          if (!autoSeeded) {
            console.log('[Products] No products found, auto-seeding...');
            setSeeding(true);
            const seedSuccess = await handleSeedProducts();
            if (seedSuccess) {
              // Retry fetching with exponential backoff after seeding starts
              console.log('[Products] Seeding started, retrying with exponential backoff...');
              
              const retryFetch = async (attempt = 1) => {
                const delays = [5000, 10000, 15000, 20000];  // 5s, 10s, 15s, 20s
                const waitTime = delays[Math.min(attempt - 1, delays.length - 1)];
                const maxAttempts = 4;
                
                if (attempt > maxAttempts) {
                  console.error('[Products] Max retry attempts reached');
                  setSeeding(false);
                  setLoading(false);
                  return;
                }
                
                setTimeout(async () => {
                  try {
                    console.log(`[Products] Retry attempt ${attempt} (waiting ${waitTime / 1000}s) for ${colorName}, gender: ${gender}...`);
                    const retryRes = await API.get(`/api/products/by-color/${colorName.toLowerCase()}`, {
                      params: { limit: count, gender: gender }
                    });
                    
                    if (retryRes.data.success && retryRes.data.products.length > 0) {
                      console.log(`[Products] ✅ Retry ${attempt} successful! Loaded ${retryRes.data.products.length} products (mapped to: ${retryRes.data.mapped_to})`);
                      console.log(`[Products] Retry - Genders:`, retryRes.data.products.map(p => ({ name: p.name, gender: p.gender })));
                      setProducts(retryRes.data.products.slice(0, count));
                      setError(null);
                      setSeeding(false);
                      setLoading(false);
                    } else {
                      console.log(`[Products] Retry ${attempt}: No products yet, trying again...`);
                      retryFetch(attempt + 1);
                    }
                  } catch (e) {
                    console.error(`[Products] Retry ${attempt} error:`, e.message);
                    retryFetch(attempt + 1);
                  }
                }, waitTime);
              };
              
              retryFetch(1);
            }
          }
          throw new Error(res.data.detail || 'No products available');
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
  }, [colorName, count, autoSeeded]);

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

  if (products.length === 0 && !seeding) {
    return (
      <div className={`p-8 rounded-xl text-center ${
        isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
      }`}>
        <p className={`text-sm font-bold ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
          📦 No products for this color yet
        </p>
        <p className={`text-xs mt-2 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
          Try a different color or refresh the page
        </p>
      </div>
    );
  }

  if (seeding) {
    return (
      <div className={`p-8 rounded-xl text-center ${
        isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="inline-block">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-pink-600 rounded-full animate-spin" />
        </div>
        <p className={`text-sm font-bold mt-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          🌱 Setting up 3000+ products...
        </p>
        <p className={`text-xs mt-2 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
          First time: ~30-60 seconds | Using fast batch writes
        </p>
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
