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
      
      // IMPORTANT: Open link IMMEDIATELY to avoid browser popup blocking
      // This ensures the link opens even if tracking is slow
      const opened = window.open(href, '_blank');
      if (!opened) {
        console.warn('[Affiliate] ⚠️ Popup may be blocked by browser');
      }
      
      // Track click in background (non-blocking)
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('[Affiliate] No auth token, link opened without tracking');
        setLoading(false);
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      try {
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
      }
    } catch (err) {
      console.error('[Affiliate] Error opening link:', err.message);
      // Fallback: try to open link if initial open failed
      try {
        window.open(href, '_blank');
      } catch (e) {
        console.error('[Affiliate] Fallback open also failed');
      }
    } finally {
      setLoading(false);
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
