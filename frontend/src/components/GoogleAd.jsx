import React, { useEffect, useRef } from 'react';

/**
 * Google AdSense Ad Unit Component
 * 
 * Complies with AdSense policies:
 * - Proper initialization in Single Page Application (SPA) lifecycle
 * - Only single push per ins element to prevent AdSense TagErrors
 * - "Advertisement" label compliant with Google Publisher Policies
 * - CLS-safe min-height placeholder
 */
export default function GoogleAd({
  client = import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-7408587005129335',
  slot,
  format = 'auto',
  responsive = 'true',
  layout = '',
  layoutKey = '',
  style = {},
  className = '',
  showLabel = true,
}) {
  const adRef = useRef(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate push in React StrictMode or multiple re-renders
    if (pushedRef.current) return;

    try {
      if (typeof window !== 'undefined' && adRef.current) {
        // Only push if AdSense hasn't already processed this DOM node
        const isProcessed = adRef.current.getAttribute('data-adsbygoogle-status');
        if (!isProcessed) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushedRef.current = true;
        }
      }
    } catch (err) {
      // Catch AdBlocker or script load race conditions quietly
      if (import.meta.env.DEV) {
        console.warn('[AdSense] Ad push notice:', err?.message || err);
      }
    }
  }, [slot]);

  return (
    <aside
      aria-label="Advertisement"
      className={`google-ad-container my-8 mx-auto text-center w-full max-w-4xl overflow-hidden ${className}`}
    >
      {showLabel && (
        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5 block select-none">
          Advertisement
        </span>
      )}
      <div className="flex justify-center items-center w-full min-h-[90px] bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden">
        <ins
          ref={adRef}
          className="adsbygoogle block w-full"
          style={{ display: 'block', minHeight: '90px', ...style }}
          data-ad-client={client}
          {...(slot ? { 'data-ad-slot': slot } : {})}
          data-ad-format={format}
          data-full-width-responsive={responsive}
          {...(layout ? { 'data-ad-layout': layout } : {})}
          {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
        />
      </div>
    </aside>
  );
}
