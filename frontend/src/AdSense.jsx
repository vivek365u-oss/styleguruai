import { useEffect, useRef } from "react";

const AdSense = () => {
  const adRef = useRef(null);

  useEffect(() => {
    // Only proceed if the script is available and the element is ready
    if (!window.adsbygoogle || !adRef.current) return;

    // Check if ad was already initialized for this specific instance
    if (adRef.current.getAttribute('data-ad-status') === 'filled') return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      adRef.current.setAttribute('data-ad-status', 'filled');
    } catch (err) {
      // Catch common "All ads on this page are already filled" warnings
      if (err.message.includes('adsbygoogle.push() error')) {
        console.debug("AdSense: Ad already filled or slot inactive");
      } else {
        console.warn("AdSense push ignored:", err.message);
      }
    }
  }, []);

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