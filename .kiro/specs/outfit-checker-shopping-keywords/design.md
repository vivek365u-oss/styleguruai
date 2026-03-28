# Outfit Checker Shopping Keywords — Bugfix Design

## Overview

`OutfitChecker.jsx` ka `OutfitShopCard` component hardcoded keyword `"men tshirt polo shirt"` use karta hai chahe detected outfit color kuch bhi ho. Iska matlab hai ki Navy Blue, Rust, ya Coral — sab ke liye same generic Amazon/Flipkart/Myntra/Meesho links generate hote hain. Saath hi, `ResultsDisplay.jsx` ke `ShoppingLinks` component mein jo fallback URLs hain (jab color `topPicksMap` mein nahi hota), woh bhi color-specific nahi hain aur trending 2025 keywords miss karte hain.

Fix approach: `OutfitShopCard` mein URL construction ko `categoryConfig`-style dynamic keyword building se replace karna — detected `color.name` + trending terms inject karna. `ShoppingLinks` ke fallback `cfg` object ko bhi same pattern follow karna.

## Glossary

- **Bug_Condition (C)**: Woh condition jab `OutfitShopCard` ya `ShoppingLinks` fallback ek color ke liye URL banata hai lekin us color ka naam URL mein nahi hota aur koi trending keyword bhi nahi hota
- **Property (P)**: Desired behavior — generated shopping URL mein detected color name aur kam se kam ek trending 2025 keyword hona chahiye
- **Preservation**: `topPicksMap` ke curated entries, budget filter logic, aur baaki UI behavior (expand, save, score display) unchanged rehna chahiye
- **OutfitShopCard**: `OutfitChecker.jsx` mein component jo `better_alternatives` list ke har color ke liye shopping links render karta hai
- **ShoppingLinks**: `ResultsDisplay.jsx` mein component jo skin tone analysis results ke liye color cards mein shopping links render karta hai
- **topPicksMap**: `ShoppingLinks` mein curated color+category → URL mapping; agar match mile toh yeh URLs use hote hain
- **colorDisplay**: `color.name.toLowerCase()` — URL keyword construction mein use hota hai
- **colorLower**: `colorDisplay.replace(/\s+/g, '+')` — URL path segments mein use hota hai
- **trending keywords**: 2025 fashion terms: `"oversized"`, `"trending 2025"`, `"streetwear"`, `"coord set"`, `"cargo"`

## Bug Details

### Bug Condition

Bug tab manifest hota hai jab `OutfitShopCard` kisi bhi color ke liye shopping URLs banata hai — `color.name` available hota hai lekin URL mein sirf `"men tshirt polo shirt"` hardcoded string use hoti hai. Similarly, `ShoppingLinks` mein jab `topPicksMap` mein color+category match nahi milta, fallback `cfg` object ka `fkCat` generic category use karta hai bina color-specific trending keywords ke.

**Formal Specification:**
```
FUNCTION isBugCondition(colorName, generatedURL)
  INPUT: colorName — string (e.g., "Navy Blue"), generatedURL — string
  OUTPUT: boolean

  colorInURL   := colorName.toLowerCase() IN generatedURL.toLowerCase()
  hasTrending  := ANY keyword IN ["oversized", "trending 2025", "streetwear",
                                   "coord set", "cargo"] WHERE keyword IN generatedURL

  RETURN NOT colorInURL OR NOT hasTrending
END FUNCTION
```

### Examples

- User "Navy Blue" outfit upload karta hai → Amazon URL: `...k=navy+blue+men+tshirt+polo+shirt` — "navy blue" hai lekin "oversized" ya "trending 2025" nahi ❌
- User "Rust" outfit upload karta hai → Amazon URL: `...k=rust+men+tshirt+polo+shirt` — "polo shirt" generic hai, "streetwear" ya "trending 2025" nahi ❌
- User "Coral" outfit upload karta hai → Meesho URL: `...q=coral+men+tshirt+shirt` — trending keywords absent ❌
- `ShoppingLinks` mein "Lavender" color (not in topPicksMap) → Flipkart fallback: `...q=lavender&sort=popularity` — color hai lekin trending keywords nahi ❌
- `ShoppingLinks` mein "Navy Blue" + "shirt" category (in topPicksMap) → curated URL use hota hai ✅ (yeh preserved rehna chahiye)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `ShoppingLinks` mein `topPicksMap` ke curated entries (navy blue, teal, rust, cobalt blue, forest green, mustard, burgundy, coral) pehle ki tarah use hone chahiye — koi change nahi
- Budget filter (₹500, ₹1000, ₹2000, Any) `OutfitShopCard` aur `ShoppingLinks` dono mein pehle ki