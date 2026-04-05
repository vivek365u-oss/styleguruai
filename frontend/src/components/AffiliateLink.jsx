// ============================================================
// Affiliate Link Wrapper Component (Phase 2)
// Tracks clicks on shopping links for analytics
// ============================================================
import { useState } from 'react';

function AffiliateLink({ 
  href, 
  children, 
  color, 
  category, 
  brand, 
  platform, 
  productId, 
  price,
  isDark = false,
  className = ""
}) {
  const [loading, setLoading] = useState(false);

  const trackClick = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('[Affiliate] No auth token, proceeding without tracking');
        window.open(href, '_blank');
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${apiUrl}/api/affiliate/track-click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          color: color || 'unknown',
          category: category || 'unknown',
          brand: brand || 'unknown',
          platform: platform || 'unknown',
          product_id: productId,
          price: price
        })
      });

      if (response.ok) {
        console.log(`[Affiliate] ✅ Click tracked: ${platform} - ${color} ${category}`);
      } else {
        console.warn('[Affiliate] ⚠️ Failed to track click:', response.statusText);
      }
    } catch (err) {
      console.error('[Affiliate] Error tracking click:', err.message);
    } finally {
      setLoading(false);
      // Open link after tracking (or immediately if no token)
      window.open(href, '_blank');
    }
  };

  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        trackClick();
      }}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'wait' : 'pointer' }}
    >
      {children}
    </a>
  );
}

export default AffiliateLink;
