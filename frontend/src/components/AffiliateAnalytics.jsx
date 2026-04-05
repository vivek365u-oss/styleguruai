// ============================================================
// Affiliate Analytics Dashboard Component (Phase 2)
// Shows sales metrics, earnings, and click analytics
// ============================================================
import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../App';
import axios from 'axios';

function AffiliateAnalytics() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [topProducts, setTopProducts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState(7);

  const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    timeout: 10000
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Please log in to view analytics');
        setLoading(false);
        return;
      }

      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const [summaryRes, timelineRes, topRes] = await Promise.all([
        API.get('/api/affiliate/analytics/summary'),
        API.get(`/api/affiliate/analytics/timeline?days=${timeframe}`),
        API.get('/api/affiliate/top-products?limit=10')
      ]);

      setStats(summaryRes.data);
      setTimeline(timelineRes.data);
      setTopProducts(topRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.detail || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-8 rounded-xl text-center ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
        <div className="inline-block">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-pink-600 rounded-full animate-spin" />
        </div>
        <p className={`text-sm font-bold mt-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Loading analytics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-red-50 border border-red-200 text-red-600'}`}>
        <p className="font-bold text-sm">⚠️ {error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
            💰 Affiliate Analytics
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
            Track your shopping links & earnings
          </p>
        </div>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(parseInt(e.target.value))}
          className={`px-3 py-2 rounded-lg font-semibold text-sm ${
            isDark
              ? 'bg-white/10 border border-white/20 text-white'
              : 'bg-gray-200 border border-gray-300 text-gray-900'
          }`}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clicks */}
        <div className={`p-4 rounded-lg border ${isDark ? 'bg-white/5 border-white/10' : 'bg-blue-50 border-blue-200'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-white/60' : 'text-blue-700'}`}>
            🔗 Total Clicks
          </p>
          <p className={`text-3xl font-black mt-2 ${isDark ? 'text-white' : 'text-blue-900'}`}>
            {stats.total_clicks}
          </p>
        </div>

        {/* Estimated Conversions */}
        <div className={`p-4 rounded-lg border ${isDark ? 'bg-white/5 border-white/10' : 'bg-green-50 border-green-200'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-white/60' : 'text-green-700'}`}>
            ✅ Est. Conversions
          </p>
          <p className={`text-3xl font-black mt-2 ${isDark ? 'text-white' : 'text-green-900'}`}>
            {stats.estimated_conversions}
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-green-600'}`}>
            @5% conversion rate
          </p>
        </div>

        {/* Estimated Commission */}
        <div className={`p-4 rounded-lg border col-span-1 sm:col-span-2 lg:col-span-1 ${isDark ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50 border-purple-200'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
            💳 Est. Commission
          </p>
          <p className={`text-3xl font-black mt-2 ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>
            ₹{stats.estimated_commission}
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-purple-600'}`}>
            @₹50 per conversion
          </p>
        </div>

        {/* Top Platform */}
        <div className={`p-4 rounded-lg border ${isDark ? 'bg-white/5 border-white/10' : 'bg-orange-50 border-orange-200'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-white/60' : 'text-orange-700'}`}>
            🏆 Top Platform
          </p>
          <p className={`text-2xl font-black mt-2 capitalize ${isDark ? 'text-white' : 'text-orange-900'}`}>
            {stats.top_platform || 'N/A'}
          </p>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className={`p-4 rounded-lg border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          📊 Clicks by Platform
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['amazon', 'flipkart', 'myntra', 'meesho'].map((platform) => {
            const count = stats.platform_breakdown?.[platform] || 0;
            return (
              <div
                key={platform}
                className={`p-3 rounded-lg text-center border ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white/70'
                    : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                <p className="font-bold text-lg">{count}</p>
                <p className="text-xs capitalize font-semibold mt-1">{platform}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className={`p-4 rounded-lg border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          👗 Clicks by Category
        </h3>
        <div className="space-y-2">
          {Object.entries(stats.category_breakdown || {})
            . sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className={`capitalize text-sm font-semibold ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                  {category}
                </span>
                <div className="flex items-center gap-2">
                  <div className={`h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500`}
                    style={{ width: `${(count / Math.max(...Object.values(stats.category_breakdown || {}))) * 100}px` }}
                  />
                  <span className={`text-sm font-bold min-w-[30px] text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {count}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Top Products */}
      {topProducts && topProducts.top_products && topProducts.top_products.length > 0 && (
        <div className={`p-4 rounded-lg border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ⭐ Most Clicked Products
          </h3>
          <div className="space-y-2">
            {topProducts.top_products.map((item, idx) => (
              <div key={idx} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                <span className={`text-sm font-semibold ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                  {item.product}
                </span>
                <span className={`text-sm font-bold px-2 py-1 rounded-full ${isDark ? 'bg-purple-500/30 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                  {item.clicks} clicks
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className={`p-4 rounded-lg border-l-4 ${isDark ? 'bg-blue-500/10 border-l-blue-400 text-blue-300' : 'bg-blue-50 border-l-blue-400 text-blue-700'}`}>
        <p className="text-sm font-semibold">💡 Tips to Increase Earnings:</p>
        <ul className="text-xs mt-2 space-y-1 list-disc list-inside">
          <li>Share your color recommendations with friends</li>
          <li>Recommend specific colors & categories to users</li>
          <li>Post on social media with your StyleGuru link</li>
          <li>Track which colors convert best & focus on those</li>
        </ul>
      </div>
    </div>
  );
}

export default AffiliateAnalytics;
