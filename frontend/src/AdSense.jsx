import { useEffect } from "react";

const AdSense = () => {
  useEffect(() => {
    try {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch (err) {
      console.log("AdSense error:", err);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-7408587005129335"
      data-ad-slot="YOUR_AD_SLOT_ID"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  );
};

export default AdSense;