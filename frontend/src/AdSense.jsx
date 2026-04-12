import { useEffect, useRef, useState } from "react";

const AdSense = () => {
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    // Only show if AdSense script is present
    if (typeof window !== 'undefined' && window.adsbygoogle) {
      setAdLoaded(true);
    }
    // Check again after a short delay (script might load async)
    const timer = setTimeout(() => {
      if (window.adsbygoogle) setAdLoaded(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!adLoaded || !adRef.current) return;
    if (adRef.current.getAttribute('data-ad-status') === 'filled') return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      adRef.current.setAttribute('data-ad-status', 'filled');
    } catch (err) {
      if (!err.message?.includes('adsbygoogle.push() error')) {
        console.warn("AdSense push ignored:", err.message);
      }
    }
  }, [adLoaded]);

  // Don't render anything if AdSense isn't available (dev / ad-blocker)
  if (!adLoaded) return null;

  return (
    <div 
      className="adsense-wrap" 
      style={{ 
        minHeight: '280px', 
        width: '100%', 
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.05)',
        borderRadius: '1rem'
      }}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ 
          display: "block", 
          textAlign: 'center',
          width: '100%',
          minWidth: '250px', 
          minHeight: '250px' 
        }}
        data-ad-client="ca-pub-7408587005129335"
        data-ad-slot="3569732070"
        data-ad-format="fluid"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdSense;
