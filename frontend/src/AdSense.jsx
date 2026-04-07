import { useEffect } from "react";

const AdSense = () => {
  useEffect(() => {
    // Only push if script is loaded and we haven't already pushed for this element
    const pushAd = () => {
      try {
        const adElement = document.querySelector('.adsbygoogle:not([data-adsbygoogle-status="done"])');
        if (window.adsbygoogle && adElement) {
          window.adsbygoogle.push({});
          adElement.setAttribute('data-adsbygoogle-status', 'done');
        }
      } catch (err) {
        console.warn("AdSense push ignored:", err.message);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(pushAd, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="adsense-container" style={{ minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", minWidth: '250px', minHeight: '280px' }}
        data-ad-client="ca-pub-7408587005129335"
        data-ad-slot="3569732070"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdSense;