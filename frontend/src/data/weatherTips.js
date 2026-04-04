export const getLocalizedWeatherTip = (weatherCategory, skinTone, language) => {
  const WEATHER_TIPS = {
    hot: {
      emoji: '☀️',
      label: { en: 'Hot & Sunny', hinglish: 'Hot & Sunny', hi: 'गरम और धूप' },
      fabrics: { en: 'Cotton, Linen, Khadi', hinglish: 'Cotton, Linen, Khadi', hi: 'सूती (Cotton), लिनन (Linen), खादी (Khadi)' },
      tips: {
        fair: { en: 'Light pastel cotton shirts reflect heat and look elegant on fair skin', hinglish: 'Light pastel cotton shirts heat reflect karti hain aur fair skin par elegant lagti hain.', hi: 'हल्के पेस्टल सूती शर्ट गर्मी को दर्शाते हैं और गोरी त्वचा पर सुरुचिपूर्ण लगते हैं।' },
        light: { en: 'Try a breathable linen kurta in coral or teal — cool and stylish', hinglish: 'Coral ya teal mein breathable linen kurta try karo — cool aur stylish.', hi: 'कोरल या टील रंग में हवादार लिनन का कुर्ता आज़माएँ - ठंडा और स्टाइलिश।' },
        medium: { en: 'White or sky blue cotton tee keeps you cool and makes your skin glow', hinglish: 'White ya sky blue cotton tee tumhe cool rakhti hai aur skin glow karti hai.', hi: 'सफ़ेद या स्काई ब्लू कॉटन टी-शर्ट आपको ठंडा रखती है और त्वचा को निखारती है।' },
        olive: { en: 'Cream or ivory linen shirt breathes well and contrasts your olive tones', hinglish: 'Cream ya ivory linen shirt acche se breathe karti hai aur olive tones par jachti hai.', hi: 'क्रीम या हाथीदांत लिनन शर्ट अच्छी तरह सांस लेती है और आपके जैतून टोन पर जचती है।' },
        brown: { en: 'Bright yellow or white cotton tee — bold, vibrant and heat-friendly', hinglish: 'Bright yellow ya white cotton tee — bold, vibrant aur heat-friendly hai.', hi: 'चमकीला पीला या सफ़ेद सूती टी-शर्ट - बोल्ड, जीवंत और गर्मी के अनुकूल।' },
        dark: { en: 'White linen shirt is the ultimate power move in this heat', hinglish: 'Is garmi mein white linen shirt ultimate power move hai.', hi: 'सफेद लिनन शर्ट इस गर्मी में बेहतरीन लुक देती है।' },
        default: { en: 'Light cotton shirts breathe best in this heat — avoid dark colors', hinglish: 'Light cotton shirts is garmi me best hain — dark colors se bacho.', hi: 'हल्के सूती शर्ट इस गर्मी में सबसे अच्छे हैं - गहरे रंगों से बचें।' }
      }
    },
    warm: {
      emoji: '🌤️',
      label: { en: 'Warm', hinglish: 'Warm', hi: 'हल्का गरम' },
      fabrics: { en: 'Cotton, Rayon, Chambray', hinglish: 'Cotton, Rayon, Chambray', hi: 'सूती (Cotton), रेयान (Rayon), शैम्ब्रे (Chambray)' },
      tips: {
        fair: { en: 'A chambray shirt in soft blue is perfect — looks effortless on fair skin', hinglish: 'Soft blue chambray shirt perfect hai — fair skin par effortless lagti hai.', hi: 'नीले रंग की शैम्ब्रे शर्ट एकदम परफेक्ट है - गोरी त्वचा पर बेहतरीन लगती है।' },
        light: { en: 'Cotton polo in olive or teal — stylish and breathable for warm weather', hinglish: 'Olive ya teal cotton polo — warm weather ke liye stylish aur breathable.', hi: 'ऑलिव या टील कॉटन पोलो - गर्म मौसम के लिए स्टाइलिश और हवादार।' },
        medium: { en: 'Royal blue cotton tee — your power color stays cool on warm days', hinglish: 'Royal blue cotton tee tumhara power color hai jo in dino bhi cool rehta hai.', hi: 'रॉयल ब्लू कॉटन टी - आपका पावर कलर जो गर्म दिनों में ठंडा रहता है।' },
        olive: { en: 'Rust or emerald rayon shirt — flattering and comfortable in warmth', hinglish: 'Rust ya emerald rayon shirt — is mausam mein comfortable aur acchi lagti hai.', hi: 'रस्ट या पन्ना हरा रेयान शर्ट - इस मौसम में आरामदायक और आकर्षक।' },
        brown: { en: 'Coral or golden yellow polo — pops against your skin and keeps you fresh', hinglish: 'Coral ya golden yellow polo — tumhari skin par acche se pop hota hai.', hi: 'कोरल या गोल्डन येलो पोलो - आपकी त्वचा पर उभरता है और आपको ताज़ा रखता है।' },
        dark: { en: 'Sky blue or coral cotton tee — fresh, vibrant and effortlessly cool', hinglish: 'Sky blue ya coral cotton tee — fresh, vibrant aur effortlessly cool lagti hai.', hi: 'स्काई ब्लू या कोरल कॉटन टी - ताज़ा, जीवंत और कूल।' },
        default: { en: 'A cotton polo or chambray shirt is perfect for this weather', hinglish: 'Cotton polo ya chambray shirt is mausam ke liye perfect hai.', hi: 'इस मौसम के लिए सूती पोलो या शैम्ब्रे शर्ट एकदम सही है।' }
      }
    },
    cool: {
      emoji: '🍂',
      label: { en: 'Cool & Pleasant', hinglish: 'Cool & Pleasant', hi: 'ठंडा और सुहावना' },
      fabrics: { en: 'Denim, Light Wool, Flannel', hinglish: 'Denim, Light Wool, Flannel', hi: 'डेनिम, लाइट वूल, फलालैन' },
      tips: {
        fair: { en: 'Burgundy flannel over a cream tee — warm autumn vibes for fair skin', hinglish: 'Cream tee ke upar burgundy flannel — fair skin ke liye best autumn vibes.', hi: 'क्रीम टी-शर्ट पर बरगंडी फलालैन - गोरी त्वचा के लिए गर्म शरद ऋतु लुक।' },
        light: { en: 'Olive denim jacket + white tee — earthy and effortlessly cool', hinglish: 'Olive denim jacket + white tee — ek earthy aur effortlessly cool look.', hi: 'ऑलिव डेनिम जैकेट + वाइट टी-शर्ट - अर्थी और आसानी से कूल।' },
        medium: { en: 'Mustard sweater or flannel shirt — warm tones that complement your skin', hinglish: 'Mustard sweater ya flannel shirt — warm tones tumhari skin par acchi lagti hain.', hi: 'मस्टर्ड स्वेटर या फलालैन शर्ट - गर्म टोन जो आपकी त्वचा के रंग के पूरक हैं।' },
        olive: { en: 'Wine-colored jacket over navy tee — rich layers for cool weather', hinglish: 'Navy tee ke upar wine-colored jacket — is mausam ke liye rich layers.', hi: 'नेवी टी-शर्ट के ऊपर वाइन रंग की जैकेट - ठंडे मौसम के लिए बेहतरीन लेयर्स।' },
        brown: { en: 'Denim jacket + bright tee underneath — layering is your style superpower', hinglish: 'Denim jacket + bright tee — layering tumhari style superpower hai.', hi: 'डेनिम जैकेट + अंदर ब्राइट टी-शर्ट - लेयरिंग आपकी स्टाइल सुपरपावर है।' },
        dark: { en: 'Camel coat or golden sweater — luxurious autumn tones for dark skin', hinglish: 'Camel coat ya golden sweater — dark skin ke liye luxurious tones.', hi: 'कैमल कोट या सुनहरा स्वेटर - गहरी त्वचा के लिए शानदार शरद ऋतु लुक।' },
        default: { en: 'Perfect layering weather — denim jacket over a tee is timeless', hinglish: 'Perfect layering weather hai — plain tee par denim jacket pehno.', hi: 'यह मौसम लेयरिंग के लिए परफेक्ट है - टी-शर्ट के ऊपर डेनिम जैकेट सदाबहार है।' }
      }
    },
    cold: {
      emoji: '❄️',
      label: { en: 'Cold', hinglish: 'Cold', hi: 'ठंडा' },
      fabrics: { en: 'Wool, Fleece, Cashmere', hinglish: 'Wool, Fleece, Cashmere', hi: 'ऊन (Wool), ऊन (Fleece), कश्मीरी (Cashmere)' },
      tips: {
        fair: { en: 'Navy wool sweater with a muffler — sophisticated and warm for fair skin', hinglish: 'Muffler ke sath navy wool sweater — fair skin ke liye sophisticated aur warm.', hi: 'मफलर के साथ नेवी ऊन का स्वेटर - गोरी त्वचा के लिए परिष्कृत और गर्म।' },
        light: { en: 'Maroon hoodie + dark jeans — cozy winter combo for light tones', hinglish: 'Maroon hoodie + dark jeans is a cozy winter combo tumhare liye.', hi: 'मैरून हुडी + डार्क जींस - हल्के टोन के लिए सर्दियों का आरामदायक कॉम्बो।' },
        medium: { en: 'Dark green wool sweater — deep colors absorb heat and look great on you', hinglish: 'Dark green wool sweater — deep colors heat absorb karte hain aur acche lagte hain.', hi: 'गहरे हरे रंग का ऊन स्वेटर - गहरे रंग गर्मी को अवशोषित करते हैं और आप पर शानदार लगते हैं।' },
        olive: { en: 'Charcoal fleece + burgundy scarf — warm layers that suit olive skin', hinglish: 'Charcoal fleece + burgundy scarf — warm layers jo olive skin pe suit karti hain.', hi: 'चारकोल ऊन + बरगंडी स्कार्फ - गर्म परतें जो जैतून की त्वचा पर सूट करती हैं।' },
        brown: { en: 'Black or navy puffer jacket — dark colors absorb heat + look powerful', hinglish: 'Black ya navy puffer jacket — dark colors heat absorb karte hain aur powerful lagte hain.', hi: 'काला या नेवी पफर जैकेट - गहरे रंग गर्मी को अवशोषित करते हैं और पावरफुल दिखते हैं।' },
        dark: { en: 'Rich jewel tones like emerald or royal blue wool — warmth meets royalty', hinglish: 'Emerald ya royal blue wool mein rich jewel tones — acchi warmth aur royalty milti hai.', hi: 'पन्ना या रॉयल ब्लू जैसे समृद्ध गहने रंग - गर्मी और भव्यता एक साथ।' },
        default: { en: 'Layer up: tee + hoodie + jacket — dark colors absorb more heat', hinglish: 'Acchi tarah layer up karo: tee + hoodie + jacket. Dark colors pehno.', hi: 'लेयर अप: टी-शर्ट + हुडी + जैकेट - गहरे रंग ज्यादा गर्मी सोखते हैं।' }
      }
    },
    rainy: {
      emoji: '🌧️',
      label: { en: 'Rainy / Monsoon', hinglish: 'Monsoon', hi: 'बारिश / मानसून' },
      fabrics: { en: 'Quick-dry, Polyester, Nylon', hinglish: 'Quick-dry, Polyester, Nylon', hi: 'जल्दी सूखने वाला सिंथेटिक, पॉलिएस्टर, नायलॉन' },
      tips: {
        fair: { en: 'Navy waterproof jacket + dark jeans — avoid white, rain splashes show', hinglish: 'Navy waterproof jacket aur dark jeans — white color avoid karo baarish mein.', hi: 'नेवी वाटरप्रूफ जैकेट + गहरी जींस — सफेद रंग से बचें, बारिश के छीटें दिखते हैं।' },
        light: { en: 'Dark olive or teal rain jacket — looks sharp even in monsoon', hinglish: 'Dark olive ya teal rain jacket — monsoon me bhi bada sharp lagta hai.', hi: 'गहरा ऑलिव या टील रेन जैकेट — मानसून में भी बहुत अच्छा लगता है।' },
        medium: { en: 'Charcoal quick-dry jacket + dark denim — rain-ready and stylish', hinglish: 'Charcoal quick-dry jacket + dark denim — tum rain-ready aur stylish lagoge.', hi: 'चारकोल क्विक-ड्राई जैकेट + डार्क डेनिम — बारिश के लिए तैयार और स्टाइलिश।' },
        olive: { en: 'Dark green or navy waterproof layer — practical and flattering', hinglish: 'Dark green ya navy waterproof layer — ye practical aur flattering lagegi.', hi: 'गहरा हरा या नेवी वाटरप्रूफ जैकेट — व्यावहारिक और आकर्षक।' },
        brown: { en: 'Black rain jacket + dark cargo pants — sleek monsoon look', hinglish: 'Black rain jacket aur dark cargo pants se bada sleek monsoon look aata hai.', hi: 'ब्लैक रेन जैकेट + डार्क कार्गो पैंट — शानदार मानसून लुक।' },
        dark: { en: 'Bright colored rain jacket in yellow or red — stand out, stay dry', hinglish: 'Monsoon me yellow ya red windbreaker me stand out karo aur dry raho.', hi: 'पीले या लाल रंग में चमकीले रंग का रेन जैकेट — अलग दिखें, सूखे रहें।' },
        default: { en: 'Quick-dry fabrics and dark colors — avoid white in the rain', hinglish: 'Quick-dry kapde aur dark colors pehno — baarish me white avoid karo.', hi: 'क्विक-ड्राई कपड़े और गहरे रंग — बारिश में सफेद रंग पहनने से बचें।' }
      }
    }
  };

  const categoryPool = WEATHER_TIPS[weatherCategory] || WEATHER_TIPS.warm;
  
  const tone = (typeof skinTone === 'string' ? skinTone : skinTone?.category || 'medium')?.toLowerCase();
  const tipObj = categoryPool.tips[tone] || categoryPool.tips.default;
  
  return {
    emoji: categoryPool.emoji,
    label: categoryPool.label[language] || categoryPool.label.en,
    fabrics: categoryPool.fabrics[language] || categoryPool.fabrics.en,
    tip: tipObj[language] || tipObj.en
  };
};
