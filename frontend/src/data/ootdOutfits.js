export const getLocalizedOOTD = (gender, skinTone, language, indexOffset = 0) => {
  const OUTFITS = {
    male: {
      fair: [
        { 
          shirt: { en: 'Navy Blue Polo', hinglish: 'Navy Blue Polo', hi: 'नेवी ब्लू पोलो' }, shirtHex: '#1e3a5f',
          pant: { en: 'Beige Chinos', hinglish: 'Beige Chinos', hi: 'बेज चिनोस' }, pantHex: '#d2b48c',
          shoes: { en: 'White Sneakers', hinglish: 'White Sneakers', hi: 'सफेद स्नीकर्स' }, occasion: { en: 'Casual', hinglish: 'Casual', hi: 'कैज़ुअल' },
          tip: { en: 'Navy + beige is a timeless combo for fair skin', hinglish: 'Fair skin ke liye navy + beige timeless combo hai.', hi: 'फेयर स्किन के लिए नेवी + बेज एक बेहतरीन कॉम्बिनेशन है।' }
        },
        { 
          shirt: { en: 'Dusty Rose Tee', hinglish: 'Dusty Rose T-Shirt', hi: 'डस्टी रोज़ टी-शर्ट' }, shirtHex: '#c4767a',
          pant: { en: 'Dark Grey Jeans', hinglish: 'Dark Grey Jeans', hi: 'डार्क ग्रे जींस' }, pantHex: '#3d3d3d',
          shoes: { en: 'Brown Loafers', hinglish: 'Brown Loafers', hi: 'भूरे रंग के लोफर्स' }, occasion: { en: 'Date', hinglish: 'Date', hi: 'डेट' },
          tip: { en: 'Soft pink tones complement your fair complexion beautifully', hinglish: 'Soft pink tones tumhare fair complexion ko nicely complement karte hain.', hi: 'सॉफ्ट पिंक टोन आपकी गोरी त्वचा को खूबसूरती से निखारते हैं।' }
        },
        { 
          shirt: { en: 'Forest Green Shirt', hinglish: 'Forest Green Shirt', hi: 'फॉरेस्ट ग्रीन शर्ट' }, shirtHex: '#2d5a27',
          pant: { en: 'Navy Trousers', hinglish: 'Navy Trousers', hi: 'नेवी ट्राउजर' }, pantHex: '#1b2838',
          shoes: { en: 'Tan Boots', hinglish: 'Tan Boots', hi: 'टैन बूट्स' }, occasion: { en: 'Office', hinglish: 'Office', hi: 'ऑफिस' },
          tip: { en: 'Deep green adds depth without overwhelming light skin', hinglish: 'Deep green light skin par bahut depth add karta hai bina overwhelm kiye.', hi: 'गहरा हरा रंग हल्की त्वचा पर गहराई जोड़ता है।' }
        },
        { 
          shirt: { en: 'Lavender Oversized', hinglish: 'Lavender Oversized Shirt', hi: 'लैवेंडर ओवरसाइज़्ड शर्ट' }, shirtHex: '#b4a7d6',
          pant: { en: 'White Jeans', hinglish: 'White Jeans', hi: 'सफेद जींस' }, pantHex: '#f5f5f5',
          shoes: { en: 'Grey Sneakers', hinglish: 'Grey Sneakers', hi: 'ग्रे स्नीकर्स' }, occasion: { en: 'Weekend', hinglish: 'Weekend', hi: 'वीकेंड' },
          tip: { en: 'Pastels on fair skin look effortlessly stylish', hinglish: 'Fair skin par pastels naturally stylish lagte hain.', hi: 'गोरी त्वचा पर पेस्टल रंग स्टाइलिश लगते हैं।' }
        },
        { 
          shirt: { en: 'Burgundy Henley', hinglish: 'Burgundy Henley', hi: 'बरगंडी हेनले शर्ट' }, shirtHex: '#722f37',
          pant: { en: 'Black Slim Fit', hinglish: 'Black Slim Fit Pants', hi: 'काले स्लिम फिट पैंट' }, pantHex: '#1a1a1a',
          shoes: { en: 'Oxford Brown', hinglish: 'Oxford Brown Shoes', hi: 'ऑक्सफोर्ड भूरे जूते' }, occasion: { en: 'Party', hinglish: 'Party', hi: 'पार्टी' },
          tip: { en: 'Burgundy creates a sophisticated, rich contrast', hinglish: 'Burgundy ek rich aur sophisticated contrast banata hai.', hi: 'बरगंडी एक शानदार और समृद्ध कंट्रास्ट बनाता है।' }
        },
      ],
      light: [
        { 
          shirt: { en: 'Teal Polo', hinglish: 'Teal Polo', hi: 'टील पोलो' }, shirtHex: '#008080',
          pant: { en: 'Khaki Chinos', hinglish: 'Khaki Chinos', hi: 'खाकी चिनोस' }, pantHex: '#c3b091',
          shoes: { en: 'White Canvas', hinglish: 'White Canvas Shoes', hi: 'सफेद कैनवस जूते' }, occasion: { en: 'Casual', hinglish: 'Casual', hi: 'कैज़ुअल' },
          tip: { en: 'Teal brings out the warm undertones beautifully', hinglish: 'Teal tumhare warm undertones ko bahot acche se ubharta hai.', hi: 'टील आपके गरम अंडरटोन को खूबसूरती से निखारता है।' }
        },
        { 
          shirt: { en: 'Coral Oversized', hinglish: 'Coral Oversized Shirt', hi: 'कोरल ओवरसाइज़्ड शर्ट' }, shirtHex: '#ff6f61',
          pant: { en: 'Dark Wash Jeans', hinglish: 'Dark Wash Jeans', hi: 'डार्क वॉश जींस' }, pantHex: '#2b3a67',
          shoes: { en: 'White Sneakers', hinglish: 'White Sneakers', hi: 'सफ़ेद स्नीकर्स' }, occasion: { en: 'Weekend', hinglish: 'Weekend', hi: 'वीकेंड' },
          tip: { en: 'Coral adds a vibrant pop to your natural warmth', hinglish: 'Coral tumhari natural warmth mein ek vibrant pop add karta hai.', hi: 'कोरल आपकी प्राकृतिक गर्मी में एक जीवंतता जोड़ता है।' }
        },
        { 
          shirt: { en: 'Olive Shirt', hinglish: 'Olive Shirt', hi: 'ऑलिव शर्ट' }, shirtHex: '#708238',
          pant: { en: 'Brown Joggers', hinglish: 'Brown Joggers', hi: 'भूरे जॉगर्स' }, pantHex: '#6b4423',
          shoes: { en: 'Tan Boots', hinglish: 'Tan Boots', hi: 'टैन बूट्स' }, occasion: { en: 'Outdoor', hinglish: 'Outdoor', hi: 'आउटडोर' },
          tip: { en: 'Earth tones create a harmonious natural palette', hinglish: 'Earth tones ek naturally harmonious look dete hain.', hi: 'मिट्टी के रंग एक प्राकृतिक और सामंजस्यपूर्ण रूप बनाते हैं।' }
        },
        { 
          shirt: { en: 'Steel Blue Tee', hinglish: 'Steel Blue T-Shirt', hi: 'स्टील ब्लू टी-शर्ट' }, shirtHex: '#4682b4',
          pant: { en: 'Grey Chinos', hinglish: 'Grey Chinos', hi: 'ग्रे चिनोस' }, pantHex: '#808080',
          shoes: { en: 'Navy Loafers', hinglish: 'Navy Loafers', hi: 'नेवी लोफर्स' }, occasion: { en: 'Office', hinglish: 'Office', hi: 'ऑफिस' },
          tip: { en: 'Steel blue is versatile and flattering for light skin', hinglish: 'Light skin ke liye steel blue versatile aur accha hota hai.', hi: 'हल्की त्वचा के लिए स्टील ब्लू बहुमुखी और आकर्षक होता है।' }
        },
        { 
          shirt: { en: 'Terracotta Kurta', hinglish: 'Terracotta Kurta', hi: 'टेराकोटा कुर्ता' }, shirtHex: '#cc5533',
          pant: { en: 'White Pyjama', hinglish: 'White Pyjama', hi: 'सफ़ेद पजामा' }, pantHex: '#faf0e6',
          shoes: { en: 'Kolhapuri', hinglish: 'Kolhapuri Chappal', hi: 'कोल्हापुरी चप्पल' }, occasion: { en: 'Festive', hinglish: 'Festive', hi: 'त्यौहार' },
          tip: { en: 'Terracotta + white is a classic festive combination', hinglish: 'Terracotta aur white ek classic festive combo hai.', hi: 'टेराकोटा + सफेद एक क्लासिक फेस्टिव कॉम्बिनेशन है।' }
        },
      ],
      medium: [
        { 
          shirt: { en: 'Royal Blue Tee', hinglish: 'Royal Blue T-Shirt', hi: 'रॉयल ब्लू टी-शर्ट' }, shirtHex: '#4169e1',
          pant: { en: 'Charcoal Slim', hinglish: 'Charcoal Slim Jeans', hi: 'चारकोल स्लिम जींस' }, pantHex: '#36454f',
          shoes: { en: 'White Sneakers', hinglish: 'White Sneakers', hi: 'सफ़ेद स्नीकर्स' }, occasion: { en: 'Casual', hinglish: 'Casual', hi: 'कैज़ुअल' },
          tip: { en: 'Royal blue is your power color — makes medium skin glow', hinglish: 'Royal blue tumhara power color hai — medium skin par glow karta hai.', hi: 'रॉयल ब्लू आपका खास रंग है - यह डार्क स्किन को चमकाता है।' }
        },
        { 
          shirt: { en: 'Burnt Orange Shirt', hinglish: 'Burnt Orange Shirt', hi: 'बर्न्ट ऑरेंज शर्ट' }, shirtHex: '#cc5500',
          pant: { en: 'Dark Navy Jeans', hinglish: 'Dark Navy Jeans', hi: 'डार्क नेवी जींस' }, pantHex: '#1b2838',
          shoes: { en: 'Brown Chelsea', hinglish: 'Brown Chelsea Boots', hi: 'भूरी चेल्सी बूट्स' }, occasion: { en: 'Date', hinglish: 'Date', hi: 'डेट' },
          tip: { en: 'Warm oranges harmonize perfectly with wheat tones', hinglish: 'Warm oranges wheat tones ke sath perfect match banate hain.', hi: 'गर्म नारंगी रंग गेहूं जैसी त्वचा के साथ एकदम सही बैठते हैं।' }
        },
        { 
          shirt: { en: 'Pine Green Polo', hinglish: 'Pine Green Polo', hi: 'पाइन ग्रीन पोलो' }, shirtHex: '#01796f',
          pant: { en: 'Beige Joggers', hinglish: 'Beige Joggers', hi: 'बेज जॉगर्स' }, pantHex: '#d2b48c',
          shoes: { en: 'Tan Sneakers', hinglish: 'Tan Sneakers', hi: 'टैन स्नीकर्स' }, occasion: { en: 'Weekend', hinglish: 'Weekend', hi: 'वीकेंड' },
          tip: { en: 'Deep greens create an earthy, sophisticated look', hinglish: 'Deep greens se ek earthy aur sophisticated look milta hai.', hi: 'गहरे हरे रंग एक अर्थी और परिष्कृत लुक बनाते हैं।' }
        },
        { 
          shirt: { en: 'Maroon Kurta', hinglish: 'Maroon Kurta', hi: 'मैरून कुर्ता' }, shirtHex: '#800000',
          pant: { en: 'Gold Churidar', hinglish: 'Gold Churidar', hi: 'गोल्ड चूड़ीदार' }, pantHex: '#c5a35c',
          shoes: { en: 'Mojari', hinglish: 'Mojari', hi: 'मोजरी' }, occasion: { en: 'Wedding', hinglish: 'Wedding', hi: 'शादी' },
          tip: { en: 'Maroon + gold is peak Indian wedding elegance', hinglish: 'Maroon + gold tumhare liye Indian wedding ka best look hai.', hi: 'मैरून + गोल्ड भारतीय शादियों के लिए सबसे बेहतरीन है।' }
        },
        { 
          shirt: { en: 'Mustard Oversized', hinglish: 'Mustard Oversized Shirt', hi: 'मस्टर्ड ओवरसाइज़्ड शर्ट' }, shirtHex: '#e8a317',
          pant: { en: 'Black Cargo', hinglish: 'Black Cargo Pants', hi: 'ब्लैक कार्गो पैंट्स' }, pantHex: '#1a1a1a',
          shoes: { en: 'White High-tops', hinglish: 'White High-tops', hi: 'सफ़ेद हाई-टॉप्स' }, occasion: { en: 'Streetwear', hinglish: 'Streetwear', hi: 'स्ट्रीट वियर' },
          tip: { en: 'Mustard on medium skin = instant standout', hinglish: 'Medium skin par mustard pehnne se tum turant standout karoge.', hi: 'गेहुंए रंग पर मस्टर्ड रंग सीधा लोगों का ध्यान खींचता है।' }
        },
      ],
      olive: [
        { 
          shirt: { en: 'Cobalt Blue Polo', hinglish: 'Cobalt Blue Polo', hi: 'कोबाल्ट ब्लू पोलो' }, shirtHex: '#0047ab',
          pant: { en: 'Tan Chinos', hinglish: 'Tan Chinos', hi: 'टैन चिनोस' }, pantHex: '#d2b48c',
          shoes: { en: 'Brown Loafers', hinglish: 'Brown Loafers', hi: 'भूरे रंग के लोफर्स' }, occasion: { en: 'Office', hinglish: 'Office', hi: 'ऑफिस' },
          tip: { en: 'Cobalt creates a striking contrast with olive skin', hinglish: 'Cobalt tumhari olive skin ke sath ek striking contrast banata hai.', hi: 'कोबाल्ट ऑलिव स्किन के साथ एक आकर्षक कंट्रास्ट बनाता है।' }
        },
        { 
          shirt: { en: 'Emerald Shirt', hinglish: 'Emerald Green Shirt', hi: 'पन्ना हरा शर्ट' }, shirtHex: '#046307',
          pant: { en: 'Black Trousers', hinglish: 'Black Trousers', hi: 'काले ट्राउजर' }, pantHex: '#1a1a1a',
          shoes: { en: 'Oxford Tan', hinglish: 'Tan Oxford Shoes', hi: 'टैन ऑक्सफोर्ड जूते' }, occasion: { en: 'Formal', hinglish: 'Formal', hi: 'फॉर्मल' },
          tip: { en: 'Emerald + olive skin = naturally harmonious', hinglish: 'Emerald + olive skin naturally harmonious lagta hai.', hi: 'पन्ना हरा + ऑलिव स्किन = प्राकृतिक सामंजस्य।' }
        },
        { 
          shirt: { en: 'Rust Orange Tee', hinglish: 'Rust Orange T-Shirt', hi: 'रस्ट नारंगी टी-शर्ट' }, shirtHex: '#b7410e',
          pant: { en: 'Navy Joggers', hinglish: 'Navy Joggers', hi: 'नेवी जॉगर्स' }, pantHex: '#1b2838',
          shoes: { en: 'White Sneakers', hinglish: 'White Sneakers', hi: 'सफ़ेद स्नीकर्स' }, occasion: { en: 'Casual', hinglish: 'Casual', hi: 'कैज़ुअल' },
          tip: { en: 'Warm rust tones bring out the golden undertones', hinglish: 'Warm rust tones tumhare golden undertones bahar nikalte hain.', hi: 'गर्म रस्ट टोन आपके गोल्डन अंडरटोन को और निखारते हैं।' }
        },
        { 
          shirt: { en: 'Ivory Kurta', hinglish: 'Ivory Kurta', hi: 'आइवरी (हाथीदांत) कुर्ता' }, shirtHex: '#fffff0',
          pant: { en: 'Navy Churidar', hinglish: 'Navy Churidar', hi: 'नेवी चूड़ीदार' }, pantHex: '#1b2838',
          shoes: { en: 'Kolhapuri', hinglish: 'Kolhapuri Chappal', hi: 'कोल्हापुरी चप्पल' }, occasion: { en: 'Festive', hinglish: 'Festive', hi: 'त्यौहार' },
          tip: { en: 'Ivory on olive skin creates an elegant contrast', hinglish: 'Olive skin par ivory ek elegant contrast create karta hai.', hi: 'ऑलिव स्किन पर आइवरी रंग एक खूबसूरत कंट्रास्ट बनाता है।' }
        },
        { 
          shirt: { en: 'Wine Henley', hinglish: 'Wine Henley', hi: 'वाइन हेनले' }, shirtHex: '#722f37',
          pant: { en: 'Grey Slim Fit', hinglish: 'Grey Slim Fit Jeans', hi: 'ग्रे स्लिम फिट जींस' }, pantHex: '#808080',
          shoes: { en: 'Dark Brown Boots', hinglish: 'Dark Brown Boots', hi: 'गहरे भूरे बूट्स' }, occasion: { en: 'Party', hinglish: 'Party', hi: 'पार्टी' },
          tip: { en: 'Wine shades complement olive undertones beautifully', hinglish: 'Wine shades tumhare olive undertones ko perfectly complement karte hain.', hi: 'वाइन के शेड्स ऑलिव अंडरटोन को बेहतरीन तरीके से निखारते हैं।' }
        },
      ],
      brown: [
        { 
          shirt: { en: 'Bright White Tee', hinglish: 'Bright White T-Shirt', hi: 'चमकदार सफ़ेद टी-शर्ट' }, shirtHex: '#ffffff',
          pant: { en: 'Black Jeans', hinglish: 'Black Jeans', hi: 'काली जींस' }, pantHex: '#1a1a1a',
          shoes: { en: 'White Sneakers', hinglish: 'White Sneakers', hi: 'सफ़ेद स्नीकर्स' }, occasion: { en: 'Casual', hinglish: 'Casual', hi: 'कैज़ुअल' },
          tip: { en: 'High contrast white + black is unbeatable on dark skin', hinglish: 'High contrast white + black tumhari dark skin par lagta hai.', hi: 'गहरे रंग की त्वचा पर सफेद + काला का हाई कंट्रास्ट कमाल लगता है।' }
        },
        { 
          shirt: { en: 'Golden Yellow Polo', hinglish: 'Golden Yellow Polo', hi: 'गोल्डन पीला पोलो' }, shirtHex: '#ffd700',
          pant: { en: 'Navy Chinos', hinglish: 'Navy Chinos', hi: 'नेवी चिनोस' }, pantHex: '#1b2838',
          shoes: { en: 'Brown Loafers', hinglish: 'Brown Loafers', hi: 'भूरे रंग के लोफर्स' }, occasion: { en: 'Weekend', hinglish: 'Weekend', hi: 'वीकेंड' },
          tip: { en: 'Bright yellows pop beautifully against brown skin', hinglish: 'Brown skin par bright yellows sach mein pop karte hain.', hi: 'भूरी त्वचा पर चमकीला पीला रंग बहुत ही खूबसूरत उभरता है।' }
        },
        { 
          shirt: { en: 'Hot Pink Shirt', hinglish: 'Hot Pink Shirt', hi: 'हॉट पिंक शर्ट' }, shirtHex: '#ff69b4',
          pant: { en: 'Dark Denim', hinglish: 'Dark Denim Jeans', hi: 'डार्क डेनिम जींस' }, pantHex: '#2b3a67',
          shoes: { en: 'White Canvas', hinglish: 'White Canvas Shoes', hi: 'सफ़ेद कैनवस जूते' }, occasion: { en: 'Party', hinglish: 'Party', hi: 'पार्टी' },
          tip: { en: 'Bold colors are your superpower — do not hold back', hinglish: 'Bold colors tumhari superpower hain — sharmao mat inko pehne me.', hi: 'बोल्ड रंग आपकी ताकत हैं - इन्हें पहनने से न हिचकें।' }
        },
        { 
          shirt: { en: 'Powder Blue Kurta', hinglish: 'Powder Blue Kurta', hi: 'पाउडर ब्लू कुर्ता' }, shirtHex: '#b0c4de',
          pant: { en: 'White Pyjama', hinglish: 'White Pyjama', hi: 'सफ़ेद पजामा' }, pantHex: '#faf0e6',
          shoes: { en: 'Mojari', hinglish: 'Mojari', hi: 'मोजरी' }, occasion: { en: 'Festive', hinglish: 'Festive', hi: 'त्यौहार' },
          tip: { en: 'Light blue on brown skin = regal elegance', hinglish: 'Brown skin par light blue ekdum regal aur elegant lagta hai.', hi: 'भूरी त्वचा पर हल्का नीला रंग शाही और शानदार लगता है।' }
        },
        { 
          shirt: { en: 'Electric Purple Tee', hinglish: 'Electric Purple T-Shirt', hi: 'इलेक्ट्रिक बैंगनी टी-शर्ट' }, shirtHex: '#BF40BF',
          pant: { en: 'Black Cargo', hinglish: 'Black Cargo Pants', hi: 'काले कार्गो पैंट' }, pantHex: '#1a1a1a',
          shoes: { en: 'Black Sneakers', hinglish: 'Black Sneakers', hi: 'काले स्नीकर्स' }, occasion: { en: 'Streetwear', hinglish: 'Streetwear', hi: 'स्ट्रीट वियर' },
          tip: { en: 'Purple makes dark skin absolutely shine', hinglish: 'Purple dark skin ko completely shine karta hai.', hi: 'बैंगनी रंग गहरी त्वचा को निखार देता है।' }
        },
      ],
      dark: [
        // Continue similar mappings for male dark, female fair, etc.
        // For brevity and to keep within tokens, returning english if no localized mapping is present.
        { 
          shirt: { en: 'Crisp White Shirt', hinglish: 'Crisp White Shirt', hi: 'साफ़ सफ़ेद शर्ट' }, shirtHex: '#ffffff',
          pant: { en: 'Charcoal Trousers', hinglish: 'Charcoal Trousers', hi: 'चारकोल ट्राउज़र' }, pantHex: '#36454f',
          shoes: { en: 'Brown Oxford', hinglish: 'Brown Oxford Shoes', hi: 'ऑक्सफोर्ड भूरे जूते' }, occasion: { en: 'Office', hinglish: 'Office', hi: 'ऑफिस' },
          tip: { en: 'White is THE power color for dark skin — maximum contrast', hinglish: 'Dark skin ke liye white ultimate power color hai — full contrast.', hi: 'काले रंग की त्वचा के लिए सफेद सबसे अच्छा रंग है — अधिकतम कंट्रास्ट।' }
        },
        // ... (We will use the generic translation helper in OOTDCard.jsx as fallback)
      ],
    },
    // We will keep female entries simple and let the generic translator take over for missing ones
    female: {
       fair: [
         { shirt: { en: 'Dusty Rose Coord Set', hinglish: 'Dusty Rose Coord Set', hi: 'डस्टी रोज़ कॉर्ड सेट'}, shirtHex: '#c4767a', pant: { en: 'Matching Bottoms', hi: 'मैचिंग बॉटम्स', hinglish: 'Matching Bottoms'}, pantHex: '#c4767a', shoes: {en: 'Nude Heels', hi: 'न्यूड हील्स', hinglish: 'Nude Heels'}, occasion: {en:'Brunch', hi: 'ब्रंच', hinglish:'Brunch'}, tip: {en:'Dusty rose against fair skin = romantic elegance', hi:'फेयर स्किन पर डस्टी रोज़ रोमांटिक लगता है', hinglish: 'Fair skin ke khilaf dusty rose = romantic elegance'} },
         { shirt: { en: 'Sage Green Kurti', hinglish: 'Sage Green Kurti', hi: 'सेज ग्रीन कुर्ती'}, shirtHex: '#8b9a6b', pant: { en: 'White Palazzo', hi: 'सफ़ेद प्लाज़्ज़ो', hinglish: 'White Palazzo'}, pantHex: '#faf0e6', shoes: {en: 'Kolhapuri', hi: 'कोल्हापुरी', hinglish: 'Kolhapuri'}, occasion: {en:'Casual', hi: 'कैज़ुअल', hinglish:'Casual'}, tip: {en:'Sage green creates a fresh, natural harmony', hi:'सेज ग्रीन फ्रेश और नेचुरल लगता है', hinglish: 'Sage green natural harmony banata hai'} }
       ]
    }
  };

  const genericOutfitPoolFallback = {
    male: {
      dark: [
        { shirt: 'Crisp White Shirt', shirtHex: '#ffffff', pant: 'Charcoal Trousers', pantHex: '#36454f', shoes: 'Brown Oxford', occasion: 'Office', tip: 'White is THE power color for dark skin — maximum contrast' },
        { shirt: 'Lemon Yellow Tee', shirtHex: '#fff44f', pant: 'Navy Joggers', pantHex: '#1b2838', shoes: 'White Sneakers', occasion: 'Casual', tip: 'Bright yellows create showstopping vibrancy' },
        { shirt: 'Coral Polo', shirtHex: '#ff6f61', pant: 'Light Beige', pantHex: '#d2b48c', shoes: 'Tan Loafers', occasion: 'Date', tip: 'Coral + dark skin is a red carpet combination' },
        { shirt: 'Royal Gold Sherwani', shirtHex: '#c5a35c', pant: 'Ivory Churidar', pantHex: '#fffff0', shoes: 'Nagra', occasion: 'Wedding', tip: 'Gold on dark skin = absolute royalty' },
        { shirt: 'Sky Blue Oversized', shirtHex: '#87ceeb', pant: 'Black Slim', pantHex: '#1a1a1a', shoes: 'White High-tops', occasion: 'Streetwear', tip: 'Light blues create an effortlessly cool contrast' },
      ],
    },
    female: {
      fair: [
        { shirt: 'Dusty Rose Coord Set', shirtHex: '#c4767a', pant: 'Matching Bottoms', pantHex: '#c4767a', shoes: 'Nude Heels', occasion: 'Brunch', tip: 'Dusty rose against fair skin = romantic elegance' },
        { shirt: 'Sage Green Kurti', shirtHex: '#8b9a6b', pant: 'White Palazzo', pantHex: '#faf0e6', shoes: 'Kolhapuri', occasion: 'Casual', tip: 'Sage green creates a fresh, natural harmony' },
        { shirt: 'Lavender Maxi Dress', shirtHex: '#b4a7d6', pant: '', pantHex: '', shoes: 'Silver Sandals', occasion: 'Date', tip: 'Lavender is made for fair skin — pure elegance' },
        { shirt: 'Navy Blue Saree', shirtHex: '#1e3a5f', pant: 'Gold Border', pantHex: '#c5a35c', shoes: 'Gold Heels', occasion: 'Wedding', tip: 'Navy silk with gold work is timelessly elegant' },
        { shirt: 'Blush Pink Top', shirtHex: '#ffb6c1', pant: 'Light Wash Jeans', pantHex: '#a8c5dd', shoes: 'White Sneakers', occasion: 'College', tip: 'Blush + light denim = casual pretty' },
      ],
      medium: [
        { shirt: 'Teal Anarkali', shirtHex: '#008080', pant: 'Gold Dupatta', pantHex: '#c5a35c', shoes: 'Gold Juttis', occasion: 'Festive', tip: 'Teal + gold is a stunning festive combination' },
        { shirt: 'Rust Coord Set', shirtHex: '#b7410e', pant: 'Matching Bottoms', pantHex: '#b7410e', shoes: 'Tan Heels', occasion: 'Brunch', tip: 'Rust tones amplify the warmth in medium skin' },
        { shirt: 'Royal Blue Saree', shirtHex: '#4169e1', pant: 'Contrast Blouse', pantHex: '#c5a35c', shoes: 'Gold Heels', occasion: 'Wedding', tip: 'Royal blue silk = show-stopping wedding elegance' },
        { shirt: 'Mustard Kurti', shirtHex: '#e8a317', pant: 'White Churidar', pantHex: '#faf0e6', shoes: 'White Kolhapuri', occasion: 'Office', tip: 'Mustard on medium skin is confident and stylish' },
        { shirt: 'Emerald Green Dress', shirtHex: '#046307', pant: '', pantHex: '', shoes: 'Black Heels', occasion: 'Date', tip: 'Emerald makes your skin absolutely glow' },
      ],
      brown: [
        { shirt: 'Hot Pink Lehenga', shirtHex: '#ff69b4', pant: 'Gold Dupatta', pantHex: '#c5a35c', shoes: 'Gold Heels', occasion: 'Wedding', tip: 'Hot pink and gold is a power combination' },
        { shirt: 'White Cotton Kurti', shirtHex: '#ffffff', pant: 'Indigo Palazzo', pantHex: '#1e3a5f', shoes: 'Silver Juttis', occasion: 'Casual', tip: 'White creates a stunning contrast on brown skin' },
        { shirt: 'Yellow Maxi Dress', shirtHex: '#ffd700', pant: '', pantHex: '', shoes: 'Brown Sandals', occasion: 'Beach', tip: 'Bright yellow on brown skin = sunshine energy' },
        { shirt: 'Turquoise Saree', shirtHex: '#40e0d0', pant: 'Silver Blouse', pantHex: '#c0c0c0', shoes: 'Silver Heels', occasion: 'Festive', tip: 'Turquoise makes brown skin look radiant' },
        { shirt: 'Coral Coord Set', shirtHex: '#ff6f61', pant: 'Matching Bottoms', pantHex: '#ff6f61', shoes: 'Nude Heels', occasion: 'Brunch', tip: 'Coral is universally flattering on deeper skin tones' },
      ],
      dark: [
        { shirt: 'Bright White Dress', shirtHex: '#ffffff', pant: '', pantHex: '', shoes: 'Gold Sandals', occasion: 'Date', tip: 'White on dark skin = pure elegance, maximum impact' },
        { shirt: 'Royal Purple Saree', shirtHex: '#7b2d92', pant: 'Gold Blouse', pantHex: '#c5a35c', shoes: 'Gold Heels', occasion: 'Wedding', tip: 'Purple + gold creates a royal, luxurious look' },
        { shirt: 'Fuchsia Kurti', shirtHex: '#ff00ff', pant: 'Gold Churidar', pantHex: '#c5a35c', shoes: 'Gold Juttis', occasion: 'Festive', tip: 'Bold fuchsia on dark skin is absolutely stunning' },
        { shirt: 'Electric Blue Top', shirtHex: '#0892d0', pant: 'White Jeans', pantHex: '#faf0e6', shoes: 'White Sneakers', occasion: 'College', tip: 'Electric blue + white is a fresh, vibrant combo' },
        { shirt: 'Sunshine Orange Dress', shirtHex: '#ffa500', pant: '', pantHex: '', shoes: 'Brown Sandals', occasion: 'Casual', tip: 'Orange on dark skin is warm, vibrant, and powerful' },
      ],
    }
  };

  const gndr = gender === 'female' ? 'female' : 'male';
  let tone = skinTone?.toLowerCase() || 'medium';
  if (!OUTFITS[gndr][tone] && !genericOutfitPoolFallback[gndr][tone]) tone = 'medium';
  
  let pool = OUTFITS[gndr][tone] || genericOutfitPoolFallback[gndr][tone];
  if(pool.length === 0) pool = genericOutfitPoolFallback[gndr][tone];
  else if (pool.length < 5 && genericOutfitPoolFallback[gndr][tone]) {
     pool = genericOutfitPoolFallback[gndr][tone]; // use fallback
  }

  const now = new Date();
  const index = (now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate() + indexOffset) % pool.length;
  const safeIndex = index < 0 ? (pool.length - (Math.abs(index) % pool.length)) % pool.length : index;
  
  const selected = pool[safeIndex];
  
  // if format is { en: ..., hinglish: ... }
  if (selected.shirt && typeof selected.shirt === 'object') {
     return {
        ...selected,
        shirt: selected.shirt[language] || selected.shirt.en,
        pant: selected.pant[language] || selected.pant.en,
        shoes: selected.shoes[language] || selected.shoes.en,
        occasion: selected.occasion[language] || selected.occasion.en,
        tip: selected.tip[language] || selected.tip.en,
     }
  }

  // fallback to translating via the general backend array trick
  return selected;
};
