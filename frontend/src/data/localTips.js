export const getLocalizedTip = (gender, skinTone, language) => {
  const LOCAL_TIPS = {
    male: {
      fair: [
        {
          emoji: '👔',
          en: 'Navy blue and dusty rose are your power colors — try them for instant polish',
          hinglish: 'Navy blue aur dusty rose tumhare power colors hain — inhe zaroor try karo.',
          hi: 'नेवी ब्लू और डस्टी रोज़ आपके लिए सबसे बेहतरीन रंग हैं — इन्हें आज़माएं।'
        },
        { emoji: '🎨', en: 'Pastels like lavender and sage green look effortlessly elegant on fair skin', hinglish: 'Lavender aur sage green jaise pastels fair skin par bahut elegant lagte hain.', hi: 'लैवेंडर और सेज ग्रीन जैसे पेस्टल रंग गोरी त्वचा पर बहुत सुंदर लगते हैं।' },
        { emoji: '✨', en: 'Burgundy shirts create a sophisticated, rich contrast with your complexion', hinglish: 'Burgundy shirts ek sophisticated aur rich contrast banate hain.', hi: 'बरगंडी शर्ट आपकी त्वचा के साथ एक शानदार और गहरा कंट्रास्ट बनाती है।' },
        { emoji: '💡', en: 'Forest green adds depth without overwhelming light skin — perfect for office', hinglish: 'Forest green office ke liye best hai, light skin par bahut perfect lagta hai.', hi: 'गहरा हरा रंग ऑफिस के लिए एकदम सही है, यह हल्की त्वचा पर जंचता है।' },
        { emoji: '🌟', en: 'Avoid neon colors — opt for muted jewel tones for a refined look', hinglish: 'Neon colors se bacho — muted jewel tones pehno ek refined look ke liye.', hi: 'नियॉन रंगों से बचें — एक बेहतरीन लुक के लिए म्यूटेड ज्वेल टोन चुनें।' }
      ],
      light: [
        { emoji: '🔥', en: 'Teal and coral bring out the warm undertones in your skin beautifully', hinglish: 'Teal aur coral tumhari skin ke warm undertones ko bahut sundar dikhate hain.', hi: 'टील और कोरल आपकी त्वचा के गर्म अंडरटोन को खूबसूरती से उभारते हैं।' },
        { emoji: '🍂', en: 'Earth tones like olive and terracotta create a natural, harmonious look', hinglish: 'Olive aur terracotta jaise earth tones ek natural aur harmonious look dete hain.', hi: 'ऑलिव और टेराकोटा जैसे हल्के रंग एक प्राकृतिक और सामंजस्यपूर्ण लुक देते हैं।' },
        { emoji: '💎', en: 'Steel blue is versatile and flattering — works from office to evening', hinglish: 'Steel blue versatile hai — office se lekar shaam tak perfect lagta hai.', hi: 'स्टील ब्लू बहुमुखी और आकर्षक है — ऑफिस से लेकर शाम की पार्टी तक काम आता है।' },
        { emoji: '🎯', en: 'Try a chambray shirt with khaki — classic combo for light skin tones', hinglish: 'Khaki ke sath chambray shirt try karo — light skin ke liye classic combo hai.', hi: 'खाकी के साथ चमब्रे शर्ट आज़माएँ — हल्की त्वचा के लिए क्लासिक कॉम्बिनेशन।' },
        { emoji: '✨', en: 'Warm metallics like gold accessories elevate any outfit on light skin', hinglish: 'Light skin par gold accessories jaise warm metallics kisi bhi outfit ko elevate karte hain.', hi: 'हल्की त्वचा पर सोने के गहने जैसे गर्म मैटेलिक किसी भी पोशाक को बेहतर बनाते हैं।' }
      ],
      medium: [
        { emoji: '👑', en: 'Royal blue is your power color — it makes medium skin absolutely glow', hinglish: 'Royal blue tumhara power color hai — yeh medium skin ko glow karta hai.', hi: 'रॉयल ब्लू आपका पावर कलर है — यह मध्यम त्वचा को पूरी तरह से निखारता है।' },
        { emoji: '🔥', en: 'Burnt orange and mustard harmonize perfectly with your wheat-toned skin', hinglish: 'Burnt orange aur mustard tumhari wheat-toned skin ke sath perfect match banate hain.', hi: 'बर्न ऑरेंज और मस्टर्ड आपकी गेहूं के रंग की त्वचा के साथ पूरी तरह मेल खाते हैं।' },
        { emoji: '🌿', en: 'Deep greens like pine and emerald create an earthy, sophisticated look', hinglish: 'Pine aur emerald jaise deep greens ek earthy aur sophisticated look dete hain.', hi: 'पाइन और पन्ना जैसे गहरे हरे रंग एक मिट्टी के समान और परिष्कृत रूप बनाते हैं।' },
        { emoji: '💪', en: 'Maroon + gold is peak Indian wedding elegance for your skin tone', hinglish: 'Maroon + gold tumhari skin tone ke liye Indian wedding ka best elegance hai.', hi: 'मैरून + गोल्ड आपकी त्वचा की रंगत के लिए भारतीय शादियों में सबसे बेहतरीन है।' },
        { emoji: '⚡', en: 'Bold contrast works great — try a white tee with dark navy jeans', hinglish: 'Bold contrast bahut acha lagta hai — dark navy jeans ke sath white tee try karo.', hi: 'गहरा कंट्रास्ट बढ़िया काम करता है — डार्क नेवी जींस के साथ वाइट टी-शर्ट आज़माएँ।' },
      ],
      olive: [
        { emoji: '💎', en: 'Cobalt blue creates a striking contrast with your olive undertones', hinglish: 'Cobalt blue tumhare olive undertones ke sath striking contrast banata hai.', hi: 'कोबाल्ट ब्लू आपके जैतून अंडरटोन के साथ एक आकर्षक कंट्रास्ट बनाता है।' },
        { emoji: '🍷', en: 'Wine and burgundy shades complement olive undertones beautifully', hinglish: 'Wine aur burgundy shades olive undertones ko perfectly complement karte hain.', hi: 'वाइन और बरगंडी शेड्स जैतून के अंडरटोन को खूबसूरती से पूरा करते हैं।' },
        { emoji: '🌟', en: 'Rust orange brings out the golden warmth in your complexion', hinglish: 'Rust orange tumhari complexion ki golden warmth ko bahar nikalta hai.', hi: 'रस्ट ऑरेंज आपकी त्वचा की सुनहरी गर्मी को बाहर लाता है।' },
        { emoji: '✨', en: 'Ivory and cream create an elegant contrast with olive skin', hinglish: 'Ivory aur cream olive skin ke sath ek elegant contrast banate hain.', hi: 'हाथीदांत और क्रीम रंग जैतून की त्वचा के साथ एक सुंदर कंट्रास्ट बनाते हैं।' },
        { emoji: '🎨', en: 'Emerald green is naturally harmonious — your go-to formal color', hinglish: 'Emerald green naturally harmonious hai — formal wear ke liye best.', hi: 'पन्ना हरा स्वाभाविक रूप से सामंजस्यपूर्ण है — यह आपका पसंदीदा औपचारिक रंग है।' }
      ],
      brown: [
        { emoji: '⚡', en: 'High contrast is your superpower — white tee + black jeans is unbeatable', hinglish: 'High contrast tumhari superpower hai — white tee + black jeans unbeatable lagta hai.', hi: 'उच्च कंट्रास्ट आपकी महाशक्ति है — सफेद टी-शर्ट + काली जींस बेजोड़ है।' },
        { emoji: '🌟', en: 'Bright yellows and golds pop beautifully against your rich skin tone', hinglish: 'Bright yellows aur golds rich skin tone ke opposite bahut beautifully pop karte hain.', hi: 'गहरी त्वचा के रंग के विपरीत चमकीले पीले और सुनहरे रंग खूबसूरती से उभरते हैं।' },
        { emoji: '💜', en: 'Purple makes dark skin absolutely shine — do not hold back on bold colors', hinglish: 'Purple dark skin ko completely shine karwata hai — bold colors pehenne me hichkichao nahi.', hi: 'बैंगनी गहरी त्वचा को पूरी तरह से चमका देता है — गहरे रंगों को पहनने से न हिचकिचाएँ।' },
        { emoji: '💎', en: 'Powder blue creates a regal, sophisticated look on brown skin', hinglish: 'Brown skin par powder blue ek regal aur sophisticated look create karta hai.', hi: 'पाउडर ब्लू भूरी त्वचा पर एक शाही, परिष्कृत लुक बनाता है।' },
        { emoji: '🔥', en: 'Hot pink and electric blue are your statement colors — own them', hinglish: 'Hot pink aur electric blue tumhare statement colors hain — unhe confidence ke sath peheno.', hi: 'हॉट पिंक और इलेक्ट्रिक ब्लू आपके स्टेटमेंट कलर्स हैं — इन्हें आत्मविश्वास के साथ अपनाएं।' }
      ],
      dark: [
        { emoji: '👑', en: 'White is THE power color for dark skin — maximum contrast, maximum impact', hinglish: 'White dark skin ke liye THE power color hai — maximum contrast, maximum impact.', hi: 'सफ़ेद रंग गहरी त्वचा के लिए सबसे शक्तिशाली रंग है — अधिकतम कंट्रास्ट और अधिकतम प्रभाव।' },
        { emoji: '☀️', en: 'Bright yellows and lemon shades create showstopping vibrancy', hinglish: 'Bright yellows aur lemon shades ek showstopping vibrancy create karte hain.', hi: 'चमकीले पीले और नींबू के शेड एक शानदार जीवंतता बनाते हैं।' },
        { emoji: '🌸', en: 'Coral + dark skin is a red carpet combination — try it today', hinglish: 'Coral + dark skin ek red carpet combination hai — ise aaj hi try karo.', hi: 'कोरल के साथ गहरी त्वचा एक रेड कार्पेट कॉम्बिनेशन है — इसे आज ही आज़माएँ।' },
        { emoji: '✨', en: 'Gold on dark skin equals absolute royalty — perfect for festive wear', hinglish: 'Dark skin par gold bilkul royalty jaisa lagta hai — festive wear ke liye perfect.', hi: 'गहरी त्वचा पर सोना बिल्कुल राजशाही जैसा लगता है — उत्सव के परिधान के लिए एकदम सही।' },
        { emoji: '💙', en: 'Sky blue and light pastels create an effortlessly cool contrast', hinglish: 'Sky blue aur light pastels asaani se ek cool contrast create karte hain.', hi: 'स्काई ब्लू और हल्के पेस्टल रंग आसानी से एक कूल कंट्रास्ट बनाते हैं।' }
      ]
    },
    female: {
      fair: [
        { emoji: '🌸', en: 'Dusty rose and blush pink create romantic elegance on fair skin', hinglish: 'Fair skin par dusty rose aur blush pink romantic elegance create karte hain.', hi: 'डस्टी रोज़ और ब्लश पिंक गोरी त्वचा पर रोमांटिक सुंदरता बनाते हैं।' },
        { emoji: '🌿', en: 'Sage green kurtis with white palazzos — fresh and naturally harmonious', hinglish: 'Sage green kurtis white palazzos ke sath — fresh aur naturally harmonious.', hi: 'सेज ग्रीन कुर्ती सफेद पलाज़ो के साथ — ताज़ा और स्वाभाविक रूप से सामंजस्यपूर्ण।' },
        { emoji: '💜', en: 'Lavender is literally made for fair skin — pure elegance guaranteed', hinglish: 'Lavender specifically fair skin ke liye bana hai — pure elegance.', hi: 'लैवेंडर खासतौर पर गोरी त्वचा के लिए बनाया गया है — शुद्ध सुंदरता की गारंटी।' },
        { emoji: '✨', en: 'Navy silk saree with gold border is timelessly elegant for weddings', hinglish: 'Gold border wali navy silk saree weddings ke liye timeless lagti hai.', hi: 'गोल्डन बॉर्डर वाली नेवी सिल्क साड़ी शादियों के लिए हमेशा खूबसूरत लगती है।' },
        { emoji: '🎀', en: 'Avoid harsh neons — soft pastels are your secret weapon', hinglish: 'Hard neons se bacho — soft pastels tumhara secret weapon hain.', hi: 'कठोर नियॉन रंगों से बचें — हल्के पेस्टल रंग आपका गुप्त हथियार हैं।' }
      ],
      light: [
        { emoji: '🍑', en: 'Peach and apricot tones give light skin a healthy, vibrant glow', hinglish: 'Peach aur apricot tones light skin ko ek healthy glow dete hain.', hi: 'पीच और एप्रीकॉट टोन हल्की त्वचा को एक स्वस्थ और जीवंत चमक देते हैं।' },
        { emoji: '🌊', en: 'Sea green and mint are refreshing choices for casual ethnic wear', hinglish: 'Sea green aur mint ethnic wear ke liye refreshing choices hain.', hi: 'सी ग्रीन और मिंट कैजुअल एथनिक वियर के लिए ताज़ा विकल्प हैं।' },
        { emoji: '🍂', en: 'Terracotta and rust shades highlight the warmth in your light complexion', hinglish: 'Terracotta aur rust shades light complexion ki warmth ko highlight karte hain.', hi: 'टेराकोटा और रस्ट शेड्स आपकी हल्की त्वचा की रंगत में गर्माहट को उभारते हैं।' },
        { emoji: '💎', en: 'Sky blue and champagne gold are perfect for formal evening events', hinglish: 'Sky blue aur champagne gold formal events ke liye perfect hain.', hi: 'स्काई ब्लू और शैंपेन गोल्ड औपचारिक शाम के कार्यक्रमों के लिए एकदम सही हैं।' },
        { emoji: '🌟', en: 'Opt for silver or rose gold jewellery to complement your undertone', hinglish: 'Silver ya rose gold jewellery tumhare undertone ko complement karegi.', hi: 'अपने अंडरटोन के लिए चांदी या रोज़ गोल्ड के गहनों का चुनाव करें।' }
      ],
      medium: [
        { emoji: '💎', en: 'Teal + gold is a stunning festive combination for medium skin tones', hinglish: 'Teal + gold medium skin tones ke liye ek stunning festive combination hai.', hi: 'टील और गोल्ड मध्यम त्वचा के रंग के लिए एक शानदार त्यौहारी संयोजन है।' },
        { emoji: '🔥', en: 'Rust and terracotta coord sets amplify your natural warmth beautifully', hinglish: 'Rust aur terracotta coord sets tumhari natural warmth ko beautifully amplify karte hain.', hi: 'रस्ट और टेराकोटा कॉर्ड सेट आपकी प्राकृतिक गर्मी को खूबसूरती से बढ़ाते हैं।' },
        { emoji: '👑', en: 'Royal blue silk saree is show-stopping wedding elegance for your tone', hinglish: 'Royal blue silk saree tumhare tone ke liye show-stopping wedding elegance hai.', hi: 'रॉयल ब्लू सिल्क साड़ी आपके रंग के लिए एक शानदार वेडिंग ड्रेस है।' },
        { emoji: '🌟', en: 'Mustard kurtis make you look confident and stylish — try with white', hinglish: 'Mustard kurtis tumhe confident aur stylish dikhati hain — white ke sath try karo.', hi: 'मस्टर्ड कुर्ती आपको आत्मविश्वासी और स्टाइलिश दिखाती है — सफेद के साथ आज़माएँ।' },
        { emoji: '💚', en: 'Emerald green makes your skin absolutely glow — ideal for dates', hinglish: 'Emerald green se skin continuously glow karti hai — dates ke liye ideal.', hi: 'पन्ना हरा आपकी त्वचा को पूरी तरह से निखारता है — डेट के लिए आदर्श है।' }
      ],
      olive: [
        { emoji: '🍷', en: 'Deep wine and burgundy create a rich contrast with olive undertones', hinglish: 'Deep wine aur burgundy olive undertones ke sath rich contrast dete hain.', hi: 'गहरी वाइन और बरगंडी जैतून के अंडरटोन के साथ एक समृद्ध कंट्रास्ट बनाते हैं।' },
        { emoji: '✨', en: 'Ivory and cream sarees look incredibly sophisticated on olive skin', hinglish: 'Ivory aur cream sarees olive skin par bahut sophisticated lagti hain.', hi: 'हाथीदांत और क्रीम रंग की साड़ियाँ जैतून की त्वचा पर अविश्वसनीय रूप से परिष्कृत लगती हैं।' },
        { emoji: '🍊', en: 'Burnt orange and amber bring out the golden glow in your complexion', hinglish: 'Burnt orange aur amber complexion ki golden glow ko bahar nikalte hain.', hi: 'बर्न ऑरेंज और एम्बर आपकी त्वचा की सुनहरी चमक को बाहर लाते हैं।' },
        { emoji: '🌿', en: 'Try olive green on olive skin for a chic tone-on-tone look', hinglish: 'Olive green ko olive skin par try karo chic tone-on-tone look ke liye.', hi: 'एक शानदार टोन-ऑन-टोन लुक के लिए जैतून की त्वचा पर जैतून हरा रंग आज़माएँ।' },
        { emoji: '💎', en: 'Silver and gunmetal jewellery work better than traditional gold for you', hinglish: 'Tumhare liye silver aur gunmetal jewellery gold se better kaam karti hai.', hi: 'आपके लिए चांदी और गनमेटल के गहने पारंपरिक सोने से बेहतर काम करते हैं।' }
      ],
      brown: [
        { emoji: '💖', en: 'Hot pink and gold is a power combination that makes brown skin radiate', hinglish: 'Hot pink aur gold ek power combination hai jo brown skin ko fully radiate karta hai.', hi: 'हॉट पिंक और गोल्ड एक शक्तिशाली संयोजन है जो भूरी त्वचा को चमका देता है।' },
        { emoji: '⚡', en: 'White creates a stunning high-contrast look on brown skin', hinglish: 'White brown skin par ek stunning high-contrast look create karta hai.', hi: 'सफेद भूरी त्वचा पर एक शानदार हाई-कंट्रास्ट लुक बनाता है।' },
        { emoji: '☀️', en: 'Bright yellow on brown skin equals pure sunshine energy', hinglish: 'Brown skin par bright yellow pure sunshine energy deta hai.', hi: 'भूरी त्वचा पर चमकीला पीला रंग शुद्ध धूप जैसी ऊर्जा देता है।' },
        { emoji: '💎', en: 'Turquoise saree makes brown skin look absolutely radiant and regal', hinglish: 'Turquoise saree brown skin ko bilkul radiant aur regal dikhati hai.', hi: 'फ़िरोज़ा (Turquoise) साड़ी भूरी त्वचा को बिल्कुल दीप्तिमान और शाही दिखाती है।' },
        { emoji: '🧡', en: 'Coral is universally flattering on deeper skin tones — your go-to!', hinglish: 'Coral deeper skin tones par universally flattering hota hai — tumhara best look!', hi: 'कोरल रंग गहरी त्वचा के टोन पर सार्वभौमिक रूप से जंचता है — यह आपका पसंदीदा रंग है!' }
      ],
      dark: [
        { emoji: '👑', en: 'White on dark skin equals pure elegance and maximum impact', hinglish: 'Dark skin par white pure elegance aur completely maximum impact deta hai.', hi: 'गहरी त्वचा पर सफेद रंग शुद्ध सुंदरता और गज़ब का प्रभाव डालता है।' },
        { emoji: '💜', en: 'Purple + gold creates a royal, luxurious look that commands attention', hinglish: 'Purple + gold ek royal aur luxurious look create karte hain.', hi: 'बैंगनी + गोल्ड एक शाही, शानदार लुक बनाता है जो ध्यान आकर्षित करता है।' },
        { emoji: '🌺', en: 'Bold fuchsia on dark skin is absolutely stunning — own it', hinglish: 'Dark skin par bold fuchsia bahut stunning lagta hai — ise confidence se pehno.', hi: 'गहरी त्वचा पर बोल्ड फुकिया रंग बिल्कुल आश्चर्यजनक लगता है — इसे अपनाएं।' },
        { emoji: '💙', en: 'Electric blue + white is a fresh, vibrant combo for everyday style', hinglish: 'Electric blue aur white everyday style ke liye ek fresh aur vibrant combo hai.', hi: 'इलेक्ट्रिक ब्लू और सफेद रोज़मर्रा के स्टाइल के लिए एक ताज़ा और वाइब्रेंट कॉम्बिनेशन है।' },
        { emoji: '🧡', en: 'Orange on dark skin is warm, vibrant, and powerful — perfect for any season', hinglish: 'Dark skin par orange bilkul warm, vibrant, aur powerful lagta hai.', hi: 'गहरी त्वचा पर नारंगी रंग गर्म, वाइब्रेंट और शक्तिशाली लगता है — किसी भी मौसम के लिए सही।' }
      ]
    }
  };

  const gndr = gender === 'female' ? 'female' : 'male';
  let tone = (typeof skinTone === 'string' ? skinTone : skinTone?.category || 'medium')?.toLowerCase();
  if (!LOCAL_TIPS[gndr][tone]) tone = 'medium';
  
  const tonePool = LOCAL_TIPS[gndr][tone];
  const now = new Date();
  const dayIndex = (now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()) % tonePool.length;
  const tipObj = tonePool[dayIndex];
  
  return {
    emoji: tipObj.emoji,
    tip: tipObj[language] || tipObj.en
  };
};
