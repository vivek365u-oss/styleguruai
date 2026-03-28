# Bugfix Requirements Document

## Introduction

Outfit Checker mein jab user apna kapda upload karta hai aur AI uska dominant color detect karta hai (e.g., "Navy Blue", "Rust", "Coral"), toh "Better Alternatives — Shop Now" section ke shopping links aur keywords us detected color ko reflect nahi karte. `OutfitShopCard` component hardcoded generic keywords use karta hai (`"men tshirt polo shirt"`) chahe outfit ka color kuch bhi ho. Iska result yeh hota hai ki user Navy Blue outfit upload kare toh bhi shopping links generic results dikhate hain, color-specific aur trend-aware results nahi. Yeh feature ka core value destroy karta hai.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN user outfit checker mein koi bhi color ka kapda upload karta hai THEN `OutfitShopCard` component Amazon, Flipkart, Myntra, aur Meesho ke liye hardcoded keyword `"men tshirt polo shirt"` use karta hai, detected outfit color ko completely ignore karta hai

1.2 WHEN backend `outfit_analysis.color_name` (e.g., "Navy Blue", "Rust", "Forest Green") return karta hai THEN `OutfitShopCard` us color name ko shopping URL construction mein use nahi karta — `colorDisplay` variable set hota hai lekin URL mein sirf generic category terms append hote hain bina trend keywords ke

1.3 WHEN `better_alternatives` list mein koi color hota hai jiska `topPicksMap` mein entry nahi hai THEN `ShoppingLinks` component generic fallback URL use karta hai jo color-specific results nahi dikhata

1.4 WHEN shopping links generate hote hain THEN koi bhi trending/2025 fashion keywords (e.g., "oversized", "streetwear", "coord set", "trending 2025") include nahi hote `OutfitShopCard` ke URLs mein

### Expected Behavior (Correct)

2.1 WHEN user outfit checker mein koi color ka kapda upload karta hai THEN `OutfitShopCard` ko detected `outfit_analysis.color_name` ko dynamically shopping keywords mein inject karna chahiye, taaki har platform ka URL us exact color ke results dikhaye

2.2 WHEN `OutfitShopCard` Amazon URL banata hai THEN URL mein detected color name + trending 2025 fashion keywords (e.g., `"navy blue men oversized tshirt trending 2025"`) hone chahiye, generic `"men tshirt polo shirt"` nahi

2.3 WHEN `OutfitShopCard` Flipkart, Myntra, aur Meesho URLs banata hai THEN har URL mein detected color name dynamically include hona chahiye with platform-appropriate category paths

2.4 WHEN `better_alternatives` mein koi color hota hai THEN `ShoppingLinks` component ko us color ke liye color-specific + trend-aware keywords use karne chahiye, chahe `topPicksMap` mein curated entry ho ya na ho

2.5 WHEN outfit color detect hota hai THEN shopping keywords mein current 2025 trending terms (e.g., "oversized", "cargo", "coord set", "streetwear") include hone chahiye jo color ke saath combine hon

### Unchanged Behavior (Regression Prevention)

3.1 WHEN `ResultsDisplay.jsx` ke `ShoppingLinks` component mein koi color hota hai jiska `topPicksMap` mein curated entry hai THEN woh curated "Top Pick" URLs pehle ki tarah use hone chahiye (regression nahi hona chahiye)

3.2 WHEN user budget filter (₹500, ₹1000, ₹2000, Any) select karta hai THEN price filtering `OutfitShopCard` mein bhi pehle ki tarah kaam karna chahiye

3.3 WHEN outfit checker compatibility score, verdict, skin tone analysis, aur undertone tip display hote hain THEN yeh sab unchanged rehne chahiye — sirf shopping keywords fix ho rahe hain

3.4 WHEN `ShoppingLinks` component `ResultsDisplay.jsx` mein skin tone analysis results ke liye use hota hai THEN uska existing behavior (color card expand, save, budget filter) unchanged rehna chahiye
